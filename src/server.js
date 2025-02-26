const express = require("express");
const axios = require("axios");
const cors = require("cors");
const url = require("url");

const app = express();
const PORT = 3000;
const BASE_URL = "https://adultswim-vodlive.cdn.turner.com/live/rick-and-morty/";

// Enable CORS for all requests
app.use(cors());

/**
 * Proxy .m3u8 playlists and rewrite stream URLs
 */
app.get("/proxy/playlist", async (req, res) => {
    try {
        const streamUrl = `${BASE_URL}stream_de.m3u8`;
        const response = await axios.get(streamUrl);

        // Rewrite all stream URLs to go through our proxy
        let modifiedPlaylist = response.data.replace(
            /(https?:\/\/[^\s]+)/g,
            (match) => `${req.protocol}://${req.get("host")}/proxy/segment?url=${encodeURIComponent(match)}`
        );

        res.set("Content-Type", "application/vnd.apple.mpegurl");
        res.send(modifiedPlaylist);
    } catch (error) {
        console.error("Error fetching playlist:", error.message);
        res.status(500).json({ error: "Failed to fetch playlist" });
    }
});

/**
 * Proxy individual video segments (chunks) and sub-playlists
 */
app.get("/proxy/segment", async (req, res) => {
    try {
        const segmentUrl = req.query.url;
        if (!segmentUrl) {
            return res.status(400).json({ error: "Missing segment URL" });
        }

        // Fetch and stream the segment back
        const response = await axios.get(segmentUrl, { responseType: "stream" });
        res.set(response.headers);
        response.data.pipe(res);
    } catch (error) {
        console.error("Error fetching segment:", error.message);
        res.status(500).json({ error: "Failed to fetch segment" });
    }
});

app.get("/", (req, res) => {
    res.send("Hello, World!");
})

// Start the proxy server
app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});
