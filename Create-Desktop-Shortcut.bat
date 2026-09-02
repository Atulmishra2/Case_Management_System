@echo off
setlocal
echo ===================================================
echo Creating Desktop Shortcut for Case Tracker Widget...
echo ===================================================

powershell -NoProfile -Command "$desktop = [Environment]::GetFolderPath('Desktop'); $shortcutPath = Join-Path $desktop 'Case Tracker Widget.lnk'; $ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut($shortcutPath); $s.TargetPath = '%~dp0node_modules\electron\dist\electron.exe'; $s.Arguments = '\"%~dp0widget\widget-main.js\"'; $s.WorkingDirectory = '%~dp0widget'; $s.Description = 'Case Management System Desktop Widget'; $s.Save()"

echo.
echo [SUCCESS] Shortcut created on your Desktop as: "Case Tracker Widget.lnk"
echo.
pause
