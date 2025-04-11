import express from 'express';
import axios from 'axios';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, './config/config.json');

const app = express();
const port = 3000;
app.use(cors());

const API_VERSION = 'v1';

// Proxy M3U8 file and rewrite segment URLs
app.get(`/${API_VERSION}/:streamName`, async (req, res) => {
  const { streamName } = req.params;

  try {
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    const m3u8Url = config.streams[streamName];

    if (!m3u8Url) {
      return res.status(404).send(`Stream '${streamName}' not found.`);
    }

    // Fetch original M3U8
    const response = await axios.get(m3u8Url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    // Process each line
    const modifiedData = response.data.split('\n').map(line => {
      if (line.startsWith('#') || line.trim() === '') return line;
      
      // Encode special characters but keep path separators
      const encodedSegment = encodeURIComponent(line).replace(/%2F/g, '/');
      return `http://${req.get('host')}/${API_VERSION}/${streamName}/${encodedSegment}`;
    }).join('\n');

    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(modifiedData);
  } catch (error) {
    console.error(`Error proxying stream '${streamName}':`, error.message);
    res.status(500).send('Failed to fetch stream');
  }
});

// Proxy individual segments
app.get(`/${API_VERSION}/:streamName/*`, async (req, res) => {
  const { streamName } = req.params;
  const segmentPath = decodeURIComponent(req.params[0]); // Decode the path

  try {
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    const m3u8Url = config.streams[streamName];

    if (!m3u8Url) return res.status(404).send('Stream not found');

    // Resolve segment URL
    const m3u8UrlObj = new URL(m3u8Url);
    const segmentUrl = new URL(segmentPath, m3u8Url);

    // Preserve M3U8 query parameters
    m3u8UrlObj.searchParams.forEach((value, key) => {
      segmentUrl.searchParams.set(key, value);
    });

    // Proxy the segment
    const response = await axios.get(segmentUrl.href, {
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    res.set(response.headers);
    response.data.pipe(res);
  } catch (error) {
    console.error(`Error fetching segment: ${error.message}`);
    res.status(500).send('Failed to fetch segment');
  }
});

app.get('/', (req, res) => res.send('Proxy Server Running'));

app.listen(port, () => console.log(`Proxy server listening on http://localhost:${port}`));
