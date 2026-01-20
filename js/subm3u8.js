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

  console.log(`Parse Sub-M3U8 "${inputM3u8File}" Results:`);

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
  var regex = /#EXT-X-STREAM-INF:?([^\n]*)\n([^#]*)/ig;
  var list = [], result, url, properties, matches, bandwidth, resolution;
  while ((result = regex.exec(m3u8Content)) !== null) {
    url = result[2].trim();
    if (!url) continue;

    bandwidth = 0;
    resolution = "N/A";
    properties = result[1].trim();
    if (properties) {
      matches = properties.match(/BANDWIDTH=([^,]*)/i);
      if (matches) {
        bandwidth = Number(matches[1]);
        bandwidth = Number.isNaN(bandwidth) ? 0 : bandwidth;
      }

      matches = properties.match(/RESOLUTION=([^,]*)/i);
      if (matches) {
        resolution = matches[1];
      }
    }

    list.push({
      bandwidth: bandwidth,
      resolution: resolution,
      url: (inputUrl ? new URL(url, inputUrl) : new URL(url)).href
    });
  }

  var item;
  if (list.length === 0) {
   // doesn't have a sub-m3u8 url
    console.log("It doesn't have a sub-m3u8 URL.");
    process.exit(1);
  } else if (list.length === 1) {
    // only has one sub-m3u8 url
    item = list[0];
  } else {
    // get the highest quality sub-m3u8 url
    list.sort((item1, item2) => item1.bandwidth - item2.bandwidth);
    item = list[list.length - 1];
  }
  console.log(`Available resolutions: ${list.map((item) => item.resolution + "(bw:" + item.bandwidth + ")").join(', ')}`);
  console.log(`Highest quality: ${item.resolution}(bw:${item.bandwidth}), ${item.url}`);

  // save m3u8 url file
  var urlFile = `${baseName}_url.txt`;
  try {
    await writeFile(urlFile, item.url, 'utf8');
  } catch (error) {
    console.error(`Failed to write "${urlFile}".`);
    process.exit(1);
  }
  console.log(`Wrote the URL to "${urlFile}" file.`);
})();
