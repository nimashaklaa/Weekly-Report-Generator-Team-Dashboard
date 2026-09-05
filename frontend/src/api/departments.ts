import api from './axios'

export interface Department {
  id: number
  name: string
  description?: string
  active: boolean
}

export interface JobTitle {
  id: number
  title: string
  level: string
  active: boolean
  department?: { id: number; name: string }
}

export const departmentsApi = {
  getAll: () => api.get<Department[]>('/departments').then((r) => r.data),
  getJobTitles: () => api.get<JobTitle[]>('/departments/job-titles').then((r) => r.data),
}
