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
      {loading && (
        <div className="py-10 text-center text-sm text-neutral-400">
          Carregando...
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="py-10 text-center text-sm text-neutral-400">
          {emptyMessage}
        </div>
      )}

      {!loading && data.length > 0 && (
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
              {data.map((row) => (
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
