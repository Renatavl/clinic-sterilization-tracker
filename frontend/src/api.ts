export type ApiErrorBody = {
  statusCode?: number
  code?: string
  message?: string | string[]
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(status: number, body: ApiErrorBody) {
    const message = Array.isArray(body.message)
      ? body.message.join(' ')
      : body.message || 'Something went wrong.'
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
  }
}

const API_URL = import.meta.env.VITE_API_URL || '/api'

export async function api<T>(
  path: string,
  token?: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (!response.ok) {
    let body: ApiErrorBody = {}
    try {
      body = (await response.json()) as ApiErrorBody
    } catch {
      body.message = response.statusText
    }
    throw new ApiError(response.status, body)
  }

  if (response.status === 204) return undefined as T
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return response.json() as Promise<T>
  return response.text() as Promise<T>
}

export function queryString(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  const result = params.toString()
  return result ? `?${result}` : ''
}