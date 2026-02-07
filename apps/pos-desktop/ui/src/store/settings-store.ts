import { Theme, applyTheme, defaultTheme } from '@/shared/lib/theme'
import { Settings } from '@/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  settings: Settings
  theme: Theme
  isDarkMode: boolean
  
  updateSettings: (settings: Partial<Settings>) => void
  updateTheme: (theme: Theme) => void
  toggleDarkMode: () => void
  resetToDefaults: () => void
}

const defaultSettings: Settings = {
  business: {
    name: 'Terencio POS',
    address: '',
    phone: '',
    email: '',
    taxId: '',
  },
  currency: {
    code: 'USD',
    symbol: '$',
  },
  tax: {
    enabled: true,
    rate: 0.1,
    inclusive: false,
  },
  receipt: {
    header: 'Thank you for your purchase!',
    footer: 'Please come again',
    showLogo: true,
  },
  theme: {
    name: 'default',
    primaryColor: '221.2 83.2% 53.3%',
  },
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      theme: defaultTheme,
      isDarkMode: false,

      updateSettings: (newSettings: Partial<Settings>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
            business: { ...state.settings.business, ...newSettings.business },
            currency: { ...state.settings.currency, ...newSettings.currency },
            tax: { ...state.settings.tax, ...newSettings.tax },
            receipt: { ...state.settings.receipt, ...newSettings.receipt },
            theme: { ...state.settings.theme, ...newSettings.theme },
          },
        }))
      },

      updateTheme: (theme: Theme) => {
        applyTheme(theme)
        set({ theme })
      },

      toggleDarkMode: () => {
        const { isDarkMode } = get()
        const newIsDark = !isDarkMode
        
        if (newIsDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        
        set({ isDarkMode: newIsDark })
      },

      resetToDefaults: () => {
        applyTheme(defaultTheme)
        set({
          settings: defaultSettings,
          theme: defaultTheme,
          isDarkMode: false,
        })
      },
    }),
    {
      name: 'settings-storage',
    }
  )
)
