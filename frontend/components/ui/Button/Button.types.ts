import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>
