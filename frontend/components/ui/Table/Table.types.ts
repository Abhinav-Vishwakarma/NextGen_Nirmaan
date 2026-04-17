import type { ReactNode } from 'react'

export type TableColumn<TData> = {
  key: keyof TData
  header: string
  className?: string
  cell?: (row: TData) => ReactNode
}

export type TableProps<TData extends Record<string, unknown>> = {
  columns: TableColumn<TData>[]
  data: TData[]
  emptyStateText?: string
  className?: string
}
