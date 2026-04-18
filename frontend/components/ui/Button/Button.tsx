"use client"

import type { JSX } from 'react'
import { cn } from '@/lib/utils'
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 disabled:bg-blue-300',
  secondary:
    'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400 disabled:bg-slate-100 disabled:text-slate-400',
  ghost:
    'bg-transparent text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-400 disabled:text-slate-400',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-300',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps): JSX.Element {
  const resolvedDisabled = disabled || isLoading

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        'disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]',
        variant === 'primary' && 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] hover:shadow-[0_0_25px_-5px_rgba(79,70,229,0.6)]',
        variant === 'secondary' && 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700',
        variant === 'ghost' && 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50',
        variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_20px_-5px_rgba(225,29,72,0.4)]',
        size === 'sm' && 'h-9 px-4 text-xs',
        size === 'md' && 'h-11 px-6 text-sm',
        size === 'lg' && 'h-14 px-8 text-base font-bold tracking-tight',
        className,
      )}
      disabled={resolvedDisabled}
      {...rest}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {rightIcon}
    </button>
  )
}
