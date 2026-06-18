const BASE = '/api/v1'

function getToken() { return localStorage.getItem('admin_token') }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...(options?.headers as any || {}) }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!(options?.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// Auth
export const login = (username: string, password: string) =>
  request<{ success: boolean; data: { token: string; expires_in: number } }>('/auth/login', {
    method: 'POST', body: JSON.stringify({ username, password }),
  })

// Tasks
export const getTasks = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request<{ success: boolean; data: { items: any[]; pagination: { page: number; page_size: number; total: number } } }>(`/tasks${qs}`)
}

export const getTaskDetail = (id: number) =>
  request<{ success: boolean; data: any }>(`/tasks/${id}`)

// Statistics
export const getStatsOverview = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request(`/statistics/overview${qs}`)
}
export const getStatsDaily = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request(`/statistics/daily${qs}`)
}
export const getStatsByProject = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request(`/statistics/by-project${qs}`)
}
export const getStatsByProvider = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request(`/statistics/by-provider${qs}`)
}
export const getStatsByUser = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request(`/statistics/by-user${qs}`)
}
export const getStatsErrorRate = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request(`/statistics/error-rate${qs}`)
}
export const getStatsReports = (params?: Record<string, string>) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return request(`/statistics/reports${qs}`)
}

// Pricing
export const getPricing = () => request<{ success: boolean; data: any[] }>('/pricing')
export const createPricing = (data: any) => request('/pricing', { method: 'POST', body: JSON.stringify(data) })
export const updatePricing = (id: number, data: any) => request(`/pricing/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deletePricing = (id: number) => request(`/pricing/${id}`, { method: 'DELETE' })

// Settings
export const getSettings = () => request<{ success: boolean; data: any[] }>('/settings')
export const updateSetting = (key: string, value: string) => request(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ setting_value: value }) })

// Users
export const getUsers = () => request<{ success: boolean; data: any[] }>('/users')
export const createUser = (data: { username: string; password: string; role?: string }) =>
  request('/users', { method: 'POST', body: JSON.stringify(data) })
export const resetPassword = (userId: number, password: string) =>
  request(`/users/${userId}/password`, { method: 'PUT', body: JSON.stringify({ password }) })
export const deleteUser = (userId: number) => request(`/users/${userId}`, { method: 'DELETE' })
export const getUserSummary = (userId: number) => request(`/users/${userId}/summary`)
export const getUserTasks = (userId: number, page?: number) =>
  request(`/users/${userId}/tasks?page=${page || 1}`)
export const getUserReports = (userId: number) => request(`/users/${userId}/reports`)
