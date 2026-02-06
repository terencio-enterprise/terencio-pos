import { Shift } from '@terencio/domain'
import { create } from 'zustand'

interface ShiftState {
  currentShift: Shift | null
  shiftHistory: Shift[]
  isLoading: boolean
  error: string | null
  
  loadCurrentShift: () => Promise<void>
  startShift: (startingCash: number) => Promise<void>
  endShift: (countedCash: number, notes?: string) => Promise<void>
  loadHistory: () => Promise<void>
  clearError: () => void
}

export const useShiftStore = create<ShiftState>((set) => ({
  currentShift: null,
  shiftHistory: [],
  isLoading: false,
  error: null,

  loadCurrentShift: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const shift = await window.electronAPI.shift.getCurrent()
      set({
        currentShift: shift,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load current shift',
        isLoading: false,
      })
    }
  },

  startShift: async (startingCash: number) => {
    set({ isLoading: true, error: null })
    
    try {
      const shift = await window.electronAPI.shift.start(startingCash)
      set({
        currentShift: shift,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start shift',
        isLoading: false,
      })
      throw error
    }
  },

  endShift: async (countedCash: number, notes?: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const shift = await window.electronAPI.shift.end(countedCash, notes)
      set({
        currentShift: null,
        shiftHistory: [shift],
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to end shift',
        isLoading: false,
      })
      throw error
    }
  },

  loadHistory: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const history = await window.electronAPI.shift.getHistory()
      set({
        shiftHistory: history,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load shift history',
        isLoading: false,
      })
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))
