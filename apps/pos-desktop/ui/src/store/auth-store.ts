import { User } from '@terencio/domain'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: Omit<User, 'pin_hash'> | null
  users: Omit<User, 'pin_hash'>[]
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  loadUsers: () => Promise<void>
  login: (username: string, pin: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      users: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,

      loadUsers: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const users = await window.electronAPI.auth.listUsers()
          set({
            users,
            isLoading: false,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load users',
            isLoading: false,
          })
        }
      },

      login: async (username: string, pin: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const user = await window.electronAPI.auth.login(username, pin)
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          })
          throw error
        }
      },

      logout: () => {
        window.electronAPI.auth.logout()
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
