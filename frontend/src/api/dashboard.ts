import type { ActivityItem, DashboardSummary, TeamReportStats, TeamTaskStats, UserStats } from '@/types'
import api from './axios'

export const dashboardApi = {
  getSummary: () =>
    api.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),

  getTeamStats: (teamId: number, weekYear?: number, weekNumber?: number) =>
    api.get<TeamReportStats>(`/dashboard/teams/${teamId}/reports`, {
      params: { weekYear, weekNumber },
    }).then((r) => r.data),

  getTeamTaskStats: (teamId: number) =>
    api.get<TeamTaskStats>(`/dashboard/teams/${teamId}/task-stats`).then((r) => r.data),

  getTeamActivity: (teamId: number) =>
    api.get<ActivityItem[]>(`/dashboard/teams/${teamId}/activity`).then((r) => r.data),

  getUserStats: (userId: number) =>
    api.get<UserStats>(`/dashboard/users/${userId}/stats`).then((r) => r.data),
}
