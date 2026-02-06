import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useShiftStore } from '@/store/shift-store'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ShiftDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const ShiftDialog: React.FC<ShiftDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const [startingCash, setStartingCash] = useState('0.00')
  const { startShift, isLoading, error } = useShiftStore()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parseFloat(startingCash)
    if (isNaN(amount) || amount < 0) {
      return
    }

    try {
      await startShift(amount)
      onClose()
      setStartingCash('0.00')
    } catch (err) {
      console.error('Failed to start shift:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('shift.start.title')}</CardTitle>
          <CardDescription>
            {t('shift.start.description')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="starting-cash">{t('shift.start.startingCash')}</Label>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">{t('currency')}</span>
                <Input
                  id="starting-cash"
                  type="number"
                  step="0.01"
                  min="0"
                  value={startingCash}
                  onChange={(e) => setStartingCash(e.target.value)}
                  className="text-lg"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {t('shift.start.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('shift.start.starting') : t('shift.startShift')}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
