require("dotenv").config();
const express = require("express");
const router = require("./router");

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());
app.use(router);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
