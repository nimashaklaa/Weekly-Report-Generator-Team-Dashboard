import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchMe } from '@/store/slices/authSlice'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/shared/ProtectedRoute'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ActivateAccountPage from '@/pages/auth/ActivateAccountPage'
import PersonalDashboard from '@/pages/dashboard/PersonalDashboard'
import TeamDashboard from '@/pages/dashboard/TeamDashboard'
import MyReportsPage from '@/pages/reports/MyReportsPage'
import NewReportPage from '@/pages/reports/NewReportPage'
import ReportDetailPage from '@/pages/reports/ReportDetailPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import ProjectsPage from '@/pages/projects/ProjectsPage'
import UsersPage from '@/pages/admin/UsersPage'

function AppRoutes() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.token)

  useEffect(() => {
    if (token) dispatch(fetchMe())
  }, [token, dispatch])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/activate-account" element={<ActivateAccountPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<PersonalDashboard />} />
        <Route
          path="/dashboard/team"
          element={
            <ProtectedRoute roles={['MANAGER', 'ADMIN']}>
              <TeamDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/reports" element={<MyReportsPage />} />
        <Route path="/reports/new" element={<NewReportPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
