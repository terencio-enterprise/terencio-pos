import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { useSettingsStore } from '@/store/settings-store'
import { LogOut, Moon, Settings, Sun } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'

export const TopBar: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { isDarkMode, toggleDarkMode, settings } = useSettingsStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex items-center justify-between border-b bg-card px-6 py-3">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">{settings.business.name}</h1>
        {user && (
          <div className="text-sm text-muted-foreground">
            Welcome, {user.name}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          title="Toggle theme"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/settings')}
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
