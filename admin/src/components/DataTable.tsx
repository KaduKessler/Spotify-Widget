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
    <>
      {loading && (
        <div className="text-center py-8">
          <div className="text-neutral-400">Carregando...</div>
        </div>
      )}

      {!loading && data.length === 0 && (
        <div className="text-center py-8 text-neutral-400">{emptyMessage}</div>
      )}

      {!loading && data.length > 0 && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-800/50">
                {columns.map(column => (
                  <th
                    key={String(column.key)}
                    className={`px-4 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wider ${column.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {data.map(row => (
                <tr key={String(row[rowKey])} className="hover:bg-neutral-800/30 transition-colors">
                  {columns.map(column => (
                    <td
                      key={String(column.key)}
                      className={`px-4 py-3 text-sm ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
