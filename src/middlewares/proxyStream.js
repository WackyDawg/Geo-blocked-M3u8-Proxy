const https = require("https");
const config = require("../config.json");

module.exports = (req, res) => {
  const streamId = req.params.streamId;
  const targetUrl = config.streams[streamId];

  if (!targetUrl) {
    return res.status(404).json({ error: "Stream not found" });
  }

  https.get(targetUrl, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      return res.status(proxyRes.statusCode).json({ error: "Access Denied" });
    }

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    proxyRes.pipe(res);
  }).on("error", (err) => {
    res.status(500).json({ error: "Proxy request failed", details: err.message });
  });
};
