export type LogtoTokenPayload = {
  sub: string
  email: string
  name: string
  username: string
  roles: string[]
  exp: number
}

export type AuthState = {
  token: string | null
  user: LogtoTokenPayload | null
  isAuthenticated: boolean
}
