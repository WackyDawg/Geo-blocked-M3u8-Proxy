const express = require('express');
const axios = require('axios');
const { Parser } = require('m3u8-parser');
const app = express();
const PORT = 3000;

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
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send('Error proxying segment');
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
