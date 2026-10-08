@echo off
setlocal
set "SOURCE=%~dp0"
set "DEST=C:\xampp3\htdocs\fishertown-sunnybay"
echo ====================================================
echo  FisherTown Sunny Bay v0.5 - XAMPP3 Installer
echo ====================================================
if not exist "C:\xampp3\htdocs" (
 echo [FAIL] Missing C:\xampp3\htdocs
 echo Install XAMPP3 or edit DEST in this file.
 pause
 exit /b 1
)
if not exist "%DEST%" mkdir "%DEST%"
robocopy "%SOURCE%" "%DEST%" /E /R:2 /W:1 /XF INSTALL-XAMPP3.cmd START-WINDOWS.cmd /XD design tests >nul
if errorlevel 8 (
 echo [FAIL] File copy failed.
 pause
 exit /b 1
)
echo [OK] Installed to %DEST%
echo [INFO] Start Apache in XAMPP Control Panel, then visit:
echo        http://localhost/fishertown-sunnybay/
start "" "http://localhost/fishertown-sunnybay/"
pause
