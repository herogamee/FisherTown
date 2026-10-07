@echo off
setlocal
set "XAMPP_HTDOCS=C:\xampp3\htdocs"
set "DEST=%XAMPP_HTDOCS%\fishertown"

if not exist "%XAMPP_HTDOCS%" (
  echo [ERROR] Cannot find %XAMPP_HTDOCS%
  echo Edit XAMPP_HTDOCS in this file if XAMPP is installed elsewhere.
  pause
  exit /b 1
)

if not exist "%DEST%" mkdir "%DEST%"
robocopy "%~dp0" "%DEST%" /E /R:1 /W:1 /XF START-XAMPP.cmd >nul
if errorlevel 8 (
  echo [ERROR] Copy failed.
  pause
  exit /b 1
)

echo FisherTown copied to %DEST%
echo Make sure Apache is STARTED in XAMPP.
start "" "http://localhost/fishertown/"
exit /b 0
