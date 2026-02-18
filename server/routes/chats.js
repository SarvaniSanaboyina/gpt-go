import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const chatsRouter = Router()

chatsRouter.get('/', async (req, res, next) => {
  try {
    const userId = Number(req.query.userId)
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'userId query param is required' })
    }

    const chats = await prisma.chat.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json(chats)
  } catch (error) {
    return next(error)
  }
})

chatsRouter.post('/', async (req, res, next) => {
  try {
    const userId = Number(req.body?.userId)
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'userId is required' })
    }

    const chat = await prisma.chat.create({
      data: {
        userId,
        title: req.body?.title ?? 'New chat',
      },
    })

    return res.status(201).json(chat)
  } catch (error) {
    return next(error)
  }
})

chatsRouter.get('/:chatId/messages', async (req, res, next) => {
  try {
    const chatId = Number(req.params.chatId)
    if (!Number.isInteger(chatId) || chatId <= 0) {
      return res.status(400).json({ error: 'Invalid chat id' })
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    })

    return res.status(200).json(messages)
  } catch (error) {
    return next(error)
  }
})

chatsRouter.post('/:chatId/messages', async (req, res, next) => {
  try {
    const chatId = Number(req.params.chatId)
    if (!Number.isInteger(chatId) || chatId <= 0) {
      return res.status(400).json({ error: 'Invalid chat id' })
    }

    const { text, role } = req.body ?? {}
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' })
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        role: role ?? 'user',
        text,
      },
    })

    return res.status(201).json(message)
  } catch (error) {
    return next(error)
  }
})

export default chatsRouter
