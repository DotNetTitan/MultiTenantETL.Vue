import api from './api'
import { API_ENDPOINTS } from '@/config/api'

export const userService = {
  async getAll() {
    const response = await api.get(API_ENDPOINTS.users.base)
    return response.data
  },

  async getById(id) {
    const response = await api.get(API_ENDPOINTS.users.byId(id))
    return response.data
  },

  async create(userData) {
    const response = await api.post(API_ENDPOINTS.users.base, userData)
    return response.data
  },

  async update(id, userData) {
    const response = await api.put(API_ENDPOINTS.users.byId(id), userData)
    return response.data
  },

  async delete(id) {
    await api.delete(API_ENDPOINTS.users.byId(id))
  },

  async toggleStatus(id) {
    const response = await api.post(API_ENDPOINTS.users.toggleStatus(id))
    return response.data
  }
}