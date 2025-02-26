const express = require('express');
const https = require('https');
const cors = require('cors');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;
const STREAMS = {
   "ricknmorty": "https://adultswim-vodlive.cdn.turner.com/live/rick-and-morty/stream_de.m3u8",
};

app.use(cors());

// Function to modify M3U8 playlist with proxy URLs
function processM3U8(m3u8, baseUrl, serverHost) {
  return m3u8.replace(/(^(?!#).*)/gm, (line) => {
    if (line.startsWith('http')) {
      return `${serverHost}/segment?url=${encodeURIComponent(line)}`;
    }
    return `${serverHost}/segment?url=${encodeURIComponent(new URL(line, baseUrl).href)}`;
  });
}

app.get('/stream/:streamId', (req, res) => {
  const streamId = req.params.streamId;
  const targetUrl = STREAMS[streamId];

  if (!targetUrl) {
    return res.status(404).json({ error: "Stream not found" });
  }

  https.get(targetUrl, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      return res.status(proxyRes.statusCode).end();
    }

    let data = [];
    proxyRes.on('data', (chunk) => data.push(chunk));
    proxyRes.on('end', () => {
      const m3u8 = Buffer.concat(data).toString();
      const modified = processM3U8(m3u8, targetUrl, req.protocol + "://" + req.get("host"));
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.send(modified);
    });
  }).on('error', () => {
    res.status(500).json({ error: "Error fetching stream" });
  });
});

// Proxy route for segment files
app.get('/segment', (req, res) => {
  const segmentUrl = req.query.url;
  if (!segmentUrl) return res.status(400).json({ error: "No segment URL provided" });

  https.get(segmentUrl, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      return res.status(proxyRes.statusCode).end();
    }
    res.setHeader('Content-Type', proxyRes.headers['content-type']);
    proxyRes.pipe(res);
  }).on('error', () => {
    res.status(500).json({ error: "Error fetching segment" });
  });
});

app.listen(PORT, () => {
  console.log(`M3U8 Geo Proxy running on port ${PORT}`);
});
