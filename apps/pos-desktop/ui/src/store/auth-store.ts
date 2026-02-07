import { User } from '@terencio/domain'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShiftStore } from './shift-store'

interface AuthState {
  user: Omit<User, 'pin_hash'> | null
  users: Omit<User, 'pin_hash'>[]
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  loadUsers: () => Promise<void>
  login: (username: string, pin: string) => Promise<void>
  logout: () => Promise<void>
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

          // Shift is automatically started in the backend
          // No need to manually start it here
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          })
          throw error
        }
      },

      logout: async () => {
        try {
          // Shift is automatically closed in the backend
          await window.electronAPI.auth.logout()
          
          // Clear shift from UI store
          useShiftStore.getState().clearShift()
          
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          })
        } catch (error) {
          console.error('Logout error:', error)
          // Still clear the user state even if logout fails
          useShiftStore.getState().clearShift()
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          })
        }
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
