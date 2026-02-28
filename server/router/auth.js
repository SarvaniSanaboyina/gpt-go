const express = require("express");
const { eq } = require("drizzle-orm");
const { db } = require("../db/client");
const { users } = require("../db/schema");
const { createPasswordRecord, signToken, verifyPassword } = require("../auth/crypto");
const { requireAuth } = require("../auth/middleware");

const router = express.Router();

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

router.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters" });
  }

  const authFields = createPasswordRecord(password);

  try {
    const created = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash: authFields.passwordHash,
        passwordSalt: authFields.passwordSalt,
      })
      .returning();

    const user = created[0];
    const token = signToken(user.id);
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: "Failed to register user" });
  }
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const found = await db.select().from(users).where(eq(users.email, email));
    const user = found[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValid = verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user.id);
    return res.json({ token, user: toPublicUser(user) });
  } catch (error) {
    return res.status(500).json({ error: "Failed to login" });
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const found = await db.select().from(users).where(eq(users.id, req.auth.userId));
    const user = found[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(toPublicUser(user));
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
