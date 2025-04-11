const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/proxy-stream', async (req, res) => {
  try {
    const baseUrl = 'https://service-stitcher.clusters.pluto.tv';
    const path = '/stitch/hls/channel/5db0ad56edc89300090d2ebb/master.m3u8';
    const query = '?deviceType=web&deviceMake=Chrome&deviceModel=Chrome&sid=0c9d9262-bcd4-4b33-a78f-afea1ee4a67e&deviceId=781d4c79-fb21-4162-97a4-9f543683f22a&deviceVersion=74.0.3729.131&appVersion=2.5.1-f9a6096b469cfe5e4f1cc92cc697e8500e57891c&deviceDNT=0&deviceLat=38.8177&deviceLon=-77.1527&app_name=&appName=&appStoreUrl=&architecture=&serverSideAds=true';

    const streamUrl = `${baseUrl}${path}${query}`;
    const response = await axios.get(streamUrl);

    // Rewrite relative URLs in the .m3u8 response body
    let content = response.data;
    content = content.replace(/^(?!#)([^\/\n][^\n]*)$/gm, (match) => {
      // Convert to full URL
      return `${baseUrl}/stitch/hls/channel/5db0ad56edc89300090d2ebb/${match}`;
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(content);
  } catch (err) {
    console.error('Error proxying stream:', err.message);
    res.status(500).send('Stream proxy error');
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
