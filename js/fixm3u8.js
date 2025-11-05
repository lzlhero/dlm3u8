// Copyright (c) 2025 lzlhero
// Licensed under the GNU General Public License v3.0 (GPL-3.0)

const { readFile, writeFile } = require('fs/promises');
const flag = '\n# rebuilder: fixm3u8';

(async () => {

  // get input file and ffmpeg log file name
  var inputM3u8File = process.argv[2];
  var logFile = process.argv[3];
  if (!inputM3u8File || !logFile) {
    console.log(`Usage: fixm3u8 file.m3u8 ffmpeg.log`);
    process.exit(1);
  }

  console.log(`Fix "${inputM3u8File}" Results:`);

  // get input file content
  try {
    var m3u8Content = await readFile(inputM3u8File, 'utf8');
  } catch (error) {
    console.error(`Failed to read "${inputM3u8File}".`);
    process.exit(1);
  }
  m3u8Content = m3u8Content.replace(/\r\n/g, '\n');

  // validate m3u8 format
  if (!/(^#EXTM3U|\n#EXTM3U)\n/.test(m3u8Content)) {
    console.error(`Failed to validate "${inputM3u8File}". It is not "m3u8" format.`);
    process.exit(1);
  }

  // check the flag
  if (m3u8Content.lastIndexOf(flag) !== -1) {
    console.error(`The "${inputM3u8File}" has already been fixed.`);
    return;
  }

  // get ffmpeg log content
  try {
    var logContent = await readFile(logFile, 'utf8');
  } catch (error) {
    console.error(`Failed to read "${logFile}".`);
    process.exit(1);
  }
  logContent = logContent.replace(/\r\n/g, '\n');

  // validate ffmpeg log format
  if (!/^ffmpeg/.test(logContent)) {
    console.error(`Failed to validate "${logFile}". It is not "ffmpeg" log format.`);
    process.exit(1);
  }

  // parse discontinuity segments from ffmpeg log
  var regex = /\n[^\n']+'(?:crypto:)?([^\n']+)' for reading\n[^']+'(?:crypto:)?([^\n']+)' for reading\n[^']+discontinuity/g;
  var result, segments = [], i = 1;
  while ((result = regex.exec(logContent)) !== null) {
    segments.push(result[1 + i % 2]);
    i++;
  }

  // display discontinuity info
  if (segments.length) {
    console.log(`Found ${segments.length} "discontinuity" keyword in "${logFile}".`);

    // remove all discontinuity segments from m3u8 content
    var strReg, replaceText;
    for (var i = 0; i < segments.length; i = i + 2) {
      // build replacement reg string
      strReg = `\n${segments[i].replace(/\./g, '\\\.')}\n(?:.*\n)*`;
      if (i + 1 < segments.length) {
        strReg += `?${segments[i + 1].replace(/\./g, '\\\.')}\n`;
        replaceText = '\n';
      } else {
        replaceText = '\n#EXT-X-ENDLIST\n';
      }

      // remove discontinuity ts
      m3u8Content = m3u8Content.replace(new RegExp(strReg), replaceText);

      // display removed segments info
      console.log(`${1 + i / 2}: ${segments[i]} - ${i + 1 < segments.length ? segments[i + 1] : '#EXT-X-ENDLIST'}`);
    }
  } else {
    console.log(`No "discontinuity" keyword in "${logFile}".`);
  }

  // save rebuild m3u8 file
  var outputM3u8File = inputM3u8File;
  try {
    await writeFile(outputM3u8File, m3u8Content + flag, 'utf8');
  } catch (error) {
    console.error(`Failed to write "${outputM3u8File}".`);
    process.exit(1);
  }
  console.log(`Rebuilt "${outputM3u8File}" file.`);
})();
