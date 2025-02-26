const express = require("express");
const cors = require("cors");
const validateParams = require("./middlewares/validateParams");
const proxyStream = require("./middlewares/proxyStream");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use("/stream/:streamId", validateParams);

app.use("/stream/:streamId", proxyStream);

app.get("/", (req, res) => {
  res.send("M3U8 Proxy Server is running...");
});

app.listen(PORT, () => {
  console.log(`Proxy Server running on http://localhost:${PORT}`);
});
