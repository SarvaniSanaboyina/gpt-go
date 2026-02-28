const express = require("express");
const { eq } = require("drizzle-orm");
const { db } = require("../db/client");
const { users } = require("../db/schema");

const router = express.Router();

function getId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
}

router.get("/users", async (req, res) => {
  try {
    const data = await db.select().from(users);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/users/:id", async (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  try {
    const data = await db.select().from(users).where(eq(users.id, id));
    if (data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.post("/users", async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }

  try {
    const data = await db
      .insert(users)
      .values({ name, email })
      .returning();
    res.status(201).json(data[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/users/:id", async (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const update = {};
  if (req.body.name !== undefined) update.name = req.body.name;
  if (req.body.email !== undefined) update.email = req.body.email;

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const data = await db
      .update(users)
      .set(update)
      .where(eq(users.id, id))
      .returning();

    if (data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(data[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/users/:id", async (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  try {
    const data = await db.delete(users).where(eq(users.id, id)).returning();
    if (data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
