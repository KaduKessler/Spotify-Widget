import type { ReactNode } from 'react'

export interface DataTableColumn<T> {
  key: keyof T
  label: string
  render?: (value: T[keyof T], row: T) => ReactNode
  align?: 'left' | 'right'
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  rowKey: keyof T
}

// Larguras variadas pra barra skeleton não parecer uma grade uniforme
const SKELETON_BAR_WIDTHS = ['w-20', 'w-28', 'w-16', 'w-24', 'w-32']
const SKELETON_ROWS = 5

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  rowKey,
}: DataTableProps<T>) {
  return (
    <div
      className="fade-in-up overflow-hidden rounded-3xl border border-white/8 bg-neutral-900/70 shadow-[0_20px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      style={{ animationDelay: '60ms', animationFillMode: 'backwards' }}
    >
      {!loading && data.length === 0 && (
        <div className="py-10 text-center text-sm text-neutral-400">
          {emptyMessage}
        </div>
      )}

      {(loading || data.length > 0) && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8 bg-white/5">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-4 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400 ${
                      column.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {loading
                ? Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: lista estatica de placeholders, sem reordenacao
                    <tr key={`skeleton-${rowIndex}`}>
                      {columns.map((column, colIndex) => (
                        <td
                          key={String(column.key)}
                          className={`px-4 py-3 ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                        >
                          <div
                            className={`h-3.5 animate-pulse rounded bg-white/8 ${
                              SKELETON_BAR_WIDTHS[
                                (rowIndex + colIndex) %
                                  SKELETON_BAR_WIDTHS.length
                              ]
                            } ${column.align === 'right' ? 'ml-auto' : ''}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                : data.map((row) => (
                    <tr
                      key={String(row[rowKey])}
                      className="transition-colors duration-150 hover:bg-white/5"
                    >
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className={`px-4 py-3 text-sm ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                        >
                          {column.render
                            ? column.render(row[column.key], row)
                            : String(row[column.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
