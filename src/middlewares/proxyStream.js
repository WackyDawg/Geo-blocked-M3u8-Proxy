const { createProxyMiddleware } = require("http-proxy-middleware");
const config = require("../config/config.json");

module.exports = (req, res, next) => {
  const streamId = req.params.streamId;
  const targetUrl = config.streams[streamId];

  if (!targetUrl) {
    return res.status(404).json({ error: "Stream not found" });
  }

  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    secure: false,
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://google.com"
    },
    pathRewrite: { [`^/stream/${streamId}`]: "" },
  })(req, res, next);
};
