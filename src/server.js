const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Stream configuration
const streams = {
  "ricknmorty": "https://adultswim-vodlive.cdn.turner.com/live/rick-and-morty/stream_de.m3u8",
  "stream2": "",
  "stream3": ""
};

// Helper to get base URL
const getBaseUrl = (url) => url.substring(0, url.lastIndexOf('/') + 1);

// Proxy route
app.get('/stream/:streamName/*', async (req, res) => {
  const streamName = req.params.streamName;
  const originalUrl = streams[streamName];
  
  if (!originalUrl) return res.status(404).send('Stream not found');
  
  const baseUrl = getBaseUrl(originalUrl);
  const requestedFile = req.params[0] || '';
  
  try {
    // Construct original URL with query parameters
    const clientUrl = new URL(req.originalUrl, 'http://dummy.com');
    const targetUrl = new URL(requestedFile, baseUrl);
    targetUrl.search = clientUrl.search;

    // Fetch content
    const response = await axios.get(targetUrl.href, { responseType: 'stream' });
    const contentType = response.headers['content-type'];
    
    res.set('Content-Type', contentType);
    
    if (contentType.includes('mpegurl')) {
      let data = '';
      response.data.on('data', chunk => data += chunk);
      response.data.on('end', () => {
        res.send(processM3u8(data, streamName, targetUrl.href, baseUrl));
      });
    } else {
      response.data.pipe(res);
    }
  } catch (error) {
    res.status(500).send('Error fetching stream');
  }
});

// Process M3U8 content
const processM3u8 = (data, streamName, originalUrl, baseUrl) => {
  return data.split('\n').map(line => {
    if (line.startsWith('#') || !line.trim()) return line;
    
    try {
      const resolvedUrl = new URL(line, originalUrl);
      if (resolvedUrl.href.startsWith(baseUrl)) {
        const path = resolvedUrl.pathname.substring(new URL(baseUrl).pathname.length);
        return `/stream/${streamName}${path}${resolvedUrl.search}`;
      }
    } catch (e) { /* Invalid URL */ }
    return line;
  }).join('\n');
};

app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));