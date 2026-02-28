import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  getUsers: () => request({ method: 'get', url: '/users' }),
  createUser: (payload) => request({ method: 'post', url: '/users', data: payload }),
  getChats: () => request({ method: 'get', url: '/chats' }),
  createChat: (payload) => request({ method: 'post', url: '/chats', data: payload }),
  getMessages: () => request({ method: 'get', url: '/messages' }),
  createMessage: (payload) => request({ method: 'post', url: '/messages', data: payload }),
}
