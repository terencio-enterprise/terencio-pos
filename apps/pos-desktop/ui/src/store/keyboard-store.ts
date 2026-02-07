import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type KeyboardAction =
  | 'SEARCH_FOCUS'
  | 'NEW_TRANSACTION'
  | 'CLEAR_CART'
  | 'CHECKOUT'
  | 'SETTINGS'
  | 'CANCEL'
  | 'HELP'

export interface KeyboardShortcut {
  action: KeyboardAction
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  description: string
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { action: 'SEARCH_FOCUS', key: 'F1', description: 'Focus product search' },
  { action: 'SEARCH_FOCUS', key: '/', description: 'Focus product search (alt)' },
  { action: 'NEW_TRANSACTION', key: 'F2', description: 'New transaction' },
  { action: 'CLEAR_CART', key: 'F3', description: 'Clear cart' },
  { action: 'SETTINGS', key: 'F9', description: 'Open settings' },
  { action: 'CHECKOUT', key: 'F12', description: 'Checkout' },
  { action: 'CANCEL', key: 'Escape', description: 'Cancel/Close' },
  { action: 'HELP', key: 'F1', shift: true, description: 'Show keyboard shortcuts' },
]

interface KeyboardState {
  shortcuts: KeyboardShortcut[]
  updateShortcut: (action: KeyboardAction, shortcut: Partial<KeyboardShortcut>) => void
  resetShortcuts: () => void
  getShortcutForAction: (action: KeyboardAction) => KeyboardShortcut | undefined
  getKeyString: (shortcut: KeyboardShortcut) => string
}

export const useKeyboardStore = create<KeyboardState>()(
  persist(
    (set, get) => ({
      shortcuts: DEFAULT_SHORTCUTS,

      updateShortcut: (action, updates) => {
        set((state) => ({
          shortcuts: state.shortcuts.map((s) =>
            s.action === action ? { ...s, ...updates } : s
          ),
        }))
      },

      resetShortcuts: () => {
        set({ shortcuts: DEFAULT_SHORTCUTS })
      },

      getShortcutForAction: (action) => {
        return get().shortcuts.find((s) => s.action === action)
      },

      getKeyString: (shortcut) => {
        const parts: string[] = []
        if (shortcut.ctrl) parts.push('Ctrl')
        if (shortcut.alt) parts.push('Alt')
        if (shortcut.shift) parts.push('Shift')
        parts.push(shortcut.key)
        return parts.join('+')
      },
    }),
    {
      name: 'keyboard-shortcuts',
    }
  )
)
