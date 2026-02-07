import { useSyncStore } from '@/store/sync-store'
import { Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

interface SyncCheckProps {
  children: React.ReactNode
}

export const SyncCheck: React.FC<SyncCheckProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)
  const { checkSyncStatus } = useSyncStore()

  useEffect(() => {
    const checkStatus = async () => {
      const registered = await checkSyncStatus()
      setIsRegistered(registered)
      setIsChecking(false)
    }

    checkStatus()
  }, [checkSyncStatus])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking registration status...</p>
        </div>
      </div>
    )
  }

  if (!isRegistered) {
    return <Navigate to="/sync" replace />
  }

  return <>{children}</>
}
