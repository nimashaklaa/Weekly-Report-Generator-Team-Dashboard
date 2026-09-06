import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

interface Props {
  children: React.ReactNode
  roles?: string[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { token, user, fetchingMe } = useAppSelector((s) => s.auth)

  if (!token) return <Navigate to="/login" replace />

  // Wait for /auth/me to resolve before rendering anything role-sensitive
  if (fetchingMe) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (roles && user && !roles.some((r) => user.roles.includes(r))) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
