import { Navigate } from 'react-router-dom'

import { LoginPage } from '@/pages/login/LoginPage'
import { PosPage } from '@/pages/pos/PosPage'
import { SyncWizardPage } from '@/pages/sync/SyncWizardPage'

import { ProtectedRoute } from '@/features/auth/routes/ProtectedRoute'
import { SyncCheck } from '@/features/sync/routes/SyncCheck'

export const routes = [
  {
    path: '/sync',
    element: <SyncWizardPage />,
  },
  {
    path: '/login',
    element: (
      <SyncCheck>
        <LoginPage />
      </SyncCheck>
    ),
  },
  {
    path: '/pos',
    element: (
      <SyncCheck>
        <ProtectedRoute>
          <PosPage />
        </ProtectedRoute>
      </SyncCheck>
    ),
  },
  {
    path: '/',
    element: <Navigate to="/pos" replace />,
  },
]
