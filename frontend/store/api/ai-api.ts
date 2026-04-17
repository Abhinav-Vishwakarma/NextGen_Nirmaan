export const aiApi = {
  reducerPath: 'aiApi',
  reducer: () => ({}),
  middleware: () => (next: (action: unknown) => unknown) => (action: unknown) => next(action),
}
