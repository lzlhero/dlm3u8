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

:: set input file and output file
set "input=%~1"
set "output=%basename%.mp4"

:: validate output file name
if not exist "%output%" (
  copy NUL "%output%" >NUL 2>&1
  if %ERRORLEVEL%==0 (
    del /f /q "%output%"
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
set "scanlog=%basename%.ffmpeg.scan.log"
echo Generating "%scanlog%" for advertisement removal...
ffmpeg -allowed_extensions ALL -protocol_whitelist "file,crypto,data" -i "%input%" -c copy -f null NUL > "%scanlog%" 2>&1
if not %ERRORLEVEL%==0 (
  echo Error: Generating "%scanlog%" file errors.
  exit /b 1
)

:: rebuild m3u8 to remove ads
node "%~dp0\js\fixm3u8.js" "%input%" "%scanlog%"
if not %ERRORLEVEL%==0 (
  exit /b 1
)

:merge
:: merge all ts files to mp4 file
set "mergelog=%basename%.ffmpeg.merge.log"
echo.
echo Merging "%output%" based on "%input%"...
ffmpeg -y -allowed_extensions ALL -protocol_whitelist "file,crypto,data" -i "%input%" -c copy "%output%" > "%mergelog%" 2>&1
if %ERRORLEVEL%==0 (
  echo Successfully merged "%output%".
) else (
  echo Error: Failed to merge "%output%".
  exit /b 1
)
