const express = require("express");
const { and, asc, eq, inArray } = require("drizzle-orm");
const { db } = require("../db/client");
const { messages, chats } = require("../db/schema");
const { requireAuth } = require("../auth/middleware");
const { generateAssistantReply } = require("../ai/agent");

const router = express.Router();
router.use(requireAuth);

function getId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
}

async function hasChatAccess(chatId, userId) {
  const found = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));
  return found.length > 0;
}

router.get("/messages", async (req, res) => {
  try {
    const userChats = await db.select({ id: chats.id }).from(chats).where(eq(chats.userId, req.auth.userId));
    const chatIds = userChats.map((chat) => chat.id);
    if (chatIds.length === 0) {
      return res.json([]);
    }

    const data = await db.select().from(messages).where(inArray(messages.chatId, chatIds));
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch messages" });
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
    const message = data[0];
    const canAccess = await hasChatAccess(message.chatId, req.auth.userId);
    if (!canAccess) {
      return res.status(404).json({ error: "Message not found" });
    }
    return res.json(message);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch message" });
  }
});

router.post("/messages", async (req, res) => {
  const { chatId, role, content } = req.body;
  if (!chatId || !role || !content) {
    return res.status(400).json({ error: "chatId, role and content are required" });
  }

  try {
    const canAccess = await hasChatAccess(chatId, req.auth.userId);
    if (!canAccess) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const data = await db
      .insert(messages)
      .values({ chatId, role, content })
      .returning();
    return res.status(201).json(data[0]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create message" });
  }
});

router.post("/messages/respond", async (req, res) => {
  const { chatId, content } = req.body;
  const trimmedContent = typeof content === "string" ? content.trim() : "";
  if (!chatId || !trimmedContent) {
    return res.status(400).json({ error: "chatId and content are required" });
  }

  try {
    const canAccess = await hasChatAccess(chatId, req.auth.userId);
    if (!canAccess) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const createdUserMessage = await db
      .insert(messages)
      .values({ chatId, role: "user", content: trimmedContent })
      .returning();

    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.id));

    const aiMessages = chatMessages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({ role: message.role, content: message.content }));

    const aiResult = await generateAssistantReply(aiMessages);
    const createdAssistantMessage = await db
      .insert(messages)
      .values({ chatId, role: "assistant", content: aiResult.text })
      .returning();

    return res.status(201).json({
      userMessage: createdUserMessage[0],
      assistantMessage: createdAssistantMessage[0],
      model: aiResult.model,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to generate assistant response" });
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
    const existing = await db.select().from(messages).where(eq(messages.id, id));
    const existingMessage = existing[0];
    if (!existingMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    const hasCurrentAccess = await hasChatAccess(existingMessage.chatId, req.auth.userId);
    if (!hasCurrentAccess) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (update.chatId !== undefined) {
      const canMoveToChat = await hasChatAccess(update.chatId, req.auth.userId);
      if (!canMoveToChat) {
        return res.status(404).json({ error: "Chat not found" });
      }
    }

    const data = await db
      .update(messages)
      .set(update)
      .where(eq(messages.id, id))
      .returning();

    if (data.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    return res.json(data[0]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update message" });
  }
});

router.delete("/messages/:id", async (req, res) => {
  const id = getId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid message id" });
  }

  try {
    const existing = await db.select().from(messages).where(eq(messages.id, id));
    const existingMessage = existing[0];
    if (!existingMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    const canAccess = await hasChatAccess(existingMessage.chatId, req.auth.userId);
    if (!canAccess) {
      return res.status(404).json({ error: "Message not found" });
    }

    const data = await db
      .delete(messages)
      .where(eq(messages.id, id))
      .returning();
    if (data.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete message" });
  }
});

module.exports = router;
