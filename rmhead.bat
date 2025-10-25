:: Copyright (c) 2025 lzlhero
:: Licensed under the GNU General Public License v3.0 (GPL-3.0)

@echo off

if "%~1"=="" (
  echo Usage: %~nx0 filename bytes-length
  exit /b 1
)

if "%~2"=="" (
  echo Error: missing bytes-length parameter.
  exit /b 1
)

for %%F in (%1) do (
  echo %%~nxF

  dd if="%%~fF" of="%%~dpnF.tmp" bs=%2 skip=1 status=none
  move /Y "%%~dpnF.tmp" "%%~fF" >nul
)
