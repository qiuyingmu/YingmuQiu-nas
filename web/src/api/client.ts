import axios from 'axios'

const AUTH_STORAGE_KEY = 'auth-storage'

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

/**
 * 安全读取 zustand persist 存储在 localStorage 中的 JWT token。
 * 不依赖 zustand store 实例，避免循环引用 ——
 * 因为 api 模块在 store 之前加载，直接读取原始存储是最可靠的方式。
 */
function getTokenFromStorage(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.token || null
  } catch {
    return null
  }
}

// 请求拦截器：添加 JWT token
client.interceptors.request.use(
  (config) => {
    const token = getTokenFromStorage()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：解包 ApiResponse + 401 跳转
client.interceptors.response.use(
  (response) => {
    // 后端统一返回 ApiResponse {code, message, data}
    const body = response.data
    if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
      if (body.code === 0) {
        response.data = body.data
      } else {
        return Promise.reject(new Error(body.message || '请求失败'))
      }
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default client
