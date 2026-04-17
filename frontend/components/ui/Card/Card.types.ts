import type { HTMLAttributes, ReactNode } from 'react'

export type CardProps = {
  title?: string
  description?: string
  footer?: ReactNode
  className?: string
  children: ReactNode
} & HTMLAttributes<HTMLDivElement>
