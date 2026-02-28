require("dotenv").config();

/** @type {import("drizzle-kit").Config} */

console.log("Drizzle config loaded with DATABASE_URL:", process.env.DATABASE_URL);
module.exports = {
  schema: "./db/schema.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
