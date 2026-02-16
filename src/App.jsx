import { Navigate, Route, Routes } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import './App.css'

function App() {
  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<Navigate replace to="/chat" />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </div>
  )
}

export default App
