@echo off
setlocal
cd /d "%~dp0widget"
set "ELECTRON_EXE=%~dp0node_modules\electron\dist\electron.exe"

if exist "%ELECTRON_EXE%" (
    start "" "%ELECTRON_EXE%" "%~dp0widget\widget-main.js"
) else (
    start "" npx electron "%~dp0widget\widget-main.js"
)
exit
