@echo off
rem Installs {Component} into the folder the host application reads it from.
rem Safe to run again after an update: an existing copy is replaced, not merged.
setlocal

set "NAME={Component}"
set "SOURCE=%~dp0%NAME%"
set "TARGET_DIR=%USERPROFILE%\{relative\path\to\host\folder}"
set "TARGET=%TARGET_DIR%\%NAME%"

if not exist "%SOURCE%\" (
  echo Error: the %NAME% folder must be next to this file. Extract the whole download and try again.
  goto :end_error
)
if "%USERPROFILE%"=="" (
  echo Error: USERPROFILE is not set. Nothing was changed.
  goto :end_error
)

if not exist "%TARGET_DIR%\" mkdir "%TARGET_DIR%"
if exist "%TARGET%\" rmdir /s /q "%TARGET%"
xcopy "%SOURCE%" "%TARGET%\" /e /i /q /y >nul
if errorlevel 1 (
  echo Error: copying failed.
  goto :end_error
)

echo.
echo %NAME% installed to:
echo   %TARGET%
echo.
echo Next: {what the user does in the host application}.
echo.
if "%CI%"=="" pause
exit /b 0

:end_error
if "%CI%"=="" pause
exit /b 1
