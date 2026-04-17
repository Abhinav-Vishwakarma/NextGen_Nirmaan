import type { AppDispatch, RootState } from './index'

export const useAppDispatch = (): AppDispatch => {
  throw new Error('useAppDispatch is not configured. Wire react-redux Provider first.')
}

export const useAppSelector = <TSelected>(
  selector: (state: RootState) => TSelected,
): TSelected => {
  const state = { ui: {}, auth: {} } as RootState
  return selector(state)
}
