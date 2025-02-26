const http = require('http');
const https = require('https');
const url = require('url');

const TARGET_URL = 'https://adultswim-vodlive.cdn.turner.com/live/rick-and-morty/stream_de.m3u8'; // Base URL
const PORT = 8333;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const targetPath = parsedUrl.pathname.replace(/^\/proxy\//, ''); // Remove "/proxy/" prefix

  if (!targetPath) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request: No target path provided.');
    return;
  }

  const proxyUrl = `${TARGET_URL}${targetPath}${parsedUrl.search || ''}`;

  console.log(`Proxying request to: ${proxyUrl}`);

  const options = url.parse(proxyUrl);
  options.method = req.method;
  options.headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Referer': 'https://www.adultswim.com/',
    'Origin': 'https://www.adultswim.com/',
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'Access-Control-Allow-Origin': '*',
    });

    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
