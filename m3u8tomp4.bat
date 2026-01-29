:: Copyright (c) 2025 lzlhero
:: Licensed under the GNU General Public License v3.0 (GPL-3.0)

@echo off & setlocal

:: display usage information
if "%~1"=="" (
  echo Usage: %~nx0 filename.m3u8 [filename.mp4]
  exit /b 1
)

if not exist "%~1" (
  echo Error: File "%~1" not found.
  exit /b 1
)

:: set basename
if "%~2"=="" (
  set "basename=%~n1"
) else (
  set "basename=%~2"
)
:trim_dot
if "%basename:~-1%"=="." (
  set "basename=%basename:~0,-1%"
  goto trim_dot
)
set "ext=%basename:~-4%"
if /i "%ext%"==".mp4" (
  set "basename=%basename:~0,-4%"
)

:: set files' name
set "input=%~1"
set "input_resources=%input%_resources"
set "output=%basename%.mp4"
set "scan_log=%basename%_scan.log"
set "merge_log=%basename%_merge.log"

:: validate output file name
if not exist "%output%" (
  copy NUL "%output%" >NUL 2>&1
  if %ERRORLEVEL%==0 (
    del /f /q "%output%" >NUL 2>&1
  ) else (
    echo Error: Invalid output file name or path in "%output%"
    exit /b 1
  )
)

:: check the fixm3u8 flag in the input file
find "# rebuilder: fixm3u8" "%input%" >NUL
if %ERRORLEVEL%==0 (
  goto merge
)

:: generate ffmpeg scan log
echo Generating "%scan_log%" for advertisement removal...
ffmpeg -allowed_extensions ALL -protocol_whitelist "file,crypto,data" -i "%input%" -c copy -f null NUL >"%scan_log%" 2>&1
if not %ERRORLEVEL%==0 (
  echo Error: There are errors in the generated "%scan_log%".
  exit /b 1
)

:: rebuild m3u8 to remove ads
node "%~dp0\js\fixm3u8.js" "%input%" "%scan_log%"
if not %ERRORLEVEL%==0 (
  exit /b 1
)

:merge
:: merge all ts files to mp4 file
echo.
echo Merging "%output%" based on "%input%"...
ffmpeg -y -allowed_extensions ALL -protocol_whitelist "file,crypto,data" -i "%input%" -c copy "%output%" >"%merge_log%" 2>&1
if not %ERRORLEVEL%==0 (
  echo Error: Failed to merge "%output%".
  exit /b 1
)

:: check the "discontinuity" keyword in ffmpeg merge log
find "discontinuity" "%merge_log%" >NUL
if %ERRORLEVEL%==0 (
  echo "%output%" was merged successfully, but ad removal failed. Please check the log files for details.
  exit /b 1
)

del /f /q "%input%" "%scan_log%" "%merge_log%" >NUL 2>&1
rmdir /s /q "%input_resources%" >NUL 2>&1
echo Successfully merged "%output%".
