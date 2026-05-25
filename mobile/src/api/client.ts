import axios from 'axios'

// 默认 baseURL：模拟器用 10.0.2.2，真机需在 ServerSetupScreen 中设置
let baseURL = ''

const DEFAULT_BASE_URL = 'http://10.0.2.2:8080'

export function setBaseURL(url: string) {
  baseURL = url.replace(/\/+$/, '')
}

export function getBaseURL(): string {
  return baseURL || DEFAULT_BASE_URL
}

const client = axios.create({
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use(
  (config) => {
    config.baseURL = (baseURL || DEFAULT_BASE_URL) + '/api'
    return config
  },
  (error) => Promise.reject(error),
)

client.interceptors.response.use(
  (response) => {
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
      return Promise.reject(new Error('未登录或Token已失效'))
    }
    return Promise.reject(error)
  },
)

export function setAuthToken(token: string | null) {
  if (token) {
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete client.defaults.headers.common['Authorization']
  }
}

export default client
