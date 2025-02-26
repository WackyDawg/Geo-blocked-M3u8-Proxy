const express = require("express");
const axios = require("axios");
const { URL } = require("url");
const m3u8Parser = require("m3u8-parser");
const cors = require("cors");

const app = express();
const PORT = 8080;

app.use(cors());

// Proxy M3U8 requests
app.get("/proxy", async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send("Missing URL parameter");
    
    try {
        const response = await axios.get(targetUrl, { timeout: 5000 });
        let parser = new m3u8Parser.Parser();
        parser.push(response.data);
        parser.end();

        let playlist = parser.manifest;
        let baseUrl = new URL(targetUrl).origin;

        // Rewrite segment URLs
        playlist.segments.forEach(segment => {
            if (!segment.uri.startsWith("http")) {
                segment.uri = `${baseUrl}/${segment.uri}`;
            }
            segment.uri = `/segment?url=${encodeURIComponent(segment.uri)}`;
        });

        let updatedManifest = `#EXTM3U\n`;
        updatedManifest += playlist.segments.map(seg => `#EXTINF:${seg.duration},\n${seg.uri}`).join("\n");
        
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.send(updatedManifest);
    } catch (error) {
        res.status(500).send("Failed to fetch M3U8 file");
    }
});

// Proxy TS segment requests
app.get("/segment", async (req, res) => {
    const segmentUrl = req.query.url;
    if (!segmentUrl) return res.status(400).send("Missing segment URL");
    
    try {
        const response = await axios({ url: segmentUrl, responseType: "stream" });
        res.setHeader("Content-Type", "video/mp2t");
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send("Failed to fetch video segment");
    }
});

app.listen(PORT, () => console.log(`M3U8 Proxy Server running on port ${PORT}`));
