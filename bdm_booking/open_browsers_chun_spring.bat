@echo off
echo Killing existing Chrome instances...
taskkill /IM chrome.exe /F
timeout /t 1

echo Starting Chrome instances with remote debugging...
start chrome.exe --remote-debugging-port=9222  --user-data-dir="C:\chrome-data\debug1" --new-window --profile-directory="Profile 1"

timeout /t 0.2
start chrome.exe --remote-debugging-port=9223 --user-data-dir="C:\chrome-data\debug2" --new-window --profile-directory="Profile 2"

timeout /t 0.2
start chrome.exe --remote-debugging-port=9224 --user-data-dir="C:\chrome-data\debug3" --new-window --profile-directory="Profile 3"


echo Running the script...
node inject_chun_spring.js

pause 