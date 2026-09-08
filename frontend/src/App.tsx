import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchMe } from '@/store/slices/authSlice'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/shared/ProtectedRoute'

import { Toaster } from '@/components/ui/toast'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ActivateAccountPage from '@/pages/auth/ActivateAccountPage'
import PersonalDashboard from '@/pages/dashboard/PersonalDashboard'
import TeamDashboard from '@/pages/dashboard/TeamDashboard'
import TeamInsightsPage from '@/pages/dashboard/TeamInsightsPage'
import MyReportsPage from '@/pages/reports/MyReportsPage'
import NewReportPage from '@/pages/reports/NewReportPage'
import ReportEditPage from '@/pages/reports/ReportEditPage'
import ReportDetailPage from '@/pages/reports/ReportDetailPage'
import ManagerReviewPage from '@/pages/reports/ManagerReviewPage'
import MemberProfilePage from '@/pages/members/MemberProfilePage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import ProjectsPage from '@/pages/projects/ProjectsPage'
import UsersPage from '@/pages/admin/UsersPage'
import TeamsPage from '@/pages/admin/TeamsPage'
import AiChatWidget from '@/components/shared/AiChatWidget'

function AppRoutes() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.token)

  useEffect(() => {
    if (token) dispatch(fetchMe())
  }, [token, dispatch])

  return (
    <>
    <Routes>
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/activate-account" element={<ActivateAccountPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<PersonalDashboard />} />
        <Route
          path="/dashboard/team"
          element={
            <ProtectedRoute roles={['MANAGER', 'ADMIN']}>
              <TeamDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/team/insights"
          element={
            <ProtectedRoute roles={['MANAGER', 'ADMIN']}>
              <TeamInsightsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/reports" element={<MyReportsPage />} />
        <Route path="/reports/new" element={<NewReportPage />} />
        <Route path="/reports/:id/edit" element={<ReportEditPage />} />
        <Route
          path="/reports/:id/review"
          element={
            <ProtectedRoute roles={['MANAGER', 'ADMIN']}>
              <ManagerReviewPage />
            </ProtectedRoute>
          }
        />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route
          path="/members/:userId"
          element={
            <ProtectedRoute roles={['MANAGER', 'ADMIN']}>
              <MemberProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teams"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <TeamsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={token ? "/dashboard" : "/"} replace />} />
    </Routes>
    {token && <AiChatWidget />}
    </>
  )
}

export default function App() {
  return (
    <Toaster>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Toaster>
  )
}
