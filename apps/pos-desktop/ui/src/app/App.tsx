import { LoginPage } from '@/features/auth/login-page'
import { ProtectedRoute } from '@/features/auth/protected-route'
import { PosScreen } from '@/features/pos/pos-screen'
import { SettingsPage } from '@/features/settings/settings-page'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <PosScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/pos" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App