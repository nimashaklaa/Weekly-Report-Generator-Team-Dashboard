import type { Page, User } from '@/types'
import api from './axios'

export const usersApi = {
  getAll: (params?: { role?: string; departmentId?: number; page?: number; size?: number }) =>
    api.get<Page<User>>('/users', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  update: (id: number, data: { firstName?: string; lastName?: string; avatarUrl?: string; departmentId?: number; jobTitleId?: number }) =>
    api.put<User>(`/users/${id}`, data).then((r) => r.data),

  assignRoles: (id: number, roles: string[]) =>
    api.patch<User>(`/users/${id}/roles`, { roles }).then((r) => r.data),

  lock: (id: number) =>
    api.patch(`/users/${id}/lock`),

  unlock: (id: number) =>
    api.patch(`/users/${id}/unlock`),
}
