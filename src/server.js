const express = require('express');
const cors = require('cors');
const { URL } = require('url');

// Use built-in fetch in Node.js 18+ or import from 'node-fetch'
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Proxy endpoint
app.get('/proxy', async (req, res) => {
    try {
        const originalUrl = req.query.url;
        if (!originalUrl) return res.status(400).send('Missing URL parameter');

        // Fetch from original source
        const response = await fetch(originalUrl, {
            headers: { Referer: new URL(originalUrl).origin }
        });

        // Process M3U8 files
        if (response.headers.get('content-type')?.includes('application/vnd.apple.mpegurl')) {
            const text = await response.text();
            const modified = text.split('\n').map(line => {
                if (line.startsWith('#') || line.trim() === '') return line;
                
                const absoluteUrl = new URL(line, originalUrl).toString();
                return `${req.protocol}://${req.get('host')}/proxy?url=${encodeURIComponent(absoluteUrl)}`;
            }).join('\n');

            res.header('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(modified);
        }

        // Fix: Set headers correctly
        for (const [key, value] of Object.entries(response.headers.raw())) {
            res.setHeader(key, Array.isArray(value) ? value.join(', ') : value);
        }

        // Stream other content (TS segments)
        response.body.pipe(res);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send('Proxy error: ' + error.message);
    }
});

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
