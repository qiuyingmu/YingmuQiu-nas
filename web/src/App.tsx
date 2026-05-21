import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import FileBrowser from './pages/FileBrowser'
import MediaLibrary from './pages/MediaLibrary'
import PhotoWall from './pages/PhotoWall'
import ShareView from './pages/ShareView'
import AuthLayout from './components/AuthLayout'
import MainLayout from './components/MainLayout'
import { useEffect, type ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)

  if (token) {
    return <Navigate to="/files" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/files" replace />} />

      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/files" element={<FileBrowser />} />
        <Route path="/files/:id" element={<FileBrowser />} />
        <Route path="/media" element={<MediaLibrary />} />
        <Route path="/photos" element={<PhotoWall />} />
      </Route>

      <Route path="/s/:token" element={<ShareView />} />

      <Route path="*" element={<Navigate to="/files" replace />} />
    </Routes>
  )
}
