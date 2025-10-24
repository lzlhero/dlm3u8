@echo off & setlocal enabledelayedexpansion & goto main

:fn_dlm3u8
  :: set mp4 output file name
  if "%output%"=="" (
    set "output=output.mp4"
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

  :: download m3u8 file
  aria2c --allow-overwrite=true --continue=false --split=1 -q -o index.m3u8 "%url%" >nul 2>&1
  if %ERRORLEVEL%==0 (
    echo Download "%url%" as "index.m3u8" OK.
  ) else (
    echo Error: Download "%url%" failed.
    exit /b 1
  )

  :: generate aria2c.txt, file.m3u8 by index.m3u8
  node "%~dp0\js\ppm3u8.js" index.m3u8 "%url%"
  if not %ERRORLEVEL%==0 (
    exit /b 1
  )

  :: download related files by aria2c.txt
  echo.
  echo Starting to download all related files...
  aria2c -i aria2c.txt
  if not %ERRORLEVEL%==0 (
    echo.
    echo Download "%url%" related files errors.
    exit /b 1
  )

  :: set m3u8 input file name
  set "input=file.m3u8"

  :: generate ffmpeg checking log
  set "ffmpeglog=ffmpeg.1.log"
  echo.
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
  exit /b 0

:fn_rtrim_line
  if "!line:~-1!"=="	" (
    set "line=%line:~0,-1%"
    goto fn_rtrim_line
  )
  if "!line:~-1!"==^"^"^" (
    set "line=%line:~0,-1%"
    goto fn_rtrim_line
  )
  if "!line:~-1!"==" " (
    set "line=%line:~0,-1%"
    goto fn_rtrim_line
  )
  exit /b 0

:main
:: display usage information
if "%~1"=="" (
  echo Usage: dlm3u8 m3u8-url [output.mp4]
  echo        dlm3u8 -i list.txt
  echo.
  echo Note: The input list file is used for batch downloading m3u8 files. Each line represents a download task, with the URL and output file separated by one or more whitespace characters.
  echo.
  echo dlm3u8 is based on aria2, Node.js, and FFmpeg. These dependencies must be installed and configured in the PATH environment variable.
  echo.
  echo Author: lzlhero ^<lzlhero@gmail.com^>
  echo Project: https://github.com/lzlhero/dlm3u8
  exit /b 1
)

:: check command line arguments
if not "%~1"=="-i" (
  :: normal
  set "url=%~1"
  set "output=%~2"

  call :fn_dlm3u8
) else (
  :: input list file
  if "%~2"=="" (
    echo Error: Require an input list file.
    exit /b 1
  )

  if not exist "%~2" (
    echo Error: File "%~2" not found.
    exit /b 1
  )

  set count=0
  for /f "usebackq delims=" %%A in ("%~2") do (
    set "line=%%A"
    call :fn_rtrim_line

    :: parse url and output fields
    for /f tokens^=1^,*^ delims^=^	^"^  %%a in ("!line!") do (
      if not "%%a"=="" (
        set "url=%%a"
        if "%%b"=="" (
          set /a count+=1
          set "output=00!count!"
          set "output=!output:~-3!"
        ) else (
          set "output=%%b"
        )

        echo ----------------------------------------
        call :fn_dlm3u8
      )
    )
  )
)
endlocal
