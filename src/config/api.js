export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
}

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout'
  },
  tenants: {
    base: '/tenants',
    byId: (id) => `/tenants/${id}`
  },
  users: {
    base: '/users',
    byId: (id) => `/users/${id}`,
    toggleStatus: (id) => `/users/${id}/toggle-status`
  },
  transformations: {
    base: '/transformations',
    byId: (id) => `/transformations/${id}`
  },
  pipelines: {
    base: '/pipelines',
    byId: (id) => `/pipelines/${id}`,
    executions: '/executions',
    executionById: (id) => `/executions/${id}`
  },
  connectors: {
    base: '/connectors',
    byId: (id) => `/connectors/${id}`
  }
}