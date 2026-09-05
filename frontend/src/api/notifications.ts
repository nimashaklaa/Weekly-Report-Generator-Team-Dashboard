import type { Notification, Page } from '@/types'
import api from './axios'

export const notificationsApi = {
  getAll: (params?: { page?: number; size?: number }) =>
    api.get<Page<Notification>>('/notifications', { params }).then((r) => r.data),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data.count),

  markAsRead: (id: number) =>
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch('/notifications/read-all'),
}
