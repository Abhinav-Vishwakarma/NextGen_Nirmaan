const API_BASE = process.env.NEXT_PUBLIC_MAIN_API_URL || 'http://localhost:4000'

export const api = {
  get: async (endpoint: string) => {
    const res = await fetch(`${API_BASE}${endpoint}`)
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  post: async (endpoint: string, body: any) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  postFormData: async (endpoint: string, formData: FormData) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      body: formData
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  patch: async (endpoint: string, body: any) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}
