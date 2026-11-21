import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('admin_token')
  if (t) cfg.headers.Authorization = `Token ${t}`
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const isLogin = err.config?.url?.includes('/login')
    if (err.response?.status === 401 && !isLogin) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_username')
      window.location.href = '/login/suser'
    }
    return Promise.reject(err)
  }
)

export default api