import { ActiveShiftIndicator } from '@/components/shift/active-shift-indicator'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { useSettingsStore } from '@/store/settings-store'
import { Languages, LogOut, Moon, Settings, Sun } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export const TopBar: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { isDarkMode, toggleDarkMode, settings } = useSettingsStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('language', lng)
    setShowLangMenu(false)
  }

  return (
    <div className="flex items-center justify-between border-b bg-card px-6 py-3">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">{settings.business.name}</h1>
        {user && (
          <div className="text-sm text-muted-foreground">
            {t('pos.welcome', { name: user.full_name || user.username })}
          </div>
        )}
      </div>

      <ActiveShiftIndicator />

      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLangMenu(!showLangMenu)}
            title="Change language"
          >
            <Languages className="h-5 w-5" />
          </Button>
          {showLangMenu && (
            <div className="absolute right-0 top-full mt-2 w-32 rounded-md border bg-card shadow-lg z-50">
              <button
                className="w-full px-4 py-2 text-left hover:bg-muted transition-colors rounded-t-md"
                onClick={() => changeLanguage('en')}
              >
                English
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-muted transition-colors rounded-b-md"
                onClick={() => changeLanguage('es')}
              >
                Español
              </button>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          title={t('topbar.toggleTheme')}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/settings')}
          title={t('topbar.settings')}
        >
          <Settings className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title={t('topbar.logout')}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
