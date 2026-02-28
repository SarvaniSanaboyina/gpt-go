const express = require("express");
const { and, eq } = require("drizzle-orm");
const { db } = require("../db/client");
const { chats } = require("../db/schema");
const { requireAuth } = require("../auth/middleware");

const router = express.Router();
router.use(requireAuth);

function getId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
}

router.get("/chats", async (req, res) => {
  try {
    const data = await db.select().from(chats).where(eq(chats.userId, req.auth.userId));
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch chats" });
  }
});

router.get("/chats/:id", async (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid chat id" });
  }

  try {
    const data = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, id), eq(chats.userId, req.auth.userId)));
    if (data.length === 0) {
      return res.status(404).json({ error: "Chat not found" });
    }
    return res.json(data[0]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch chat" });
  }
});

router.post("/chats", async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  try {
    const data = await db
      .insert(chats)
      .values({ userId: req.auth.userId, title })
      .returning();
    return res.status(201).json(data[0]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create chat" });
  }
});

router.put("/chats/:id", async (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid chat id" });
  }

  const update = {};
  if (req.body.title !== undefined) update.title = req.body.title;

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const data = await db
      .update(chats)
      .set(update)
      .where(and(eq(chats.id, id), eq(chats.userId, req.auth.userId)))
      .returning();

    if (data.length === 0) {
      return res.status(404).json({ error: "Chat not found" });
    }
    return res.json(data[0]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update chat" });
  }
});

router.delete("/chats/:id", async (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid chat id" });
  }

  try {
    const data = await db
      .delete(chats)
      .where(and(eq(chats.id, id), eq(chats.userId, req.auth.userId)))
      .returning();
    if (data.length === 0) {
      return res.status(404).json({ error: "Chat not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete chat" });
  }
});

module.exports = router;
