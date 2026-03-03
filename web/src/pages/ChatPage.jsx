import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../lib/api'
import { clearAuthToken, getAuthToken } from '../lib/auth'
import './ChatPage.css'

function ChatPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [respondingChatId, setRespondingChatId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      if (!getAuthToken()) {
        navigate('/login', { replace: true })
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
        navigate('/login', { replace: true })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    bootstrap()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId),
    [chats, activeChatId],
  )

  const activeMessages = useMemo(
    () => messages.filter((message) => message.chatId === activeChatId),
    [messages, activeChatId],
  )

  const handleLogout = () => {
    clearAuthToken()
    navigate('/login', { replace: true })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || !activeChatId || respondingChatId !== null) return

    try {
      setError('')
      setInput('')
      setRespondingChatId(activeChatId)
      const response = await api.respondToMessage({
        chatId: activeChatId,
        content: trimmed,
      })
      setMessages((prev) => [
        ...prev,
        ...(response?.userMessage ? [response.userMessage] : []),
        ...(response?.assistantMessage ? [response.assistantMessage] : []),
      ])
    } catch (err) {
      setError(err.message || 'Failed to send message')
    } finally {
      setRespondingChatId(null)
    }
  }

  const handleInputKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
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
                <div className="message-content">
                  {message.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="message-paragraph">{children}</p>,
                        ul: ({ children }) => <ul className="message-list">{children}</ul>,
                        ol: ({ children }) => <ol className="message-list">{children}</ol>,
                        pre: ({ children }) => <pre className="message-code-block">{children}</pre>,
                        code: ({ className, children, ...props }) => {
                          const language = className?.replace('language-', '')
                          return (
                            <code className={className} {...props}>
                              {language ? <span className="message-code-lang">{language}</span> : null}
                              {children}
                            </code>
                          )
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="message-paragraph">{message.content}</p>
                  )}
                </div>
              </article>
            ))}
            {respondingChatId === activeChatId ? (
              <article className="message message-assistant message-loader" aria-live="polite">
                <div className="avatar">AI</div>
                <p className="typing-indicator" aria-label="AI is responding">
                  <span />
                  <span />
                  <span />
                </p>
              </article>
            ) : null}
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
              onKeyDown={handleInputKeyDown}
              disabled={!activeChatId || loading || respondingChatId !== null}
            />
            <button type="submit" disabled={!activeChatId || loading || respondingChatId !== null}>
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
