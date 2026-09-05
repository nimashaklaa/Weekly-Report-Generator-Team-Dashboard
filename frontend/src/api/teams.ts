import type { Page, Team } from '@/types'
import api from './axios'

export const teamsApi = {
  getAll: (params?: { activeOnly?: boolean; page?: number; size?: number }) =>
    api.get<Page<Team>>('/teams', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<Team>(`/teams/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string; managerId: number; memberIds?: number[] }) =>
    api.post<Team>('/teams', data).then((r) => r.data),

  update: (id: number, data: { name?: string; description?: string; managerId?: number }) =>
    api.put<Team>(`/teams/${id}`, data).then((r) => r.data),

  updateMembers: (id: number, memberIds: number[]) =>
    api.patch<Team>(`/teams/${id}/members`, { memberIds }).then((r) => r.data),

  deactivate: (id: number) =>
    api.delete(`/teams/${id}`),
}
