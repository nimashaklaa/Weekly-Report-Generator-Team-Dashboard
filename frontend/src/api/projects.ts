import type { Category, Page, Project } from '@/types'
import api from './axios'

export const projectsApi = {
  getAll: (params?: { activeOnly?: boolean; page?: number }) =>
    api.get<Page<Project>>('/projects', { params }).then((r) => r.data),

  getActive: () =>
    api.get<Project[]>('/projects/active').then((r) => r.data),

  getById: (id: number) =>
    api.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string; colorHex?: string }) =>
    api.post<Project>('/projects', data).then((r) => r.data),

  update: (id: number, data: { name?: string; description?: string; colorHex?: string }) =>
    api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),

  deactivate: (id: number) =>
    api.delete(`/projects/${id}`),
}

export const categoriesApi = {
  getAll: (params?: { activeOnly?: boolean; page?: number }) =>
    api.get<Page<Category>>('/categories', { params }).then((r) => r.data),

  getActive: () =>
    api.get<Category[]>('/categories/active').then((r) => r.data),

  create: (data: { name: string; description?: string; colorHex?: string }) =>
    api.post<Category>('/categories', data).then((r) => r.data),

  update: (id: number, data: { name?: string; description?: string; colorHex?: string }) =>
    api.patch<Category>(`/categories/${id}`, data).then((r) => r.data),

  deactivate: (id: number) =>
    api.delete(`/categories/${id}`),
}
