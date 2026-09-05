import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

interface Props {
  children: React.ReactNode
  roles?: string[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { token, user } = useAppSelector((s) => s.auth)

  if (!token) return <Navigate to="/login" replace />

  if (roles && user && !roles.some((r) => user.roles.includes(r))) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
