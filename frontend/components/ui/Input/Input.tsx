import type { JSX } from 'react'
import { cn } from '@/lib/utils'
import type { InputProps } from './Input.types'

export function Input({ label, error, className, id, ...rest }: InputProps): JSX.Element {
  const inputId = id ?? rest.name

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 h-11 text-sm text-slate-100 outline-none transition-all duration-300',
          'placeholder:text-slate-600',
          'focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 focus:bg-slate-900',
          error && 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10',
          className,
        )}
        {...rest}
      />
      {error && <p className="mt-1.5 text-[10px] text-rose-400 font-bold uppercase tracking-wider ml-1">{error}</p>}
    </div>
  )
}
