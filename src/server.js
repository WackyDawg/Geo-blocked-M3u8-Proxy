const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors()); // Allow cross-origin requests

const streams = {
    ricknmorty: "https://adultswim-vodlive.cdn.turner.com/live/rick-and-morty/stream_de.m3u8",
    stream2: "",
    stream3: ""
};

// Proxy route to fetch the geo-blocked stream
app.get("/proxy/:streamKey", async (req, res) => {
    const { streamKey } = req.params;
    const streamUrl = streams[streamKey];

    if (!streamUrl) {
        return res.status(404).json({ error: "Stream not found" });
    }

    try {
        // Fetch the stream data from the geo-blocked source
        const response = await axios.get(streamUrl, {
            responseType: "stream",
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://adultswim.com/",
            },
        });

        // Forward the stream response
        res.set(response.headers);
        response.data.pipe(res);
    } catch (error) {
        console.error("Error fetching stream:", error.message);
        res.status(500).json({ error: "Failed to fetch stream" });
    }
});

app.get('/', (req, res) => {
    res.send('Proxy server running!');
});

app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
