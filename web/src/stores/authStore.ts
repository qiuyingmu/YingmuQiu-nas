import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as loginApi, register as registerApi, getCurrentUser, type LoginRequest, type RegisterRequest } from '../api/auth'

interface User {
  id: string
  username: string
  email: string
  displayName?: string
  storageQuota?: number
  storageUsed?: number
}

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  initialized: boolean

  init: () => Promise<void>
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loading: false,
      initialized: false,

      init: async () => {
        if (get().initialized) return
        const token = get().token
        if (token) {
          set({ loading: true })
          try {
            const user = await getCurrentUser()
            set({ user, loading: false, initialized: true })
          } catch {
            set({ token: null, user: null, loading: false, initialized: true })
          }
        } else {
          set({ initialized: true })
        }
      },

      login: async (data: LoginRequest) => {
        set({ loading: true })
        try {
          const response = await loginApi(data)
          set({
            token: response.token,
            user: response.user,
            loading: false,
          })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      register: async (data: RegisterRequest) => {
        set({ loading: true })
        try {
          await registerApi(data)
          set({ loading: false })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      logout: () => {
        set({ token: null, user: null })
        localStorage.removeItem('auth-storage')
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
      }),
    },
  ),
)
