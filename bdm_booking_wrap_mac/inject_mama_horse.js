/**
 * Chrome Multi-Tab Automation Script
 * Version: 1.0.0
 * 
 * Description:
 * This script automates the process of creating and managing multiple Chrome browser instances
 * with multiple tabs for automated web interactions. It successfully creates 6 tabs across
 * 3 browser instances (2 tabs per browser) and injects custom JavaScript into each tab.
 * 
 * Features:
 * - Manages multiple Chrome instances on different debugging ports (9222, 9223, 9224)
 * - Creates and controls 2 tabs per browser instance
 * - Implements robust tab creation and connection handling
 * - Provides detailed logging for debugging and monitoring
 * 
 * Author: Assistant
 * Date: 2024
 */

const CDP = require('chrome-remote-interface');
const puppeteer = require('puppeteer');
const http = require('http');

// This array will store the different ports for each browser instance
const ports = [9225, 9226, 9227];

// Keep track of which pages have had the script injected
const injectedPages = new Set();

async function waitForTarget(targetId, maxRetries = 10) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`Attempt ${i + 1}/${maxRetries} to connect to target ${targetId}...`);
            const client = await CDP({ target: targetId });
            console.log(`Successfully connected to target ${targetId}`);
            return client;
        } catch (err) {
            console.log(`Failed to connect to target ${targetId} on attempt ${i + 1}: ${err.message}`);
            if (i < maxRetries - 1) {
                const waitTime = Math.min(1000 * Math.pow(2, i), 10000); // Exponential backoff up to 10 seconds
                console.log(`Waiting ${waitTime}ms before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    throw new Error(`Failed to connect to target ${targetId} after ${maxRetries} retries`);
}

async function waitForTargetReady(Target, targetId, maxRetries = 20) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`Checking target ${targetId} status (attempt ${i + 1}/${maxRetries})...`);
            const { targetInfos } = await Target.getTargets();
            const target = targetInfos.find(t => t.targetId === targetId);
            
            if (!target) {
                console.log(`Target ${targetId} not found in target list`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            if (target.webSocketDebuggerUrl) {
                console.log(`Target ${targetId} is ready with webSocketDebuggerUrl: ${target.webSocketDebuggerUrl}`);
                return target;
            }

            console.log(`Target ${targetId} found but not ready yet (no webSocketDebuggerUrl), waiting...`);
            const waitTime = Math.min(1000 * Math.pow(2, i), 10000); // Exponential backoff up to 10 seconds
            await new Promise(resolve => setTimeout(resolve, waitTime));
        } catch (err) {
            console.log(`Error checking target ${targetId} status:`, err.message);
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    throw new Error(`Target ${targetId} not ready after ${maxRetries} retries`);
}

async function getOrCreateTab(Target, port) {
    // First try to find an existing tab

    console.log('88888???:');
    const { targetInfos } = await Target.getTargets();
    console.log('99999???:', targetInfos);
    
    // Look for an existing tab that's not the current one
    const existingTabs = targetInfos.filter(t => 
        t.type === 'page' && 
        t.url !== 'about:blank' && 
        t.webSocketDebuggerUrl
    );

    if (existingTabs.length > 1) {
        // Use an existing tab if available
        console.log(`Found existing tab to use for port ${port}`);
        return existingTabs[1]; // Use the second tab if available
    }

    // If no suitable existing tab found, create a new one using CDP directly
    console.log(`Creating new tab for port ${port} using CDP...`);
    const newClient = await CDP({ port });
    const { targetId } = await newClient.Target.createTarget({ url: 'https://scr.cyc.org.tw/tp11.aspx?Module=ind&files=ind' });
    
    // Wait for the target to become "ready" (i.e., webSocketDebuggerUrl is available)
    let targetInfo;
    for (let i = 0; i < 100; i++) {
        const targets = await newClient.Target.getTargets();
        targetInfo = targets.targetInfos.find(t => t.targetId === targetId && t.webSocketDebuggerUrl);
        if (targetInfo) break;
        await new Promise(resolve => setTimeout(resolve, 1000)); // wait 200ms before retrying
    }

    if (!targetInfo || !targetInfo.webSocketDebuggerUrl) {
        throw new Error('Target did not become ready in time.');
    }
    
    await newClient.close();

    console.log('02222')

    // Wait for the target to be ready with webSocketDebuggerUrl
    let attempts = 0;
    const maxAttempts = 20;
    const waitTime = 10000; // 10 seconds

    while (attempts < maxAttempts) {
        console.log(`Waiting for target ${targetId} to be ready (attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));

        const { targetInfos: updatedTargets } = await Target.getTargets();


        updatedTargets.forEach(t => {
            console.log(`Target ${t.targetId}`, t.webSocketDebuggerUrl ? '✅ Ready' : '❌ Not ready');
        });


        const newTarget = updatedTargets.find(t => t.targetId === targetId);
        console.log('04444', newTarget);

        if (newTarget && newTarget.webSocketDebuggerUrl) {
            console.log(`Target ${targetId} is ready with webSocketDebuggerUrl`);
            return newTarget;
        }

        attempts++;
    }

    throw new Error(`Failed to create new tab for port ${port} after ${maxAttempts} attempts with ${waitTime/1000} second intervals`);
}

async function getWebSocketUrl(port) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:${port}/json/version`, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response.webSocketDebuggerUrl);
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function injectScript(port, attemptNumber = 0) {
    let client = null;
    let newClient = null;
    let browser = null;
    
    try {
        console.log(`Connecting to Chrome on port ${port}...`);
        client = await CDP({ port: port });
        console.log(`Successfully connected to Chrome on port ${port}`);

        const { Page, Runtime, Target } = client;

        console.log(`Enabling domains for port ${port}...`);
        await Page.enable();
        await Runtime.enable();
        console.log(`Domains enabled for port ${port}`);

        // Define the script to be injected
        const script = `
            const port = ${port};  // 手動嵌入數值
            const attemptNumber = ${attemptNumber};  // 嘗試次數
            
            console.log('11111???', port, 'attempt:', attemptNumber);
            
            const arrayPortFieldsTimeMap = {
                9225: [
                        {field:'A', time: "8", delay: "20"},
                        {field:'A', time: "8", delay: "20"},
                        {field:'A', time: "9", delay: "20"},
                        {field:'A', time: "8", delay: "200"},
                        {field:'A', time: "9", delay: "200"}
                    ],
                9226: [
                        {field:'B', time: "8", delay: "20"},
                        {field:'B', time: "8", delay: "20"},
                        {field:'B', time: "9", delay: "20"},
                        {field:'B', time: "8", delay: "200"},
                        {field:'B', time: "9", delay: "200"}
                    ],
                9227: [
                        {field:'C', time: "8", delay: "20"},
                        {field:'C', time: "8", delay: "20"},
                        {field:'C', time: "9", delay: "20"},
                        {field:'C', time: "8", delay: "200"},
                        {field:'C', time: "9", delay: "200"}
                    ]
            };

            const arrayMapFieldNumber = {
                'A': 2217,
                'B': 2214,
                'C': 2213,
                'D': 1182,
                'E': 1184
            };

            //dynamic get 8 days later date
            const setDate = "";
            const targetDate = setDate || new Date(new Date().setDate(new Date().getDate() + 8)).toISOString().split('T')[0].replace(/-/g, '/');
            const targetField = "";
            const targetTime = "";

            console.log('22222???:', targetDate);

            function openURLAtSpecificTime(url, hour, minute, second) {
                const now = new Date();
                const targetTime = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate()+1,
                    hour,
                    minute,
                    second
                );

                let delay = targetTime - now;
                console.log('Delay:', delay);
                delay = delay - arrayPortFieldsTimeMap[port][attemptNumber]['delay'];
                console.log('ms ahead:', arrayPortFieldsTimeMap[port][attemptNumber]['delay']);
                
                // Format the target time for display
                const targetTimeAhead = new Date(targetTime.getTime() - arrayPortFieldsTimeMap[port][attemptNumber]['delay']);
                const formattedTime = targetTimeAhead.getFullYear() + '/' +
                    String(targetTimeAhead.getMonth() + 1).padStart(2, '0') + '/' +
                    String(targetTimeAhead.getDate()).padStart(2, '0') + ' ' +
                    String(targetTimeAhead.getHours()).padStart(2, '0') + ':' +
                    String(targetTimeAhead.getMinutes()).padStart(2, '0') + ':' +
                    String(targetTimeAhead.getSeconds()).padStart(2, '0') + '.' +
                    String(targetTimeAhead.getMilliseconds()).padStart(3, '0');
                console.log('Will run at:', formattedTime);
                console.log('url to open:', url);
                console.log('Attempt:', attemptNumber);

                if (delay > 0) {
                    setTimeout(function () {
                        window.location.href = url;
                    }, delay);
                }
            }

            console.log('33333???:', arrayMapFieldNumber);
                
            urlToOpen = 'https://scr.cyc.org.tw/tp11.aspx?module=net_booking&files=booking_place&StepFlag=25&PT=1&D='+ targetDate +'&QPid='+ arrayMapFieldNumber[arrayPortFieldsTimeMap[port][attemptNumber]['field']] +'&QTime='+ arrayPortFieldsTimeMap[port][attemptNumber]['time'];
            const targetHour = 0;
            const targetMinute = 0;
            const targetSecond = 0;

            console.log('44444???:', urlToOpen);

            function closeSweetAlertAutomatically() {
                const swalDialog = document.querySelector('.swal2-popup');
                if (swalDialog && swalDialog.style.display !== 'none') {
                    const confirmButton = swalDialog.querySelector('.swal2-confirm');
                    if (confirmButton) {
                        confirmButton.click();
                    } else {
                        const closeButton = swalDialog.querySelector('.swal2-close');
                        if (closeButton) {
                            closeButton.click();
                        }
                    }
                }
            }

            function clickLoginButton() {
                console.log('Attempting to click login button...');
                
                // Check if we're already logged in by looking for lab_Name
                const nameLabel = document.querySelector('#lab_Name');
                if (nameLabel && nameLabel.textContent && nameLabel.textContent.trim() !== '') {
                    console.log('Already logged in, clicking home button...');
                    const homeButton = document.querySelector('a[onclick*="fun_A"][onclick*="module=ind"]');
                    if (homeButton) {
                        homeButton.click();
                    } else {
                        console.log('Home button not found, using direct URL...');
                        window.location.href = 'https://scr.cyc.org.tw/tp11.aspx?Module=ind&files=ind';
                    }
                    return true; // Return true to indicate we're logged in
                }

                const loginButton = document.querySelector('#login_but');
                if (loginButton) {
                    console.log('Login button found, clicking...');
                    try {
                        loginButton.click();
                        console.log('Login button clicked successfully');
                        // Wait a bit and check if login was successful
                        // setTimeout(() => {
                        //     const nameLabel = document.querySelector('#lab_Name');
                        //     if (nameLabel && nameLabel.textContent && nameLabel.textContent.trim() !== '') {
                        //         console.log('Login successful, clicking home button...');
                        //         const homeButton = document.querySelector('a[onclick*="fun_A"][onclick*="module=ind"]');
                        //         if (homeButton) {
                        //             homeButton.click();
                        //         } else {
                        //             console.log('Home button not found, using direct URL...');
                        //             // window.location.href = 'https://scr.cyc.org.tw/tp11.aspx?Module=ind&files=ind';
                        //         }
                        //     }
                        // }, 2000);
                    } catch (error) {
                        console.error('Error clicking login button:', error);
                    }
                } else {
                    console.log('Login button not found in the DOM');
                }
                return false; // Return false to indicate we're not logged in yet
            }

            console.log('55555???');

            console.log('66666???:', window.location.href);

            // Check if we're on the home page and need to schedule the URL
            const nameLabel = document.querySelector('#lab_Name');
            let statusLogin = nameLabel && nameLabel.textContent && nameLabel.textContent.trim() !== ''
            if (statusLogin) {
                console.log('???7777 On home page with user name, scheduling URL...');
                openURLAtSpecificTime(urlToOpen, targetHour, targetMinute, targetSecond);
            } else {
                // We're on the login page
                setTimeout(function() {
                    console.log('Attempting to close SweetAlert...');
                    closeSweetAlertAutomatically();
                }, 500);

                let count = 0;
                const intervalId = setInterval(function() {
                    console.log('Attempt ' + (count + 1) + ' of 10');
                    const isLoggedIn = clickLoginButton();
                    if (isLoggedIn) {
                        console.log('Login successful, stopping interval');
                        clearInterval(intervalId);
                    } else {
                        count++;
                        if (count >= 10) {
                            console.log('Reached maximum attempts, stopping interval');
                            clearInterval(intervalId);
                        }
                    }
                }, 4500);
            }
        `;

        if (attemptNumber > 0) {
            console.log(`Setting up tab ${attemptNumber + 1} for port ${port} using Puppeteer...`);
            
            try {
                // Get the WebSocket URL from Chrome
                const webSocketUrl = await getWebSocketUrl(port);
                console.log(`Got WebSocket URL: ${webSocketUrl}`);

                // Connect to existing Chrome instance using Puppeteer
                browser = await puppeteer.connect({
                    browserWSEndpoint: webSocketUrl,
                    defaultViewport: null
                });

                // Create a new page
                const page = await browser.newPage();
                console.log(`Created new page with Puppeteer for port ${port}`);

                // Navigate to the target URL
                await page.goto('https://scr.cyc.org.tw/tp11.aspx?module=ind&files=ind', {
                    waitUntil: 'networkidle0',
                    timeout: 60000
                });
                console.log(`Navigated to target URL for port ${port}`);

                // Inject the script
                await page.evaluate(script);
                console.log(`Script injected into tab ${attemptNumber + 1} for port ${port}`);

            } catch (err) {
                console.error(`Error setting up tab ${attemptNumber + 1} with Puppeteer for port ${port}:`, err);
                throw err;
            }
        } else {
            // First attempt - use the main target
            console.log(`Navigating to login page for main target on port ${port}...`);
            
            await Page.navigate({ url: 'https://scr.cyc.org.tw/tp11.aspx?module=login_page&files=login' });
            await Page.loadEventFired();
            console.log(`Navigation complete for main target on port ${port}`);

            console.log(`Injecting script for main target on port ${port}...`);
            await Runtime.evaluate({ expression: script });
            console.log(`Script injected for main target on port ${port}`);
        }

        console.log(`Script injected successfully on port ${port} for attempt ${attemptNumber}!`);
    } catch (err) {
        console.error(`Error injecting script on port ${port}:`, err);
        throw err;
    } finally {
        if (browser) {
            try {
                await browser.disconnect();
                console.log(`Disconnected Puppeteer browser for port ${port}`);
            } catch (err) {
                console.log(`Error disconnecting Puppeteer browser for port ${port}:`, err.message);
            }
        }
        if (newClient) {
            try {
                await newClient.close();
                console.log(`Closed connection to second tab for port ${port}`);
            } catch (err) {
                console.log(`Error closing second tab connection for port ${port}:`, err.message);
            }
        }
        if (client) {
            try {
                await client.close();
                console.log(`Closed connection to main target for port ${port}`);
            } catch (err) {
                console.log(`Error closing main target connection for port ${port}:`, err.message);
            }
        }
    }
}

// Main execution function
async function main() {
    for (const port of ports) {
        try {
            console.log(`\n=== Starting process for port ${port} ===\n`);
            
            // First attempt
            console.log(`Starting first attempt for port ${port}...`);
            await injectScript(port, 0);
            
            // Wait between attempts
            console.log(`Waiting 8 seconds before second attempt for port ${port}...`);
            await new Promise(resolve => setTimeout(resolve, 8000));
            
            // Second attempt
            console.log(`Starting second attempt for port ${port}...`);
            await injectScript(port, 1);
            
            // Wait between attempts
            console.log(`Waiting 1 seconds before third attempt for port ${port}...`);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Third attempt
            console.log(`Starting third attempt for port ${port}...`);
            await injectScript(port, 2);

            // Wait between attempts
            console.log(`Waiting 1 seconds before third attempt for port ${port}...`);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Third attempt
            console.log(`Starting third attempt for port ${port}...`);
            await injectScript(port, 3);

            // Wait between attempts
            console.log(`Waiting 1 seconds before third attempt for port ${port}...`);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Third attempt
            console.log(`Starting third attempt for port ${port}...`);
            await injectScript(port, 4);
            
            console.log(`\n=== Completed process for port ${port} ===\n`);

            // Wait between browsers
            if (port === ports[0]) {
                console.log(`Waiting 10 seconds before starting next browser...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (error) {
            console.error(`Failed to complete process for port ${port}:`, error);
            // Continue with the next port even if this one failed
            continue;
        }
    }
}

// Run the main function
main().catch(console.error);
