import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useShiftStore } from '@/store/shift-store'
import { AlertCircle } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface EndShiftDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const EndShiftDialog: React.FC<EndShiftDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const [countedCash, setCountedCash] = useState('0.00')
  const [notes, setNotes] = useState('')
  const { currentShift, endShift, isLoading, error } = useShiftStore()

  if (!isOpen || !currentShift) return null

  const expectedCash = currentShift.expected_cash
  const countedAmount = parseFloat(countedCash) || 0
  const discrepancy = countedAmount - expectedCash

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await endShift(countedAmount, notes || undefined)
      onClose()
      setCountedCash('0.00')
      setNotes('')
    } catch (err) {
      console.error('Failed to end shift:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('shift.end.title')}</CardTitle>
          <CardDescription>
            {t('shift.end.description')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Expected Cash */}
            <div className="rounded-lg border bg-muted p-3">
              <Label className="text-xs text-muted-foreground">{t('shift.end.expectedCash')}</Label>
              <div className="text-2xl font-bold">{t('currency')}{expectedCash.toFixed(2)}</div>
            </div>

            {/* Counted Cash Input */}
            <div className="space-y-2">
              <Label htmlFor="counted-cash">{t('shift.end.countedCash')}</Label>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">{t('currency')}</span>
                <Input
                  id="counted-cash"
                  type="number"
                  step="0.01"
                  min="0"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  className="text-lg"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {/* Discrepancy Display */}
            {countedCash !== '' && (
              <div
                className={`rounded-lg border p-3 ${
                  Math.abs(discrepancy) > 0.01
                    ? 'border-destructive bg-destructive/10'
                    : 'border-green-500 bg-green-500/10'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {Math.abs(discrepancy) > 0.01 && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <Label className="text-xs">{t('shift.end.discrepancy')}</Label>
                    <div
                      className={`text-xl font-bold ${
                        Math.abs(discrepancy) > 0.01
                          ? 'text-destructive'
                          : 'text-green-600'
                      }`}
                    >
                      {discrepancy >= 0 ? '+' : ''}{t('currency')}{discrepancy.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('shift.end.notes')}</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={t('shift.end.notesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('shift.end.ending') : t('shift.endShift')}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
