import type { Page, ReportComment, ReportVersion, WeeklyReport, WeeklyReportSummary } from '@/types'
import api from './axios'

export interface ReportFilters {
  weekYear?: number
  weekNumber?: number
  status?: string
  authorId?: number
  teamId?: number
  page?: number
  size?: number
}

export interface CreateReportPayload {
  teamId: number
  weekYear: number
  weekNumber: number
}

export interface UpdateReportPayload {
  teamId: number
  weekYear: number
  weekNumber: number
  weekSummary?: string
  overallMood?: string
  blockers?: string
  nextWeekPlan?: string
  generalNotes?: string
  tasks?: Array<{
    title: string
    description?: string
    status: string
    priority?: string
    hoursSpent: number
    projectId?: number
    categoryId?: number
    sortOrder?: number
  }>
  hoursBreakdown?: {
    meetingHours?: number
    deepWorkHours?: number
    adminHours?: number
    reviewHours?: number
    otherHours?: number
  }
}

export const reportsApi = {
  getMyReports: () =>
    api.get<WeeklyReportSummary[]>('/reports/my').then((r) => r.data),

  getAll: (filters: ReportFilters = {}) =>
    api.get<Page<WeeklyReportSummary>>('/reports', { params: filters }).then((r) => r.data),

  getById: (id: number) =>
    api.get<WeeklyReport>(`/reports/${id}`).then((r) => r.data),

  create: (payload: CreateReportPayload) =>
    api.post<WeeklyReport>('/reports', payload).then((r) => r.data),

  update: (id: number, payload: UpdateReportPayload) =>
    api.put<WeeklyReport>(`/reports/${id}`, payload).then((r) => r.data),

  patch: (id: number, payload: Partial<UpdateReportPayload>) =>
    api.patch<WeeklyReport>(`/reports/${id}`, payload).then((r) => r.data),

  submit: (id: number) =>
    api.post<WeeklyReport>(`/reports/${id}/submit`).then((r) => r.data),

  approve: (id: number) =>
    api.post<WeeklyReport>(`/reports/${id}/approve`).then((r) => r.data),

  requestCorrection: (id: number, comment: string) =>
    api.post<WeeklyReport>(`/reports/${id}/request-correction`, { body: comment }).then((r) => r.data),

  getVersions: (id: number) =>
    api.get<ReportVersion[]>(`/reports/${id}/versions`).then((r) => r.data),

  getComments: (id: number) =>
    api.get<ReportComment[]>(`/reports/${id}/comments`).then((r) => r.data),

  addComment: (id: number, body: string) =>
    api.post<ReportComment>(`/reports/${id}/comments`, { body }).then((r) => r.data),
}
