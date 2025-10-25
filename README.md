# dlm3u8 - A command-line m3u8 downloader

## Introduction
**dlm3u8** is a command-line m3u8 downloader for Windows, macOS, and Linux. It is based on **aria2**, **Node.js**, and **FFmpeg**.

## Features
* **Batch Download**: Supports downloading multiple m3u8 URLs from an input list file.
* **Ad Removal**: Automatically detects and removes advertisement segments from videos.

## Installation
First, [aria2](https://aria2.github.io/), [Node.js](https://nodejs.org), and [FFmpeg](https://www.ffmpeg.org/) must be installed and configured in the `PATH` environment variable. 

Then, download the [dlm3u8 zip package](https://github.com/lzlhero/dlm3u8/archive/refs/heads/master.zip) and extract it to a folder on your computer. Configure the dlm3u8 folder in the `PATH` environment variable also. 

For macOS and Linux
```
chmod +x dlm3u8
```

## Usage
**dlm3u8** is the downloader command.

See usage information
```
dlm3u8
```

Single m3u8 downloading
```
dlm3u8 m3u8-url [output.mp4]
```
**Note**: The output filename can omit the `.mp4` extension. The saved file will automatically have the `.mp4` extension added. For example, if the specified output name is `abc`, the saved file will be `abc.mp4`.

Multiple m3u8 downloading
```
dlm3u8 -i list.txt
```
Example of list.txt:
```
https://example.com/1/index.m3u8 name1
https://example.com/2/index.m3u8 name2
https://example.com/3/index.m3u8 name3
```
**Note**: The input list file is used for batch downloading m3u8 URLs. Each line represents a download task, with the **URL** and **output file** separated by one or more **whitespace characters**. When no output file is specified, the output files will be named sequentially as `001.mp4`, `002.mp4`, `003.mp4`, and so on.

## Download
https://github.com/lzlhero/dlm3u8/archive/refs/heads/master.zip

## Author
lzlhero <lzlhero@gmail.com>

## Project
https://github.com/lzlhero/dlm3u8
