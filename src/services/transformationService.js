import api from './api'
import { API_ENDPOINTS } from '@/config/api'

export const transformationService = {
  async getAll() {
    const response = await api.get(API_ENDPOINTS.transformations.base)
    return response.data
  },

  async getById(id) {
    const response = await api.get(API_ENDPOINTS.transformations.byId(id))
    return response.data
  },

  async create(transformationData) {
    const response = await api.post(API_ENDPOINTS.transformations.base, transformationData)
    return response.data
  },

  async update(id, transformationData) {
    const response = await api.put(API_ENDPOINTS.transformations.byId(id), transformationData)
    return response.data
  },

  async delete(id) {
    await api.delete(API_ENDPOINTS.transformations.byId(id))
  },

  async clone(id) {
    const response = await api.post(`${API_ENDPOINTS.transformations.byId(id)}/clone`)
    return response.data
  }
}