import { LoginPage } from '@/features/auth/pages/login-page'
import { ProtectedRoute } from '@/features/auth/pages/protected-route'
import { PosScreen } from '@/features/pos/pages/pos-screen'
import { SyncCheck } from '@/features/sync/sync-check'
import { SyncWizardPage } from '@/features/sync/sync-wizard-page'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Sync Wizard - No auth or sync check required */}
        <Route path="/sync" element={<SyncWizardPage />} />
        
        {/* Login - Requires sync but not auth */}
        <Route 
          path="/login" 
          element={
            <SyncCheck>
              <LoginPage />
            </SyncCheck>
          } 
        />
        
        {/* Protected routes - Require both sync and auth */}
        <Route
          path="/pos"
          element={
            <SyncCheck>
              <ProtectedRoute>
                <PosScreen />
              </ProtectedRoute>
            </SyncCheck>
          }
        />
        
        {/* Default redirect to POS */}
        <Route path="/" element={<Navigate to="/pos" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App