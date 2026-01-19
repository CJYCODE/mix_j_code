@echo off
echo Killing existing Chrome instances...
taskkill /IM chrome.exe /F
timeout /t 1

echo Starting Chrome instances with remote debugging...
start chrome.exe --remote-debugging-port=9222  --user-data-dir=".\chrome-data\debug8" --new-window --profile-directory="Profile 8"

@REM timeout /t 1
@REM start chrome.exe --remote-debugging-port=9223 --user-data-dir="C:\chrome-data\debug9" --new-window --profile-directory="Profile 9"

@REM timeout /t 1
@REM start chrome.exe --remote-debugging-port=9224 --user-data-dir="C:\chrome-data\debug3" --new-window --profile-directory="Profile 3"

@REM timeout /t 1
@REM start chrome.exe --remote-debugging-port=9228 --user-data-dir="C:\chrome-data\debug10" --new-window --profile-directory="Profile 10"

echo Running the script...
node inject_chun_spring.js

pause 