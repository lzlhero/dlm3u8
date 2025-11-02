# dlm3u8 - A command-line m3u8 downloader

## Introduction
**dlm3u8** is a command-line m3u8 downloader for Windows, macOS, and Linux. It relies on **aria2**, **Node.js**, and **FFmpeg**.

## Features
* **Concurrent Download**: Uses aria2 for fast, resumable video segment downloads.
* **Batch Download**: Supports downloading multiple m3u8 URLs from an input list file.
* **Ad Removal**: Automatically detects and removes advertisement segments from videos.

## Installation
First, [aria2](https://aria2.github.io/), [Node.js](https://nodejs.org), and [FFmpeg](https://www.ffmpeg.org/) must be installed and available in the `PATH`.

Then, download the [dlm3u8 zip package](https://github.com/lzlhero/dlm3u8/archive/refs/heads/master.zip) and extract it to a folder on your computer. Add the dlm3u8 folder to the `PATH`.

For macOS and Linux, make sure the following files are executable:
```
chmod +x dlm3u8
chmod +x m3u8tomp4
chmod +x ppm3u8
chmod +x fixm3u8
chmod +x rmhead
chmod +x sget
```

## Usage
**`dlm3u8`** is the downloader command.

**See usage information:**
```
dlm3u8
```

**Download a single m3u8 file:**
```
dlm3u8 m3u8-url [output.mp4]
```
**Note**: If no output file is specified, the program uses `output.mp4` as the default filename. You may omit the `.mp4` extension — it will be added automatically. For example, specifying `abc` as the output name will save the file as `abc.mp4`.

**Download multiple m3u8 files:**
```
dlm3u8 -i list.txt
```
Example of list.txt:
```
https://example.com/1/index.m3u8 file-name1
https://example.com/2/index.m3u8 file-name2
https://example.com/3/index.m3u8 file-name3
```
**Note**: The input list file is used for batch downloading m3u8 URLs. Each line represents a download task, with the `URL` and `output file` separated by one or more `spaces` or `tabs`.

When no output file is specified, the output files will be saved sequentially as `001.mp4`, `002.mp4`, `003.mp4`, and so on.

## M3U8 Detector
* Open `m3u8detector.html` in your web browser to add the **M3U8 Detector** bookmarklet.
* Alternatively, copy the contents of `js/m3u8detector.js` and use it to create the **M3U8 Detector** bookmarklet.

## Download
https://github.com/lzlhero/dlm3u8/archive/refs/heads/master.zip

## Author
lzlhero <lzlhero@gmail.com>

## Project
https://github.com/lzlhero/dlm3u8

## License
This project is licensed under the GNU General Public License v3.0 (GPL-3.0).
