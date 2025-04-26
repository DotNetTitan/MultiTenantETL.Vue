import api from './api'
import { API_ENDPOINTS } from '@/config/api'

export const pipelineService = {
  async getAll() {
    const response = await api.get(API_ENDPOINTS.pipelines.base)
    return response.data
  },

  async getById(id) {
    const response = await api.get(API_ENDPOINTS.pipelines.byId(id))
    return response.data
  },

  async create(pipelineData) {
    const response = await api.post(API_ENDPOINTS.pipelines.base, pipelineData)
    return response.data
  },

  async update(id, pipelineData) {
    const response = await api.put(API_ENDPOINTS.pipelines.byId(id), pipelineData)
    return response.data
  },

  async delete(id) {
    await api.delete(API_ENDPOINTS.pipelines.byId(id))
  },

  async execute(id) {
    const response = await api.post(`${API_ENDPOINTS.pipelines.byId(id)}/execute`)
    return response.data
  },

  async getExecutions(filters = {}) {
    const response = await api.get(API_ENDPOINTS.pipelines.executions, { params: filters })
    return response.data
  },

  async getExecutionById(id) {
    const response = await api.get(API_ENDPOINTS.pipelines.executionById(id))
    return response.data
  }
}