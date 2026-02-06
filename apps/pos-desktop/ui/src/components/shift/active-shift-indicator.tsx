import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EndShiftDialog } from '@/features/shift/end-shift-dialog'
import { useShiftStore } from '@/store/shift-store'
import { Clock, DollarSign } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export const ActiveShiftIndicator: React.FC = () => {
  const { t } = useTranslation()
  const { currentShift, loadCurrentShift } = useShiftStore()
  const [duration, setDuration] = useState('')
  const [showEndDialog, setShowEndDialog] = useState(false)

  useEffect(() => {
    loadCurrentShift()
  }, [loadCurrentShift])

  useEffect(() => {
    if (!currentShift || currentShift.status !== 'OPEN') {
      setDuration('')
      return
    }

    const updateDuration = () => {
      const start = new Date(currentShift.start_time)
      const now = new Date()
      const diff = now.getTime() - start.getTime()

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setDuration(`${hours}h ${minutes}m`)
    }

    updateDuration()
    const interval = setInterval(updateDuration, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [currentShift])

  if (!currentShift || currentShift.status !== 'OPEN') {
    return null
  }

  return (
    <>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Badge variant="default" className="bg-green-600">
            {t('shift.shiftOpen')}
          </Badge>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>{t('currency')}{currentShift.starting_cash.toFixed(2)}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEndDialog(true)}
        >
          {t('shift.endShift')}
        </Button>
      </div>

      <EndShiftDialog
        isOpen={showEndDialog}
        onClose={() => setShowEndDialog(false)}
      />
    </>
  )
}
