export const mainApi = {
  reducerPath: 'mainApi',
  reducer: () => ({}),
  middleware: () => (next: (action: unknown) => unknown) => (action: unknown) => next(action),
}
