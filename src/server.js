const express = require("express");
const cors = require("cors");
const http = require("http");
const https = require("https");
const validateParams = require("./middlewares/validateParams");
const proxyStream = require("./middlewares/proxyStream");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString();
}

app.get("/stream/:streamId", validateParams, proxyStream);

app.get("/segment/:encodedUrl", (req, res) => {
  const encodedUrl = req.params.encodedUrl;
  let targetUrl;
  try {
    targetUrl = base64urlDecode(encodedUrl);
  } catch (err) {
    return res.status(400).send("Invalid URL");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (err) {
    return res.status(400).send("Invalid URL");
  }

  const protocol = parsedUrl.protocol === "https:" ? https : http;
  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
    headers: { "User-Agent": "Mozilla/5.0 (Proxy)" }, 
  };

  const proxyReq = protocol.get(options, (proxyRes) => {
    res.setHeader(
      "Content-Type",
      proxyRes.headers["content-type"] || "application/octet-stream"
    );
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    res.status(500).send("Error fetching segment");
  });
});

app.get("/", (req, res) => {
  res.send("M3U8 Proxy Server is running...");
});

app.listen(PORT, () => {
  console.log(`Proxy Server running on http://localhost:${PORT}`);
});
