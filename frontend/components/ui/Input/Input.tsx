import type { JSX } from 'react'
import { cn } from '@/lib/utils'
import type { InputProps } from './Input.types'

export function Input({ label, error, className, id, ...rest }: InputProps): JSX.Element {
  const inputId = id ?? rest.name

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-200',
          className,
        )}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
