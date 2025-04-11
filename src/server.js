const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

<<<<<<< HEAD
app.get('/proxy-stream', async (req, res) => {
  try {
    const targetUrl = 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5db0ad56edc89300090d2ebb/master.m3u8?deviceType=web&deviceMake=Chrome&deviceModel=Chrome&sid=0c9d9262-bcd4-4b33-a78f-afea1ee4a67e&deviceId=781d4c79-fb21-4162-97a4-9f543683f22a&deviceVersion=74.0.3729.131&appVersion=2.5.1-f9a6096b469cfe5e4f1cc92cc697e8500e57891c&deviceDNT=0&userId=&advertisingId=&deviceLat=38.8177&deviceLon=-77.1527&app_name=&appName=&appStoreUrl=&architecture=&serverSideAds=true';

    const response = await axios.get(targetUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0', 
      }
    });

    res.set(response.headers);
=======
app.use(require('cors')());


const ORIGIN_URL = 'https://adultswim-vodlive.cdn.turner.com/live/rick-and-morty/stream_de.m3u8'; // Original stream URL
const PROXY_URL = 'https://geo-blocked-m3u8-proxy.onrender.com';

app.get('/*.m3u8', async (req, res) => {
  try {
    const response = await axios.get(`${ORIGIN_URL}/${req.params[0]}.m3u8`);
    const playlist = response.data;

    const parser = new Parser();
    parser.push(playlist);
    parser.end();

    let rewrittenPlaylist = playlist;
    if (parser.manifest.segments) {
      // Rewrite segment URIs to proxy endpoint
      rewrittenPlaylist = playlist.replace(
        /(.*\.ts)/g, 
        `${PROXY_URL}/$1` // Rewrite to proxy URL
      );
    }

    // Serve modified playlist
    res.header('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(rewrittenPlaylist);
  } catch (error) {
    res.status(500).send('Error proxying playlist');
  }
});

app.get('/*.ts', async (req, res) => {
  try {
    // Fetch and pipe original segment
    const response = await axios({
      method: 'get',
      url: `${ORIGIN_URL}/${req.params[0]}.ts`,
      responseType: 'stream'
    });

    res.header('Content-Type', 'video/MP2T');
>>>>>>> 6196484ef49d3984617cb84a4c194baa81a85aae
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching stream:', error.message);
    res.status(500).send('Stream proxy error');
  }
});

<<<<<<< HEAD
const PORT = 3000;
app.listen(PORT, () => console.log(`Proxy server running on http://localhost:${PORT}`));
=======
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
>>>>>>> 6196484ef49d3984617cb84a4c194baa81a85aae
