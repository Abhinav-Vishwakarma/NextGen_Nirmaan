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
          'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none',
          'placeholder:text-slate-400',
          'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30',
          error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30',
          className,
        )}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
