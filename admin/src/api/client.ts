// Leve wrapper de fetch sem alterar comportamento
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

export async function requestJson<T = any>(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init })
  if (!res.ok) {
    let text = ''
    try {
      text = await res.text()
    } catch { }
    const err = new Error(text || `HTTP ${res.status}`)
      ; (err as any).status = res.status
    throw err
  }
  return (await res.json()) as T
}

export async function postJson<T = any>(url: string, body?: unknown, init?: RequestInit) {
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
    const err = new Error(text || `HTTP ${res.status}`)
      ; (err as any).status = res.status
    throw err
  }
  return (await res.json()) as T
}

export async function putJson<T = any>(url: string, body?: unknown, init?: RequestInit) {
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
    const err = new Error(text || `HTTP ${res.status}`)
      ; (err as any).status = res.status
    throw err
  }
  return (await res.json()) as T
}
