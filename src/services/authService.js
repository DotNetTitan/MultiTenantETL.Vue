import api from './api'
import { API_ENDPOINTS } from '@/config/api'

export const authService = {
  async login(credentials) {
    const response = await api.post(API_ENDPOINTS.auth.login, credentials)
    return response.data
  },

  async logout() {
    await api.post(API_ENDPOINTS.auth.logout)
  }
}