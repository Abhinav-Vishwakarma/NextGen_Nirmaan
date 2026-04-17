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
      className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}
      {...rest}
    >
      {(title || description) && (
        <header className="mb-4">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
        </header>
      )}
      <div>{children}</div>
      {footer && <footer className="mt-4 border-t border-slate-100 pt-3">{footer}</footer>}
    </section>
  )
}
