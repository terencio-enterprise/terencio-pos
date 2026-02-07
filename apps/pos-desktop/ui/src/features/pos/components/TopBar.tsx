import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { useShiftStore } from '@/store/shift-store'
import React from 'react'
import { useNavigate } from 'react-router-dom'

export const TopBar: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { currentShift } = useShiftStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="flex h-16 w-full items-center justify-between border-b px-4 bg-background">
      <div className="flex items-center gap-4">
        <div className="font-bold text-lg">Terencio POS</div>
        {currentShift && (
          <div className="text-xs text-muted-foreground">
            Shift: {new Date(currentShift.start_time).toLocaleTimeString()}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="text-sm">
              <div className="font-medium">{user.full_name || user.username}</div>
              <div className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
