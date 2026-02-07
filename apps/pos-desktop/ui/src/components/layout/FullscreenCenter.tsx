import React from 'react'

interface FullscreenCenterProps {
  children: React.ReactNode
}

export const FullscreenCenter: React.FC<FullscreenCenterProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {children}
    </div>
  )
}
