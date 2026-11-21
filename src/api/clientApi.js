import axios from 'axios'

const clientApi = axios.create({ baseURL: import.meta.env.VITE_API_URL })

clientApi.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('client_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

clientApi.interceptors.response.use(
  (r) => r,
  (err) => {
    const isLogin = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && !isLogin) {
      localStorage.removeItem('client_token')
      localStorage.removeItem('client_user')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default clientApi