// Copyright (c) 2025 lzlhero
// Licensed under the GNU General Public License v3.0 (GPL-3.0)

const { readFile, writeFile } = require('fs/promises');

(async () => {

  // get input file and input url
  var inputM3u8File = process.argv[2];
  var inputUrl = process.argv[3];
  if (!inputM3u8File) {
    console.log(`Usage: subm3u8 master.m3u8 [master-m3u8-url]`);
    process.exit(1);
  }

  console.log(`Parse sub-m3u8 "${inputM3u8File}" Results:`);

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

  // get basename
  var baseName = inputM3u8File.substring(0, inputM3u8File.lastIndexOf(".")) || inputM3u8File;

  // parse sub-m3u8 urls
  var regex = /#EXT-X-STREAM-INF:.*RESOLUTION=(\d+)x(\d+).*\n([^#]*)/ig;
  var result, list = [], url;
  while ((result = regex.exec(m3u8Content)) !== null) {
    url = result[3].trim();
    if (!url) continue;

    url = inputUrl ? new URL(url, inputUrl) : new URL(url);
    list.push({
      pixels: result[1] * result[2],
      url: url.href
    });
  }

  // doesn't contain sub-m3u8 url
  if (!list.length) {
    console.log(`The "${inputM3u8File}" doesn't contain sub-m3u8 url.`);
    process.exit(1);
  }

  // get the best resolution m3u8 url
  list.sort((item1, item2) => item1.pixels - item2.pixels);
  url = list[list.length - 1].url;

  // save m3u8 url file
  var urlFile = `${baseName}_url.txt`;
  try {
    await writeFile(urlFile, url, 'utf8');
  } catch (error) {
    console.error(`Failed to write "${urlFile}".`);
    process.exit(1);
  }
  console.log(`Wrote "${urlFile}" file.`);
})();
