import type { InputHTMLAttributes } from 'react'

export type InputProps = {
  label?: string
  error?: string
  className?: string
} & InputHTMLAttributes<HTMLInputElement>
