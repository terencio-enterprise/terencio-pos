import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/store/auth-store'
import { Lock, User as UserIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export const LoginPage: React.FC = () => {
  const { t } = useTranslation()
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const { users, loadUsers, login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleUserSelect = (username: string) => {
    setSelectedUser(username)
    setPin('')
    clearError()
  }

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit)
    }
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
  }

  const handleClear = () => {
    setPin('')
  }

  const handleBack = () => {
    setSelectedUser(null)
    setPin('')
    clearError()
  }

  const handleSubmit = async () => {
    if (!selectedUser || pin.length === 0) return

    try {
      await login(selectedUser, pin)
      navigate('/pos')
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  const selectedUserData = users.find(u => u.username === selectedUser)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">{t('app.name')}</CardTitle>
          <CardDescription>
            {selectedUser ? t('auth.enterPin', { name: selectedUserData?.full_name || selectedUser }) : t('auth.selectUser')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!selectedUser ? (
            <div className="grid grid-cols-1 gap-3">
              {users.map((user) => (
                <Button
                  key={user.uuid}
                  variant="outline"
                  className="h-16 justify-start text-lg"
                  onClick={() => handleUserSelect(user.username)}
                  disabled={isLoading}
                >
                  <UserIcon className="mr-3 h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">{user.full_name || user.username}</div>
                    <div className="text-xs text-muted-foreground">{t(`roles.${user.role}`)}</div>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* PIN Display */}
              <div className="flex items-center justify-center space-x-2 rounded-lg border-2 border-primary/20 bg-muted p-4">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div className="flex space-x-2">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-full ${
                        i < pin.length ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* PIN Pad */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <Button
                    key={digit}
                    variant="outline"
                    size="lg"
                    className="h-16 text-2xl font-semibold"
                    onClick={() => handlePinInput(digit.toString())}
                    disabled={isLoading || pin.length >= 6}
                  >
                    {digit}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16"
                  onClick={handleClear}
                  disabled={isLoading || pin.length === 0}
                >
                  {t('common.clear')}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 text-2xl font-semibold"
                  onClick={() => handlePinInput('0')}
                  disabled={isLoading || pin.length >= 6}
                >
                  0
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16"
                  onClick={handleBackspace}
                  disabled={isLoading || pin.length === 0}
                >
                  ⌫
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  {t('auth.back')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || pin.length === 0}
                >
                  {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
