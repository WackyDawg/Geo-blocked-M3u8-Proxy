const express = require('express');
const https = require('https');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const STREAMS = {
"ricknmorty": "https://adultswim-vodlive.cdn.turner.com/live/rick-and-morty/stream_de.m3u8",
};

app.use(cors());

app.get('/stream/:streamId', (req, res) => {
  const streamId = req.params.streamId;
  const targetUrl = STREAMS[streamId];

  if (!targetUrl) {
    return res.status(404).json({ error: "Stream not found" });
  }

  https.get(targetUrl, (proxyRes) => {
    res.setHeader('Content-Type', proxyRes.headers['content-type']);
    proxyRes.pipe(res);
  }).on('error', () => {
    res.status(500).json({ error: "Error fetching stream" });
  });
});

app.listen(PORT, () => {
  console.log(`M3U8 Geo Proxy running on port ${PORT}`);
});
