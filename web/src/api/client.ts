import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ?????:?? JWT token
client.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const token = parsed?.state?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch {
        // ignore parse error
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ?????:?? ApiResponse + 401 ??
client.interceptors.response.use(
  (response) => {
    // ?????? ApiResponse {code, message, data}
    const body = response.data
    if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
      if (body.code === 0) {
        response.data = body.data
      } else {
        return Promise.reject(new Error(body.message || '????'))
      }
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default client
