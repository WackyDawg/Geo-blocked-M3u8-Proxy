const express = require('express');
const https = require('https');
const cors = require('cors');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;
const STREAMS = {
  "rick-and-morty": "https://adultswim-vodlive.cdn.turner.com/live/rick-and-morty/master.m3u8",
};

app.use(cors());

// Function to modify M3U8 playlist to proxy streams and segments
function processM3U8(m3u8, serverHost, streamId) {
  return m3u8.replace(/(^(?!#).*\.m3u8)/gm, (line) => {
    return `${serverHost}/stream/${streamId}?url=${encodeURIComponent(line)}`;
  }).replace(/(^(?!#).*\.ts)/gm, (line) => {
    return `${serverHost}/segment/${streamId}?url=${encodeURIComponent(line)}`;
  });
}

app.get('/stream/:streamId', (req, res) => {
  const streamId = req.params.streamId;
  const targetUrl = STREAMS[streamId];

  if (!targetUrl) {
    return res.status(404).json({ error: "Stream not found" });
  }

  https.get(targetUrl, (proxyRes) => {
    let data = [];
    proxyRes.on('data', (chunk) => data.push(chunk));
    proxyRes.on('end', () => {
      const m3u8 = Buffer.concat(data).toString();
      const modified = processM3U8(m3u8, req.protocol + "://" + req.get("host"), streamId);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.send(modified);
    });
  }).on('error', () => {
    res.status(500).json({ error: "Error fetching stream" });
  });
});

app.get('/segment/:streamId', (req, res) => {
  const segmentUrl = req.query.url;
  if (!segmentUrl) return res.status(400).json({ error: "No segment URL provided" });

  https.get(segmentUrl, (proxyRes) => {
    res.setHeader('Content-Type', proxyRes.headers['content-type']);
    proxyRes.pipe(res);
  }).on('error', () => {
    res.status(500).json({ error: "Error fetching segment" });
  });
});

app.listen(PORT, () => {
  console.log(`M3U8 Geo Proxy running on port ${PORT}`);
});
