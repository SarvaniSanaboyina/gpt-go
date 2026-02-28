import { Navigate, Route, Routes } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import { getAuthToken } from './lib/auth'
import './App.css'

function ProtectedRoute({ children }) {
  if (!getAuthToken()) {
    return <Navigate replace to="/login" />
  }
  return children
}

function App() {
  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<Navigate replace to={getAuthToken() ? '/chat' : '/login'} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
