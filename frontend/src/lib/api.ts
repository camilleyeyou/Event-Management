import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, {
            refresh: refreshToken,
          })
          useAuthStore.getState().setTokens(data.access, data.refresh)
          originalRequest.headers.Authorization = `Bearer ${data.access}`
          return api(originalRequest)
        } catch {
          useAuthStore.getState().logout()
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
