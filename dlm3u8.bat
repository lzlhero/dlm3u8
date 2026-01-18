:: Copyright (c) 2025 lzlhero
:: Licensed under the GNU General Public License v3.0 (GPL-3.0)

@echo off & setlocal enabledelayedexpansion & goto main

:fn_dlm3u8
  :: set basename
  if "%basename%"=="" (
    set "basename=output"
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
  set "input=%basename%.m3u8"
  set "input_url=%basename%_url.txt"
  set "input_resources=%input%_resources"
  set "output=%basename%.mp4"
  set "aria2c_input=%basename%_aria2c.txt"
  set "scan_log=%basename%_ffmpeg_scan.log"
  set "merge_log=%basename%_ffmpeg_merge.log"

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

  :: download m3u8 file
  aria2c --allow-overwrite=true --continue=false --split=1 -q -o "%input%" "%url%" >NUL 2>&1
  if %ERRORLEVEL%==0 (
    echo Download "%url%" as "%input%" OK.
  ) else (
    echo Error: Failed to download "%url%"
    exit /b 1
  )

  :: check the input file is a master m3u8 or not
  find "#EXT-X-STREAM-INF" "%input%" >NUL
  if not %ERRORLEVEL%==0 (
    goto ppm3u8
  )

  echo.
  echo The "%input%" is a master m3u8, try to get the best resolution sub-m3u8 url.
  node "%~dp0\js\subm3u8.js" "%input%" "%url%"
  if not %ERRORLEVEL%==0 (
    exit /b 1
  )
  set /p url=<"%input_url%"
  del /f /q "%input_url%"

  :: download sub-m3u8 file
  aria2c --allow-overwrite=true --continue=false --split=1 -q -o "%input%" "%url%" >NUL 2>&1
  if %ERRORLEVEL%==0 (
    echo.
    echo Download sub-m3u8 "%url%" as "%input%" OK.
  ) else (
    echo Error: Failed to download sub-m3u8 "%url%"
    exit /b 1
  )

  :ppm3u8
  :: rebuild m3u8, generate aria2c file
  echo.
  node "%~dp0\js\ppm3u8.js" "%input%" "%url%"
  if not %ERRORLEVEL%==0 (
    exit /b 1
  )

  :: download files from aria2c input file
  echo.
  echo Starting to download files from "%aria2c_input%"...
  aria2c -i "%aria2c_input%"
  if %ERRORLEVEL%==0 (
    del /f /q "%aria2c_input%" >NUL 2>&1
  ) else (
    echo.
    echo Error: Failed to download some files related to "%url%".
    exit /b 1
  )

  :: generate ffmpeg scan log
  echo.
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
  echo Note: The input list file is used for batch downloading m3u8 URLs. Each line represents a download task, with the URL and output file separated by one or more spaces or tabs. When no output file is specified, the output files will be named sequentially as 001.mp4, 002.mp4, 003.mp4, and so on.
  echo.
  echo dlm3u8 relies on aria2, Node.js, and FFmpeg. These tools must be installed and available in the PATH.
  echo.
  echo Author: lzlhero ^<lzlhero@gmail.com^>
  echo Project: https://github.com/lzlhero/dlm3u8
  echo License: GNU General Public License v3.0
  exit /b 1
)

:: check command line arguments
if not "%~1"=="-i" (
  :: normal
  set "url=%~1"
  set "basename=%~2"

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
          set "basename=00!count!"
          set "basename=!basename:~-3!"
        ) else (
          set "basename=%%b"
        )

        echo ----------------------------------------
        call :fn_dlm3u8
      )
    )
  )
)
endlocal
