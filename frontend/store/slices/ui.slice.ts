export type UiState = {
  isSidebarOpen: boolean
}

const initialState: UiState = {
  isSidebarOpen: false,
}

export const uiSlice = {
  reducer: (): UiState => initialState,
}
