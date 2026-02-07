import { KeyboardAction, useKeyboardStore } from '@/store/keyboard-store'
import { useEffect } from 'react'

interface UseKeyboardOptions {
  enabled?: boolean
  preventDefault?: boolean
}

export const useKeyboard = (
  action: KeyboardAction,
  callback: () => void,
  options: UseKeyboardOptions = {}
) => {
  const { enabled = true, preventDefault = true } = options
  const { shortcuts } = useKeyboardStore()

  useEffect(() => {
    if (!enabled) return

    const actionShortcuts = shortcuts.filter((s) => s.action === action)

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of actionShortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey
        const altMatch = shortcut.alt ? event.altKey : !event.altKey
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const keyMatch = event.key === shortcut.key

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          if (preventDefault) {
            event.preventDefault()
          }
          callback()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [action, callback, enabled, preventDefault, shortcuts])
}

export const useGlobalKeyboard = (
  handlers: Partial<Record<KeyboardAction, () => void>>,
  options: UseKeyboardOptions = {}
) => {
  const { enabled = true, preventDefault = true } = options
  const { shortcuts } = useKeyboardStore()

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow certain shortcuts even in inputs (like Escape)
        if (event.key !== 'Escape') {
          return
        }
      }

      for (const shortcut of shortcuts) {
        const handler = handlers[shortcut.action]
        if (!handler) continue

        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey
        const altMatch = shortcut.alt ? event.altKey : !event.altKey
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const keyMatch = event.key === shortcut.key

        if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
          if (preventDefault) {
            event.preventDefault()
          }
          handler()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers, enabled, preventDefault, shortcuts])
}
