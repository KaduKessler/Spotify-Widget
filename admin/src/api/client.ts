// Leve wrapper de fetch sem alterar comportamento
type HttpError = Error & { status?: number }
export function get(url: string, init?: RequestInit) {
  return fetch(url, { ...init, method: 'GET' })
}

export function post(url: string, body?: unknown, init?: RequestInit) {
  return fetch(url, {
    ...init,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export function del(url: string, init?: RequestInit) {
  return fetch(url, { ...init, method: 'DELETE' })
}

export async function requestJson<T = unknown>(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init })
  if (!res.ok) {
    let text = ''
    try {
      text = await res.text()
    } catch { }
    const err: HttpError = new Error(text || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return (await res.json()) as T
}

export async function postJson<T = unknown>(url: string, body?: unknown, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let text = ''
    try {
      text = await res.text()
    } catch { }
    const err: HttpError = new Error(text || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return (await res.json()) as T
}

export async function putJson<T = unknown>(url: string, body?: unknown, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let text = ''
    try {
      text = await res.text()
    } catch { }
    const err: HttpError = new Error(text || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return (await res.json()) as T
}
