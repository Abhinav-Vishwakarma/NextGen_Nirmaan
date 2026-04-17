import type { AuthState } from '@/types/auth.types'

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
}

export const authSlice = {
  reducer: (): AuthState => initialState,
}
