import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

const usersRouter = Router()

usersRouter.get('/', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } })
    res.status(200).json(users)
  } catch (error) {
    next(error)
  }
})

usersRouter.post('/', async (req, res, next) => {
  try {
    const { email, name } = req.body ?? {}
    if (!email) return res.status(400).json({ error: 'email is required' })

    const user = await prisma.user.create({
      data: { email, name: name ?? null },
    })

    return res.status(201).json(user)
  } catch (error) {
    return next(error)
  }
})

export default usersRouter
