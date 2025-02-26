const https = require("https");
const { URL } = require("url");
const config = require("../config/config.json");

function base64urlEncode(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

module.exports = (req, res) => {
  const streamId = req.params.streamId;
  const targetUrl = config.streams[streamId];

  if (!targetUrl) {
    return res.status(404).json({ error: "Stream not found" });
  }

  https
    .get(targetUrl, (proxyRes) => {
      if (proxyRes.statusCode !== 200) {
        return res.status(proxyRes.statusCode).json({ error: "Access Denied" });
      }

      let data = [];
      proxyRes.on("data", (chunk) => data.push(chunk));
      proxyRes.on("end", () => {
        const m3u8 = Buffer.concat(data).toString();
        const modifiedM3u8 = processM3U8(m3u8, targetUrl);
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.send(modifiedM3u8);
      });
    })
    .on("error", (err) => {
      res
        .status(500)
        .json({ error: "Proxy request failed", details: err.message });
    });
};

function processM3U8(data, baseUrl) {
  return data
    .split("\n")
    .map((line) => {
      if (line.startsWith("#") || line.trim() === "") {
        return line;
      } else {
        try {
          const absoluteUrl = new URL(line, baseUrl).href;
          const encodedUrl = base64urlEncode(absoluteUrl);
          return `/segment/${encodedUrl}`;
        } catch (err) {
          return line;
        }
      }
    })
    .join("\n");
}
