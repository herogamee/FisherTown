@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8787/
  py -m http.server 8787
) else (
  echo Python is not installed. Copy this folder to C:\xampp3\htdocs\fishertown then Start Apache and open http://localhost/fishertown/
  pause
)
