@echo off & setlocal

:: display usage information
if "%~1"=="" (
  echo Usage: %~nx0 file.m3u8 [output.mp4]
  exit /b 1
)

if not exist "%~1" (
  echo Error: File "%~1" not found.
  exit /b 1
)

:: set mp4 output filename
if "%~2"=="" (
  set "output=output.mp4"
) else (
  set "output=%~2"
)
:trim_dot
if "%output:~-1%"=="." (
  set "output=%output:~0,-1%"
  goto trim_dot
)
set "ext=%output:~-4%"
if /i not "%ext%"==".mp4" (
  set "output=%output%.mp4"
)

:: validate output file name
if not exist "%output%" (
  copy NUL "%output%" >nul 2>&1
  if %ERRORLEVEL%==0 (
    del /f /q "%output%"
  ) else (
    echo Error: Invalid output file name or path in "%output%"
    exit /b 1
  )
)

:: remove last fixed.m3u8
if exist "fixed.m3u8" (
  del /f /q "fixed.m3u8"
)

:: set m3u8 input file name
set "input=%~1"

:: generate ffmpeg checking log
set "ffmpeglog=ffmpeg.1.log"
echo Generating "%ffmpeglog%" for advertisement removal...
ffmpeg -allowed_extensions ALL -protocol_whitelist "file,crypto,data" -i "%input%" -c copy -f null NUL > "%ffmpeglog%" 2>&1
if not %ERRORLEVEL%==0 (
  echo Error: Generating "%ffmpeglog%" file errors.
  exit /b 1
)

:: generate fixed.m3u8 by ffmpeg log
node "%~dp0\js\fixm3u8.js" "%input%" "%ffmpeglog%"
if exist "fixed.m3u8" (
  set "input=fixed.m3u8"
)

:: merge all ts files to mp4 file
echo.
echo Merging "%output%" based on "%input%"...
ffmpeg -y -allowed_extensions ALL -protocol_whitelist "file,crypto,data" -i "%input%" -c copy "%output%" > ffmpeg.2.log 2>&1
if %ERRORLEVEL%==0 (
  echo Successfully merge "%output%" file.
) else (
  echo Error: Merging "%output%" file errors.
  exit /b 1
)
