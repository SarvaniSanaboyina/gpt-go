import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { clearAuthToken, getAuthToken, setAuthToken } from '../lib/auth'
import './ChatPage.css'

const initialAuthState = {
  name: '',
  email: '',
  password: '',
}

function ChatPage() {
  const [user, setUser] = useState(null)
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(initialAuthState)
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      if (!getAuthToken()) {
        if (isMounted) setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        const currentUser = await api.me()
        const allChats = await api.getChats()
        const allMessages = await api.getMessages()

        if (!isMounted) return

        setUser(currentUser)
        setChats(allChats)
        setMessages(allMessages)
        setActiveChatId(allChats[0]?.id ?? null)
      } catch (err) {
        if (!isMounted) return
        clearAuthToken()
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

  const handleAuthChange = (event) => {
    const { name, value } = event.target
    setAuthForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()

    try {
      setAuthLoading(true)
      setError('')

      const payload = {
        email: authForm.email.trim(),
        password: authForm.password,
      }

      let response
      if (authMode === 'register') {
        response = await api.register({ ...payload, name: authForm.name.trim() })
      } else {
        response = await api.login(payload)
      }

      setAuthToken(response.token)
      setUser(response.user)

      const allChats = await api.getChats()
      const allMessages = await api.getMessages()

      setChats(allChats)
      setMessages(allMessages)
      setActiveChatId(allChats[0]?.id ?? null)
      setAuthForm(initialAuthState)
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    clearAuthToken()
    setUser(null)
    setChats([])
    setMessages([])
    setActiveChatId(null)
    setInput('')
    setError('')
  }

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
    if (!user) return

    try {
      setError('')
      const createdChat = await api.createChat({
        title: `New chat ${chats.length + 1}`,
      })

      setChats((prev) => [createdChat, ...prev])
      setActiveChatId(createdChat.id)
      setInput('')
    } catch (err) {
      setError(err.message || 'Failed to create chat')
    }
  }

  if (!user && !loading) {
    return (
      <div className="auth-shell">
        <form className="auth-card" onSubmit={handleAuthSubmit}>
          <h1>Chat Bot</h1>
          <p>{authMode === 'register' ? 'Create your account' : 'Sign in to continue'}</p>

          {authMode === 'register' ? (
            <label>
              Name
              <input
                name="name"
                type="text"
                value={authForm.name}
                onChange={handleAuthChange}
                required
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              name="email"
              type="email"
              value={authForm.email}
              onChange={handleAuthChange}
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={authForm.password}
              onChange={handleAuthChange}
              required
              minLength={8}
            />
          </label>

          <button type="submit" disabled={authLoading}>
            {authLoading ? 'Please wait...' : authMode === 'register' ? 'Create account' : 'Sign in'}
          </button>

          <button
            type="button"
            className="link-button"
            onClick={() => setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          >
            {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>

          {error ? <div className="auth-error">{error}</div> : null}
        </form>
      </div>
    )
  }

  return (
    <div className="chat-shell">
      <aside className="chat-sidebar">
        <button className="new-chat" onClick={handleNewChat} disabled={loading || !user}>
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
        <div className="chat-sidebar-footer">
          <div>{user?.email}</div>
          <button className="link-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
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
          <small>Connected to authenticated Express + Drizzle API.</small>
        </footer>
      </section>
    </div>
  )
}

export default ChatPage
