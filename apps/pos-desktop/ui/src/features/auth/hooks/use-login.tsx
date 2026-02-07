import { useAuthStore } from '@/store/auth-store'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export type DotState = 'error' | 'filled' | 'active' | 'empty'

export const useLogin = () => {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [isPinFocused, setIsPinFocused] = useState(false)
  const [errorState, setErrorState] = useState(false)

  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const usernameRef = useRef<HTMLInputElement | null>(null)
  const pinContainerRef = useRef<HTMLDivElement | null>(null)

  // 1. Helper to determine the visual state of a dot
  // This moves the logic out of the component
  const getDotState = (index: number): DotState => {
    if (errorState) return 'error'
    if (index < pin.length) return 'filled'
    if (index === pin.length && isPinFocused) return 'active'
    return 'empty'
  }

  // 2. Error Animation Trigger
  const triggerErrorAnimation = () => {
    setErrorState(true)
    if (navigator.vibrate) navigator.vibrate(200)

    // Keep red for 500ms, then reset everything
    setTimeout(() => {
      setPin('')
      setErrorState(false)
      clearError()
      pinContainerRef.current?.focus()
    }, 500)
  }

  // 3. Handle Login
  const handleLoginSubmit = async () => {
    if (!username || pin.length !== 6 || isLoading) return

    try {
      await login(username.trim(), pin)
      navigate('/pos')
    } catch (err) {
      console.error('Login attempt failed', err)
      triggerErrorAnimation()
    }
  }

  // 4. Auto-submit effect
  useEffect(() => {
    if (pin.length === 6 && username.trim() && !isLoading && !errorState) {
      handleLoginSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, username])

  // 5. Watch for external store errors
  useEffect(() => {
    if (error && !errorState) {
      triggerErrorAnimation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  // 6. Focus Management
  useEffect(() => {
    usernameRef.current?.focus()
    
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Avoid capturing if already focused on inputs
      if (
        document.activeElement === usernameRef.current ||
        document.activeElement === pinContainerRef.current
      ) {
        return
      }

      // Type directly into username if standard keys
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        usernameRef.current?.focus()
        setUsername((prev) => prev + e.key)
      }

      if (e.key === 'Backspace') {
        usernameRef.current?.focus()
        setUsername((prev) => prev.slice(0, -1))
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  // 7. Input Handlers
  const handlePinInput = (value: string) => {
    if (errorState || isLoading) return

    if (value === 'Backspace') {
      setPin((prev) => prev.slice(0, -1))
      return
    }
    if (value === 'Clear') {
      setPin('')
      return
    }
    if (pin.length < 6 && /^\d$/.test(value)) {
      setPin((prev) => prev + value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      usernameRef.current?.focus()
    }
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      if (document.activeElement === usernameRef.current) {
        e.preventDefault()
        pinContainerRef.current?.focus()
      }
    }

    if (document.activeElement === pinContainerRef.current) {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handlePinInput(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        if (pin.length === 0) {
          usernameRef.current?.focus()
        } else {
          handlePinInput('Backspace')
        }
      } else if (e.key === 'Delete' || e.key === 'Escape') {
        e.preventDefault()
        handlePinInput('Clear')
      }
    }
  }

  return {
    username,
    setUsername,
    pin,
    isPinFocused,
    setIsPinFocused,
    errorState,
    isLoading,
    usernameRef,
    pinContainerRef,
    handlePinInput,
    handleKeyDown,
    getDotState,
    clearError
  }
}