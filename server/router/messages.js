const express = require("express");
const { eq } = require("drizzle-orm");
const { db } = require("../db/client");
const { messages } = require("../db/schema");

const router = express.Router();

function getId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
}

router.get("/messages", async (req, res) => {
  try {
    const data = await db.select().from(messages);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.get("/messages/:id", async (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid message id" });
  }

  try {
    const data = await db.select().from(messages).where(eq(messages.id, id));
    if (data.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch message" });
  }
});

router.post("/messages", async (req, res) => {
  const { chatId, role, content } = req.body;
  if (!chatId || !role || !content) {
    return res.status(400).json({ error: "chatId, role and content are required" });
  }

  try {
    const data = await db
      .insert(messages)
      .values({ chatId, role, content })
      .returning();
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create message" });
  }
});

router.put("/messages/:id", async (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid message id" });
  }

  const update = {};
  if (req.body.chatId !== undefined) update.chatId = req.body.chatId;
  if (req.body.role !== undefined) update.role = req.body.role;
  if (req.body.content !== undefined) update.content = req.body.content;

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    const data = await db
      .update(messages)
      .set(update)
      .where(eq(messages.id, id))
      .returning();

    if (data.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update message" });
  }
});

router.delete("/messages/:id", async (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid message id" });
  }

  try {
    const data = await db
      .delete(messages)
      .where(eq(messages.id, id))
      .returning();
    if (data.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

module.exports = router;
