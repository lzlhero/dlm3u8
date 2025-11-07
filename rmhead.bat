:: Copyright (c) 2025 lzlhero
:: Licensed under the GNU General Public License v3.0 (GPL-3.0)

@echo off

if "%~1"=="" (
  echo Usage: %~nx0 bytes-length files
  echo Note: The files argument supports file wildcards.
  exit /b 1
)

if "%~2"=="" (
  echo Error: missing files.
  exit /b 1
)

set /a start_byte=%1+1

for %%F in (%2) do (
  echo %%~nxF
  tail -c +%start_byte% "%%~fF" >"%%~dpnF.tmp"
  move /Y "%%~dpnF.tmp" "%%~fF" >NUL
)
