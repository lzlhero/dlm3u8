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

for %%F in (%2) do (
  echo %%~nxF
  dd if="%%~fF" of="%%~dpnF.tmp" bs="%1" skip=1 status=none
  move /Y "%%~dpnF.tmp" "%%~fF" >NUL
)
