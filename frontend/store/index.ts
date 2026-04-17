export type AppStore = {
  ui: Record<string, unknown>
  auth: Record<string, unknown>
}

export const store = {
  getState: (): AppStore => ({ ui: {}, auth: {} }),
  dispatch: (): void => {
    // Placeholder until Redux Toolkit store is wired.
  },
}

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
