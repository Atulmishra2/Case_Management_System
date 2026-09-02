@echo off
setlocal
cd /d "%~dp0"
set "ELECTRON_EXE=%~dp0..\node_modules\electron\dist\electron.exe"

if exist "%ELECTRON_EXE%" (
    start "" "%ELECTRON_EXE%" "%~dp0widget-main.js"
) else (
    start "" npx electron "%~dp0widget-main.js"
)
exit
