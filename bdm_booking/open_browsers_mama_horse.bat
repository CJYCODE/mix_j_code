@echo off
@REM echo Killing existing Chrome instances...
@REM taskkill /IM chrome.exe /F
@REM timeout /t 3

timeout /t 3

echo Starting Chrome instances with remote debugging...
start chrome.exe --remote-debugging-port=9225  --user-data-dir="C:\chrome-data\debug5" --new-window --profile-directory="Profile 5"

timeout /t 0.2
start chrome.exe --remote-debugging-port=9226 --user-data-dir="C:\chrome-data\debug6" --new-window --profile-directory="Profile 6"

timeout /t 0.2
start chrome.exe --remote-debugging-port=9227 --user-data-dir="C:\chrome-data\debug7" --new-window --profile-directory="Profile 7"


echo Running the script...
node inject_mama_horse.js

pause 