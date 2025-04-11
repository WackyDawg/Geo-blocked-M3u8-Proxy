const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const BASE_URL = 'https://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5db0ad56edc89300090d2ebb';

app.get('/proxy/*', async (req, res) => {
  try {
    const path = req.params[0];
    const query = req.url.split('?')[1] || '';
    const targetUrl = `${BASE_URL}/${path}${query ? `?${query}` : ''}`;

    const response = await axios.get(targetUrl, {
      responseType: 'arraybuffer', // handles binary and text
    });

    const contentType = response.headers['content-type'] || '';

    if (contentType.includes('application/vnd.apple.mpegurl')) {
      // Rewrite .m3u8 to route nested playlists and segments through proxy
      let content = response.data.toString('utf-8');

      content = content.replace(/^(?!#)([^\/\n][^\n]*)$/gm, (match) => {
        // Convert relative path to full proxied path
        return `/proxy/${path.substring(0, path.lastIndexOf('/'))}/${match}`;
      });

      res.setHeader('Content-Type', contentType);
      return res.send(content);
    }

    // For .ts, .m4s, etc - pass through
    res.setHeader('Content-Type', contentType);
    res.send(response.data);
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).send('Proxy stream error');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Stream proxy running at http://localhost:${PORT}`);
});
