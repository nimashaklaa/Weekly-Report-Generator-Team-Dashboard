import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status: number = error.response?.status ?? 0
    const url: string = error.config?.url ?? ''
    // Any auth failure on non-login endpoints → force logout
    if ((status === 401 || status === 403) && !url.includes('/auth/login') && !url.includes('/auth/authenticate')) {
      localStorage.removeItem('token')
      window.location.replace('/login')
    }
    return Promise.reject(error)
  }
)

export default api
