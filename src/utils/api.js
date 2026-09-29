import axios from 'axios'

// Host URL comes from the env files — no logic needed here.
//   .env            -> local
//   .env.production -> production
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Send the saved login token with every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Token rejected -> log the user out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

export default api
