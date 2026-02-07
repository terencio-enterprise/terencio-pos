import { TopBar } from '@/features/pos/components/TopBar'
import { useShiftStore } from '@/store/shift-store'
import React, { useEffect } from 'react'

export const PosLayout: React.FC = () => {
  const loadCurrentShift = useShiftStore(state => state.loadCurrentShift)

  useEffect(() => {
    // Load current shift when POS is accessed (shift should be auto-created on login)
    loadCurrentShift()
  }, [])

  return (
    <div className="flex h-screen w-full flex-col bg-background overflow-hidden">
      <TopBar />

      <main className="flex flex-1 overflow-hidden">
  
      </main>
    </div>
  )
}
