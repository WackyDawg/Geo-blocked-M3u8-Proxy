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

app.get(`/${API_VERSION}/:streamName`, async (req, res) => {
  const { streamName } = req.params;

  try {
    const data = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(data);

    const url = config.streams[streamName];

    if (!url) {
      return res.status(404).send(`Stream '${streamName}' not found.`);
    }

    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    res.set(response.headers);
    response.data.pipe(res);
  } catch (error) {
    console.error(`Error proxying stream '${streamName}':`, error.message);
    res.status(500).send('Failed to fetch the stream.');
  }
});

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Proxy server listening on http://localhost:${port}`));
