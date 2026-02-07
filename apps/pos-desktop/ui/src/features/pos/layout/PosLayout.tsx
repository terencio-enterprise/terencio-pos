import { TopBar } from '@/features/pos/components/TopBar'
import React from 'react'

export const PosLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full flex-col bg-background overflow-hidden">
      <TopBar />

      <main className="flex flex-1 overflow-hidden">
  
      </main>
    </div>
  )
}
