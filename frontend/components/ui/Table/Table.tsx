import type { JSX } from 'react'
import { cn } from '@/lib/utils'
import type { TableProps } from './Table.types'

export function Table<TData extends Record<string, unknown>>({
  columns,
  data,
  emptyStateText = 'No data available.',
  className,
}: TableProps<TData>): JSX.Element {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#111827]/70', className)}>
      <table className="min-w-full divide-y divide-slate-800/80">
        <thead className="bg-slate-900/60">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400',
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index} className="hover:bg-slate-900/50">
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={cn('px-4 py-3 text-sm text-slate-200', column.className)}
                  >
                    {column.cell ? column.cell(row) : String(row[column.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={columns.length}>
                {emptyStateText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
