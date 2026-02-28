const express = require("express");
const { eq } = require("drizzle-orm");
const { db } = require("../db/client");
const { users } = require("../db/schema");
const { requireAuth } = require("../auth/middleware");

const router = express.Router();
router.use(requireAuth);

function getId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
}

router.get("/users", async (req, res) => {
  try {
    const data = await db.select().from(users).where(eq(users.id, req.auth.userId));
    const user = data[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json([{ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/users/:id", async (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  if (id !== req.auth.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const data = await db.select().from(users).where(eq(users.id, id));
    if (data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = data[0];
    return res.json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.put("/users/:id", async (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  if (id !== req.auth.userId) {
    return res.status(403).json({ error: "Forbidden" });
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
    const user = data[0];
    return res.json({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/users/:id", async (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  if (id !== req.auth.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const data = await db.delete(users).where(eq(users.id, id)).returning();
    if (data.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

module.exports = router;
