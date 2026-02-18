import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { prisma } from './lib/prisma.js'
import chatsRouter from './routes/chats.js'
import healthRouter from './routes/health.js'
import usersRouter from './routes/users.js'

const PORT = Number(process.env.PORT || 4000)
const app = express()

app.use(cors())
app.use(express.json())

app.use('/health', healthRouter)
app.use('/api/users', usersRouter)
app.use('/api/chats', chatsRouter)

app.use((error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : 'Internal server error'
  res.status(500).json({ error: message })
})

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

let isShuttingDown = false

const shutdown = async (signal) => {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log(`Received ${signal}. Shutting down...`)

  server.close(async () => {
    try {
      await prisma.$disconnect()
      console.log('Prisma disconnected')
      process.exit(0)
    } catch (error) {
      console.error('Failed to disconnect Prisma:', error)
      process.exit(1)
    }
  })
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})
