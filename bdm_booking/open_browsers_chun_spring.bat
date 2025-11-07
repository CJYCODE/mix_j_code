@echo off
echo Killing existing Chrome instances...
taskkill /IM chrome.exe /F
timeout /t 1

echo Starting Chrome instances with remote debugging...
start chrome.exe --remote-debugging-port=9222  --user-data-dir="C:\chrome-data\debug8" --new-window --profile-directory="Profile 8"

timeout /t 0.5
start chrome.exe --remote-debugging-port=9223 --user-data-dir="C:\chrome-data\debug9" --new-window --profile-directory="Profile 9"

timeout /t 0.5
start chrome.exe --remote-debugging-port=9224 --user-data-dir="C:\chrome-data\debug3" --new-window --profile-directory="Profile 3"


echo Running the script...
node inject_chun_spring.js

pause 