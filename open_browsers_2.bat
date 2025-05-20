@echo off
echo Killing existing Chrome instances...
taskkill /IM chrome.exe /F
timeout /t 3

echo Starting Chrome instances with remote debugging...
start chrome.exe --remote-debugging-port=9222 --disable-popup-blocking  --user-data-dir="C:\chrome-data\debug1" --new-window --profile-directory="Profile 1"

timeout /t 1
start chrome.exe --remote-debugging-port=9223 --user-data-dir="C:\chrome-data\debug2" --new-window --profile-directory="Profile 2"

timeout /t 1
start chrome.exe --remote-debugging-port=9224 --user-data-dir="C:\chrome-data\debug3" --new-window --profile-directory="Profile 3"

@REM timeout /t 1
@REM start chrome.exe --remote-debugging-port=9225 --user-data-dir="C:\chrome-data\debug4" --new-window --profile-directory="Profile 4"



echo Waiting for Chrome to start...
timeout /t 5

echo Running the script...
node inject.js

pause 