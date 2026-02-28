require("dotenv").config();
const express = require("express");
const router = require("./router");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(router);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
