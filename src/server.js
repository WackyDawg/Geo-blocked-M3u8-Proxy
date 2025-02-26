const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const { URL } = require('url');
const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD'],
  allowedHeaders: ['Range']
}));

// Proxy middleware with improved error handling
app.get('/proxy', async (req, res) => {
  try {
    const originalUrl = decodeURIComponent(req.query.url);
    if (!originalUrl) return res.status(400).send('Missing URL parameter');

    // Validate URL format
    if (!isValidUrl(originalUrl)) {
      return res.status(400).send('Invalid URL format');
    }

    const proxyResponse = await fetch(originalUrl, {
      headers: {
        Referer: new URL(originalUrl).origin,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      },
      redirect: 'follow'
    });

    if (!proxyResponse.ok) {
      return res.status(proxyResponse.status).send(`Upstream error: ${proxyResponse.statusText}`);
    }

    // Handle M3U8 playlist
    if (proxyResponse.headers.get('content-type')?.includes('mpegurl')) {
      const textData = await proxyResponse.text();
      const modifiedPlaylist = textData.split('\n').map(line => {
        if (line.startsWith('#') || line.trim() === '') return line;
        
        // Handle both absolute and relative URLs
        const segmentUrl = new URL(line, originalUrl).toString();
        return `/proxy?url=${encodeURIComponent(segmentUrl)}`;
      }).join('\n');

      res.header({
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache'
      });
      return res.send(modifiedPlaylist);
    }

    // Handle media segments (TS files)
    res.header({
      'Content-Type': proxyResponse.headers.get('content-type'),
      'Cache-Control': 'no-cache',
      'Access-Control-Expose-Headers': 'Content-Length'
    });
    
    proxyResponse.body.pipe(res);

  } catch (error) {
    console.error('[PROXY ERROR]', {
      message: error.message,
      url: req.query.url,
      stack: error.stack
    });
    res.status(500).send(`Proxy error: ${error.message}`);
  }
});

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));