import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import './ChatPage.css'

function ChatPage() {
  const [currentUserId, setCurrentUserId] = useState(null)
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      try {
        setLoading(true)
        setError('')

        let users = await api.getUsers()
        if (users.length === 0) {
          const createdUser = await api.createUser({
            name: 'Demo User',
            email: `demo-${Date.now()}@example.com`,
          })
          users = [createdUser]
        }

        const userId = users[0].id
        const allChats = await api.getChats()
        const userChats = allChats.filter((chat) => chat.userId === userId)
        const allMessages = await api.getMessages()

        if (!isMounted) return

        setCurrentUserId(userId)
        setChats(userChats)
        setMessages(allMessages)
        setActiveChatId(userChats[0]?.id ?? null)
      } catch (err) {
        if (!isMounted) return
        setError(err.message || 'Failed to load data')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    bootstrap()

    return () => {
      isMounted = false
    }
  }, [])

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId),
    [chats, activeChatId],
  )

  const activeMessages = useMemo(
    () => messages.filter((message) => message.chatId === activeChatId),
    [messages, activeChatId],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || !activeChatId) return

    try {
      setError('')
      const created = await api.createMessage({
        chatId: activeChatId,
        role: 'user',
        content: trimmed,
      })
      setMessages((prev) => [...prev, created])
      setInput('')
    } catch (err) {
      setError(err.message || 'Failed to send message')
    }
  }

  const handleNewChat = async () => {
    if (!currentUserId) return

    try {
      setError('')
      const createdChat = await api.createChat({
        userId: currentUserId,
        title: `New chat ${chats.length + 1}`,
      })

      setChats((prev) => [createdChat, ...prev])
      setActiveChatId(createdChat.id)
      setInput('')
    } catch (err) {
      setError(err.message || 'Failed to create chat')
    }
  }

  return (
    <div className="chat-shell">
      <aside className="chat-sidebar">
        <button className="new-chat" onClick={handleNewChat} disabled={loading || !currentUserId}>
          + New chat
        </button>
        <nav className="chat-list" aria-label="Chat history">
          {chats.map((chat) => (
            <button
              className={`chat-item ${chat.id === activeChatId ? 'active' : ''}`}
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
            >
              {chat.title}
            </button>
          ))}
        </nav>
        <div className="chat-sidebar-footer">User Workspace</div>
      </aside>

      <section className="chat-main" aria-label="Conversation">
        <header className="chat-header">
          <span>{activeChat?.title ?? 'Select or create a chat'}</span>
          <button className="header-action" disabled>
            Share
          </button>
        </header>

        {loading ? <div className="chat-thread">Loading...</div> : null}
        {!loading && error ? <div className="chat-thread">Error: {error}</div> : null}

        {!loading && !error ? (
          <div className="chat-thread">
            {activeMessages.length === 0 ? (
              <article className="message message-assistant">
                <div className="avatar">AI</div>
                <p>No messages yet. Start the conversation.</p>
              </article>
            ) : null}
            {activeMessages.map((message) => (
              <article className={`message message-${message.role}`} key={message.id}>
                <div className="avatar">{message.role === 'assistant' ? 'AI' : 'You'}</div>
                <p>{message.content}</p>
              </article>
            ))}
          </div>
        ) : null}

        <footer className="chat-composer-wrap">
          <form className="chat-composer" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Message"
              aria-label="Message input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={!activeChatId || loading}
            />
            <button type="submit" disabled={!activeChatId || loading}>
              Send
            </button>
          </form>
          <small>Connected to Express + Drizzle API.</small>
        </footer>
      </section>
    </div>
  )
}

export default ChatPage
