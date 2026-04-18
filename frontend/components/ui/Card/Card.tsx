import type { JSX } from 'react'
import { cn } from '@/lib/utils'
import type { CardProps } from './Card.types'

export function Card({
  title,
  description,
  footer,
  className,
  children,
  ...rest
}: CardProps): JSX.Element {
  return (
    <section
      className={cn(
        'rounded-2xl border border-slate-800/80 bg-[#111827]/70 p-5 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.9)] backdrop-blur-sm',
        className,
      )}
      {...rest}
    >
      {(title || description) && (
        <header className="mb-4">
          {title && <h3 className="text-base font-semibold text-slate-100">{title}</h3>}
          {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
        </header>
      )}
      <div>{children}</div>
      {footer && <footer className="mt-4 border-t border-slate-800/80 pt-3">{footer}</footer>}
    </section>
  )
}
