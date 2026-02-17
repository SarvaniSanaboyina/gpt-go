import { useState } from 'react'
import './ChatPage.css'

const initialChats = [
  { chat_id: 'chat-1', title: 'New Feature Planning' },
  { chat_id: 'chat-2', title: 'API Integration Notes' },
  { chat_id: 'chat-3', title: 'Bug triage for checkout' },
  { chat_id: 'chat-4', title: 'Marketing copy ideas' },
  { chat_id: 'chat-5', title: 'System design prep' },
]

const initialMessages = [
  {
    chat_id: 'chat-1',
    role: 'assistant',
    content:
      'Hello. I can help draft architecture, code, or product copy. What do you want to work on today?',
  },
  {
    chat_id: 'chat-1',
    role: 'user',
    content: 'Set up a route with a component that resembles the ChatGPT chat page.',
  },
  {
    chat_id: 'chat-1',
    role: 'assistant',
    content:
      'Done. I added a chat route and built a split layout with sidebar, thread history, and a composer area.',
  },
  {
    chat_id: 'chat-2',
    role: 'assistant',
    content: 'I can help outline the API contract. Do you want REST or GraphQL for this service?',
  },
  {
    chat_id: 'chat-2',
    role: 'user',
    content: 'REST first. Please suggest endpoints for auth and chat history.',
  },
  {
    chat_id: 'chat-3',
    role: 'assistant',
    content: 'Checkout bug triage loaded. Share the top reproducible issue and logs.',
  },
  {
    chat_id: 'chat-4',
    role: 'assistant',
    content: 'For the launch copy, who is the target audience and primary use case?',
  },
  {
    chat_id: 'chat-5',
    role: 'assistant',
    content: 'System design prep ready. We can do requirements, capacity, then architecture.',
  },
]

function ChatPage() {
  const [chats, setChats] = useState(initialChats)
  const [activeChatId, setActiveChatId] = useState(initialChats[0].chat_id)
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const activeChat = chats.find((chat) => chat.chat_id === activeChatId)
  const activeMessages = messages.filter((message) => message.chat_id === activeChatId)

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, { chat_id: activeChatId, role: 'user', content: trimmed }])
    setInput('')
  }

  const handleNewChat = () => {
    const chatId = `chat-${Date.now()}`
    const newChat = {
      chat_id: chatId,
      title: `New chat ${chats.length + 1}`,
    }

    setChats((prev) => [newChat, ...prev])
    setMessages((prev) => [
      ...prev,
      {
        chat_id: chatId,
        role: 'assistant',
        content: 'New chat created. What would you like to work on?',
      },
    ])
    setActiveChatId(chatId)
    setInput('')
  }

  return (
    <div className="chat-shell">
      <aside className="chat-sidebar">
        <button className="new-chat" onClick={handleNewChat}>+ New chat</button>
        <nav className="chat-list" aria-label="Chat history">
          {chats.map((chat) => (
            <button
              className={`chat-item ${chat.chat_id === activeChatId ? 'active' : ''}`}
              key={chat.chat_id}
              onClick={() => setActiveChatId(chat.chat_id)}
            >
              {chat.title}
            </button>
          ))}
        </nav>
        <div className="chat-sidebar-footer">User Workspace</div>
      </aside>

      <section className="chat-main" aria-label="Conversation">
        <header className="chat-header">
          <span>{activeChat?.title ?? 'ChatGPT Style Demo'}</span>
          <button className="header-action">Share</button>
        </header>

        <div className="chat-thread">
          {activeMessages.map((message, index) => (
            <article className={`message message-${message.role}`} key={`${message.role}-${index}`}>
              <div className="avatar">{message.role === 'assistant' ? 'AI' : 'You'}</div>
              <p>{message.content}</p>
            </article>
          ))}
        </div>

        <footer className="chat-composer-wrap">
          <form className="chat-composer" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Message ChatGPT"
              aria-label="Message input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <button type="submit">Send</button>
          </form>
          <small>Demo UI only. Hook this up to your backend/API next.</small>
        </footer>
      </section>
    </div>
  )
}

export default ChatPage
