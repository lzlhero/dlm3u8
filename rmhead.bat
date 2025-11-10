:: Copyright (c) 2025 lzlhero
:: Licensed under the GNU General Public License v3.0 (GPL-3.0)

@echo off

if "%~1"=="" (
  echo Usage: %~nx0 bytes-length files
  echo Note: The files argument supports file wildcards.
  exit /b 1
)

echo %~1| findstr /R "^[1-9][0-9]*$" >NUL
if not %ERRORLEVEL%==0 (
  echo Error: bytes-length must be a positive integer. "%~1" is not.
  exit /b 1
)

if "%~2"=="" (
  echo Error: missing files.
  exit /b 1
)

set /a start_byte=%1+1

:loop
  shift
  if "%~1"=="" exit /b

  for %%F in ("%~1") do (
    if exist "%%~F" (
      if not exist "%%~F\" (
        echo %%~nxF
        tail -c +%start_byte% "%%~fF" >"%%~dpnF.tmp"
        move /Y "%%~dpnF.tmp" "%%~fF" >NUL
      )
    )
  )
goto loop
