import axios from 'axios'
import { getAuthToken } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function toError(error) {
  const message =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    'Request failed'

  return new Error(message)
}

async function request(config) {
  try {
    const response = await client.request(config)
    return response.data ?? null
  } catch (error) {
    throw toError(error)
  }
}

export const api = {
  register: (payload) => request({ method: 'post', url: '/auth/register', data: payload }),
  login: (payload) => request({ method: 'post', url: '/auth/login', data: payload }),
  me: () => request({ method: 'get', url: '/auth/me' }),
  getUsers: () => request({ method: 'get', url: '/users' }),
  getChats: () => request({ method: 'get', url: '/chats' }),
  createChat: (payload) => request({ method: 'post', url: '/chats', data: payload }),
  getMessages: () => request({ method: 'get', url: '/messages' }),
  createMessage: (payload) => request({ method: 'post', url: '/messages', data: payload }),
  respondToMessage: (payload) => request({ method: 'post', url: '/messages/respond', data: payload }),
}
