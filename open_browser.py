from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import UnexpectedAlertPresentException, NoAlertPresentException, TimeoutException, SessionNotCreatedException
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import time
import os
import tempfile

# --- Configuration ---
CHROMEDRIVER_PATH = r"D:\j\code\clip\chromedriver.exe" # Path to your chromedriver
PROFILE_USER_DATA_DIR = r"C:\Users\jhong\AppData\Local\Google\Chrome\User Data" # Base directory for profile data
PROFILE_DIRECTORY_NAME = "Profile 1" # The specific profile to use within the user_data_dir
TARGET_URL = "https://scr.cyc.org.tw/tp11.aspx?module=login_page&files=login"
# --- End Configuration ---

# Ensure profile base directory exists
# if not os.path.exists(PROFILE_USER_DATA_DIR):
#     try:
#         os.makedirs(PROFILE_USER_DATA_DIR)
#         print(f"Created profile base directory: {PROFILE_USER_DATA_DIR}")
#     except OSError as e:
#         print(f"Error creating profile base directory {PROFILE_USER_DATA_DIR}: {e}")
#         exit()

# --- Helper Function to Handle Alerts ---
def handle_potential_alerts(driver_instance, wait_time=2):
    """Checks for and handles standard alerts and SweetAlert2 dialogs."""
    print(f"--- Checking for alerts (wait up to {wait_time}s)...")
    handled_std = False
    handled_swal = False
    start_time = time.time()

    # Loop for a short duration to catch alerts that might appear sequentially
    while time.time() - start_time < wait_time:
        # Prioritize standard alerts as they block more severely
        try:
            alert = driver_instance.switch_to.alert
            alert_text = alert.text
            print(f"✅ Standard alert found: '{alert_text}'. Accepting...")
            alert.accept()
            print("✅ Standard alert accepted.")
            handled_std = True
            time.sleep(0.5) # Small pause after handling one
            continue # Check again immediately in case another pops up
        except NoAlertPresentException:
            pass # No standard alert currently, check for SweetAlert
        except Exception as std_alert_exc:
            print(f"⚠️ Error trying to handle standard alert: {std_alert_exc}")
            break # Exit check loop on unexpected error

        # Check for SweetAlert2 if no standard alert was found in this iteration
        try:
            # Use a very short wait here as we are polling
            confirm_button = WebDriverWait(driver_instance, 0.5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button.swal2-confirm"))
            )
            if confirm_button.is_displayed(): # Check if it's actually visible
                print("✅ SweetAlert2 OK button found. Clicking...")
                confirm_button.click()
                print("✅ SweetAlert2 OK button clicked.")
                handled_swal = True
                time.sleep(0.5) # Small pause
                continue # Check again
        except TimeoutException:
            pass # SweetAlert button not present or clickable yet
        except Exception as swal_exc:
            print(f"⚠️ Error trying to handle SweetAlert2: {swal_exc}")
            break # Exit check loop

        # If neither alert type was found in this iteration, pause briefly before next check
        time.sleep(0.2)

    print("--- Finished checking for alerts.")
    return handled_std or handled_swal # Return True if any alert was handled

# Setup Chrome options
options = Options()
options.add_argument(f"--user-data-dir={PROFILE_USER_DATA_DIR}")
options.add_argument(f"--profile-directory={PROFILE_DIRECTORY_NAME}")
options.add_argument("--start-maximized")
options.add_argument("--disable-extensions")

# Setup Chrome service
if not os.path.exists(CHROMEDRIVER_PATH):
    print(f"Error: ChromeDriver not found at specified path: {CHROMEDRIVER_PATH}")
    exit()
service = Service(executable_path=CHROMEDRIVER_PATH)

driver = None
try:
    print("Attempting to start WebDriver...")
    driver = webdriver.Chrome(service=service, options=options)
    print("WebDriver started successfully.")

    print(f"\nNavigating first tab to {TARGET_URL}...")
    driver.get(TARGET_URL)
    print("First tab navigation initiated.")

    # --- Handle INITIAL alerts/dialogs on the first tab ---
    handle_potential_alerts(driver, wait_time=5) # Wait longer after initial load

    # --- Now, try to open the second tab ---
    print("\nAttempting to open second tab...")
    driver.execute_script(f"window.open('{TARGET_URL}', '_blank');")
    print("Executed script to open second tab.")

    # --- IMMEDIATELY handle alerts triggered by opening the second tab ---
    # Call the handler function again, potentially multiple times if needed
    alerts_handled = handle_potential_alerts(driver, wait_time=3)
    if not alerts_handled:
        print("No alerts detected immediately after opening second tab.")
        time.sleep(1) # Still wait a moment just in case
        handle_potential_alerts(driver, wait_time=2) # One more check

    # --- Switch to the second tab ---
    print("\nAttempting to switch to second tab...")
    try:
        if len(driver.window_handles) > 1:
            driver.switch_to.window(driver.window_handles[-1]) # Switch to the newest window/tab
            print("✅ Switched to second tab.")
            # Handle alerts on the second tab after switching and loading
            print("Handling potential alerts on second tab...")
            handle_potential_alerts(driver, wait_time=5)
        else:
             print("⚠️ Could not switch: Only one window handle found.")
    except Exception as switch_exc:
        print(f"❌ Error switching to second tab: {switch_exc}")


    print("\nScript finished operations. Browser will remain open.")
    input("Press Enter to close the browser...")

except SessionNotCreatedException as e:
    print(f"❌ SessionNotCreatedException: Failed to create browser session: {e}")
except Exception as e:
    # Final catch-all, attempt to handle lingering alerts if possible
    if "unexpected alert open" in str(e).lower(): # Make check case-insensitive
         print(f"❌ Script crashed due to UNHANDLED unexpected alert!")
         try:
             # Check one last time right before quitting
             alert = driver.switch_to.alert
             print(f"   Final Alert Text: {alert.text}")
             alert.accept()
             print("   Accepted final alert.")
         except NoAlertPresentException:
             print("   Could not switch to alert during final crash handling.")
         except Exception as final_alert_exc:
              print(f"   Error handling final alert: {final_alert_exc}")
         print(f"   Original error details: {e}")
    else:
        print(f"❌ An unexpected error occurred during setup or execution: {e}")
        import traceback
        traceback.print_exc()

finally:
    if driver is not None:
        print("\nClosing browser...")
        driver.quit()
        print("Browser closed.")
