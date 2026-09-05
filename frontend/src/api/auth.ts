import type { AuthResponse, User } from '@/types'
import api from './axios'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  register: (data: { firstName: string; lastName: string; email: string; password: string; departmentId?: number; jobTitleId?: number }) =>
    api.post('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<User>('/auth/me').then((r) => r.data),

  activateAccount: (token: string) =>
    api.get('/auth/activate-account', { params: { token } }),
}
