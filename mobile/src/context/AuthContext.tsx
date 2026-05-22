import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { setAuthToken, setBaseURL, getBaseURL } from '../api/client'
import * as authApi from '../api/auth'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  serverUrl: string
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setServerUrl: (url: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [serverUrl, setServerUrlState] = useState('http://10.0.2.2:8080')

  // Load saved state on mount
  useEffect(() => {
    ;(async () => {
      try {
        const savedUrl = await AsyncStorage.getItem('nas_server_url')
        if (savedUrl) {
          setServerUrlState(savedUrl)
          setBaseURL(savedUrl)
        }
        const savedToken = await AsyncStorage.getItem('nas_token')
        if (savedToken) {
          setToken(savedToken)
          setAuthToken(savedToken)
          try {
            const currentUser = await authApi.getCurrentUser()
            setUser(currentUser)
          } catch {
            await AsyncStorage.removeItem('nas_token')
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await authApi.login(username, password)
      setToken(result.token)
      setUser(result.user)
      setAuthToken(result.token)
      await AsyncStorage.setItem('nas_token', result.token)
    } catch (err: unknown) {
      // Clear stale token on any login error (invalid/expired token, wrong credentials)
      await AsyncStorage.removeItem('nas_token')
      setAuthToken(null)
      setToken(null)
      setUser(null)
      // Re-throw with user-friendly message for network issues
      if (err instanceof Error) {
        const msg = err.message
        if (msg === 'Network Error' || msg.includes('timeout') || msg.includes('connect')) {
          throw new Error('无法连接到服务器，请检查网络连接和服务器地址')
        }
        throw err
      }
      throw new Error('登录失败，请重试')
    }
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    try {
      await authApi.register(username, email, password)
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message
        if (msg === 'Network Error' || msg.includes('timeout') || msg.includes('connect')) {
          throw new Error('无法连接到服务器，请检查网络连接和服务器地址')
        }
        throw err
      }
      throw new Error('注册失败，请重试')
    }
  }, [])

  const logout = useCallback(async () => {
    setToken(null)
    setUser(null)
    setAuthToken(null)
    await AsyncStorage.removeItem('nas_token')
  }, [])

  const setServerUrlFn = useCallback(async (url: string) => {
    const normalized = url.replace(/\/+$/, '')
    setServerUrlState(normalized)
    setBaseURL(normalized)
    await AsyncStorage.setItem('nas_server_url', normalized)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, token, loading, serverUrl, login, register, logout, setServerUrl: setServerUrlFn }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
