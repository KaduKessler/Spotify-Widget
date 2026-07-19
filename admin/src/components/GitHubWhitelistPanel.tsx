import { Plus, Search, Trash2, Upload } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { del, postJson, requestJson } from '../api/client'
import Button from './Button'
import type { DataTableColumn } from './DataTable'
import DataTable from './DataTable'

type WhitelistEntry = {
  id: number
  username: string
  addedBy: string | null
  note: string | null
  createdAt: string
  removedBy: string | null
  removedAt: string | null
}

export default function GitHubWhitelistPanel() {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Add single modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newNote, setNewNote] = useState('')
  const [validateGithub, setValidateGithub] = useState(true)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)

  // Batch import modal
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchUsernames, setBatchUsernames] = useState('')
  const [batchValidateGithub, setBatchValidateGithub] = useState(false)
  const [batchImporting, setBatchImporting] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)
  const [batchResult, setBatchResult] = useState<{
    added: string[]
    errors: Array<{ username: string; error: string; message: string }>
    skipped: string[]
  } | null>(null)

  // Info toggle
  const [showInfo, setShowInfo] = useState(false)

  const fetchWhitelist = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await requestJson<{ whitelist: WhitelistEntry[] }>(
        '/api/admin/whitelist',
      )
      setWhitelist(data.whitelist)
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar whitelist.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWhitelist()
  }, [fetchWhitelist])

  const handleAddToWhitelist = async () => {
    if (!newUsername.trim()) {
      setAddError('Digite um usuário.')
      return
    }

    setAdding(true)
    setAddError(null)
    setAddSuccess(null)

    try {
      await postJson('/api/admin/whitelist', {
        username: newUsername.trim(),
        note: newNote.trim() || undefined,
        validateGithub,
      })

      setAddSuccess('Usuário adicionado com sucesso!')
      setNewUsername('')
      setNewNote('')
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setShowAddModal(false)
      setAddSuccess(null)
      fetchWhitelist()
    } catch (err) {
      console.error(err)
      const errorMsg =
        err &&
        typeof err === 'object' &&
        'status' in err &&
        (err as { status?: number }).status === 409
          ? 'Usuário já existe na whitelist'
          : err instanceof Error
            ? err.message
            : 'Erro ao adicionar à whitelist.'
      setAddError(errorMsg)
    } finally {
      setAdding(false)
    }
  }

  const handleBatchImport = async () => {
    const list = batchUsernames
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0)

    if (list.length === 0) {
      setBatchError('Digite pelo menos um usuário.')
      return
    }

    setBatchImporting(true)
    setBatchError(null)
    setBatchResult(null)

    try {
      const data = await postJson<{
        added: number
        errors: number
        results: {
          added: string[]
          errors: Array<{ username: string; error: string; message: string }>
        }
      }>('/api/admin/whitelist/batch', {
        usernames: list,
        validateGithub: batchValidateGithub,
        skipErrors: true,
      })

      // Separar erros reais dos que já existem
      const realErrors = data.results.errors.filter(
        (e) => e.error !== 'already_exists',
      )
      const alreadyExists = data.results.errors
        .filter((e) => e.error === 'already_exists')
        .map((e) => e.username)

      setBatchResult({
        added: data.results.added,
        errors: realErrors,
        skipped: alreadyExists,
      })

      // Remove os que deram certo E os que já existem, deixa apenas os erros reais
      if (realErrors.length > 0) {
        const failedUsernames = realErrors.map((e) => e.username).join('\n')
        setBatchUsernames(failedUsernames)
      } else {
        // Se não houve erros reais, limpa tudo e fecha
        setBatchUsernames('')
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setShowBatchModal(false)
        setBatchResult(null)
      }

      fetchWhitelist()
    } catch (err) {
      console.error(err)
      setBatchError('Erro ao fazer import em lote.')
    } finally {
      setBatchImporting(false)
    }
  }

  const handleRemoveFromWhitelist = async (username: string) => {
    if (!confirm(`Remover ${username} da whitelist?`)) return

    try {
      await del(`/api/admin/whitelist/${encodeURIComponent(username)}`)
      fetchWhitelist()
    } catch (err) {
      console.error(err)
      alert('Erro ao remover da whitelist.')
    }
  }

  // Filtrar whitelist por busca
  const filteredWhitelist = whitelist.filter((entry) =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const columns: DataTableColumn<WhitelistEntry>[] = [
    {
      key: 'username',
      label: 'Usuário',
      render: (_, row) => (
        <a
          href={`https://github.com/${row.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 font-medium"
        >
          @{row.username}
        </a>
      ),
    },
    {
      key: 'addedBy',
      label: 'Adicionado por',
      render: (value) =>
        value ? (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-300">
            {value}
          </span>
        ) : (
          <span className="text-neutral-400 text-sm">Sistema</span>
        ),
    },
    {
      key: 'note',
      label: 'Nota',
      render: (value) => (
        <span className="text-neutral-400 max-w-xs truncate">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Data',
      render: (value) =>
        new Date(value as string).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
    },
    {
      key: 'id',
      label: 'Ação',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={16} />}
          onClick={() => handleRemoveFromWhitelist(row.username)}
        >
          Remover
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">GitHub Whitelist</h2>
          <p className="text-sm text-neutral-400 mt-1">
            {whitelist.length} usuário{whitelist.length !== 1 ? 's' : ''}{' '}
            autorizado{whitelist.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Upload size={16} />}
            onClick={() => {
              setShowBatchModal(true)
              setBatchError(null)
              setBatchResult(null)
            }}
          >
            Import em Lote
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={() => {
              setShowAddModal(true)
              setAddError(null)
              setAddSuccess(null)
            }}
          >
            Adicionar
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Buscar usuário..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-800 bg-neutral-900/50 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* Info Accordion */}
      <div className="rounded-2xl border border-white/8 bg-neutral-900/70 backdrop-blur-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="w-full flex items-center justify-between gap-3 px-6 py-4 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3 text-left">
            <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-neutral-400">
              i
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                Informações
              </p>
              <p className="text-sm font-semibold text-white">
                Como funciona a whitelist
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${showInfo ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>Expandir informações</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>

        {showInfo && (
          <div className="border-t border-white/10 px-6 py-4 space-y-3 bg-white/2">
            <ul className="space-y-2 text-sm text-neutral-300">
              <li className="flex gap-3">
                <span className="text-emerald-400 shrink-0 font-bold">•</span>
                <span>
                  Usuários nesta whitelist podem criar conta via GitHub OAuth
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-400 shrink-0 font-bold">•</span>
                <span>
                  Whitelist do banco <strong>complementa</strong> a do{' '}
                  <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-xs font-mono">
                    .env
                  </code>{' '}
                  (não substitui)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-400 shrink-0 font-bold">•</span>
                <span>
                  Se um user está no{' '}
                  <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-xs font-mono">
                    .env
                  </code>
                  , é automaticamente adicionado ao banco na primeira tentativa
                  de login
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-400 shrink-0 font-bold">•</span>
                <span>
                  Campo <strong>"Adicionado por"</strong> NULL = importado do{' '}
                  <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-xs font-mono">
                    .env
                  </code>{' '}
                  ou política open
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-400 shrink-0 font-bold">•</span>
                <span>
                  Validação GitHub: opção <strong>opcional</strong> para
                  verificar se username existe no GitHub
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center text-neutral-400">Carregando...</div>
      )}

      {/* Whitelist Table */}
      <DataTable
        columns={columns}
        data={filteredWhitelist}
        loading={loading}
        emptyMessage={
          searchQuery
            ? `Nenhum resultado para "${searchQuery}"`
            : 'Nenhum usuário na whitelist ainda'
        }
        rowKey="id"
      />

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 max-w-md w-full space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white">
                Adicionar à Whitelist
              </h3>
              <p className="text-sm text-neutral-400 mt-1">
                Adicione um novo username GitHub
              </p>
            </div>

            {addError && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm">
                {addError}
              </div>
            )}

            {addSuccess && (
              <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-500/50 text-emerald-300 text-sm">
                {addSuccess}
              </div>
            )}

            <div>
              <label
                htmlFor="add-username"
                className="text-sm font-medium text-neutral-300 block mb-2"
              >
                Usuário do GitHub
              </label>
              <input
                id="add-username"
                type="text"
                placeholder="jdoe"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                disabled={adding}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
              />
              <p className="text-xs text-neutral-400 mt-1">
                1-39 caracteres, sem espaços
              </p>
            </div>

            <div>
              <label
                htmlFor="add-note"
                className="text-sm font-medium text-neutral-300 block mb-2"
              >
                Nota (opcional)
              </label>
              <input
                id="add-note"
                type="text"
                placeholder="Motivo da adição..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                disabled={adding}
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 disabled:opacity-50"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={validateGithub}
                onChange={(e) => setValidateGithub(e.target.checked)}
                disabled={adding}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span>Validar usuário no GitHub antes de adicionar</span>
            </label>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowAddModal(false)
                  setAddError(null)
                  setAddSuccess(null)
                  setNewUsername('')
                  setNewNote('')
                }}
                disabled={adding}
              >
                Cancelar
              </Button>
              <Button
                variant={newUsername.trim() ? 'success' : 'primary'}
                fullWidth
                onClick={handleAddToWhitelist}
                loading={adding}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 max-w-lg w-full space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white">Import em Lote</h3>
              <p className="text-sm text-neutral-400 mt-1">
                Cole múltiplos usuários, um por linha
              </p>
            </div>

            {batchError && (
              <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm">
                {batchError}
              </div>
            )}

            {batchResult && (
              <div className="space-y-3">
                {/* Success Summary */}
                {batchResult.added.length > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-500/50 text-emerald-300 text-sm">
                    <p className="font-semibold mb-2">
                      Adicionados com sucesso ({batchResult.added.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {batchResult.added.map((username) => (
                        <span
                          key={username}
                          className="px-2 py-0.5 rounded bg-emerald-500/20 text-xs"
                        >
                          @{username}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skipped (already exists) */}
                {batchResult.skipped.length > 0 && (
                  <div className="p-3 rounded-lg bg-yellow-900/30 border border-yellow-500/50 text-yellow-300 text-sm">
                    <p className="font-semibold mb-2">
                      Já existem na whitelist ({batchResult.skipped.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {batchResult.skipped.map((username) => (
                        <span
                          key={username}
                          className="px-2 py-0.5 rounded bg-yellow-500/20 text-xs"
                        >
                          @{username}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors Detail */}
                {batchResult.errors.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-sm space-y-2">
                    <p className="font-semibold">
                      Erros ({batchResult.errors.length}):
                    </p>
                    <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                      {batchResult.errors.map((err) => (
                        <li
                          key={`${err.username}-${err.error}`}
                          className="flex items-start gap-2"
                        >
                          <span className="font-mono text-xs">
                            @{err.username}:
                          </span>
                          <span className="text-xs">{err.message}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-neutral-400 italic border-t border-red-500/30 pt-2 mt-2">
                      Os usernames com erro foram mantidos no campo acima.
                      Corrija e tente novamente.
                    </p>
                  </div>
                )}
              </div>
            )}

            <textarea
              id="batch-usernames"
              placeholder="jdoe&#10;jane-smith&#10;john_doe"
              value={batchUsernames}
              onChange={(e) => setBatchUsernames(e.target.value)}
              disabled={batchImporting}
              rows={8}
              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 font-mono text-sm"
            />

            <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={batchValidateGithub}
                onChange={(e) => setBatchValidateGithub(e.target.checked)}
                disabled={batchImporting}
                className="w-4 h-4 rounded cursor-pointer disabled:cursor-not-allowed"
              />
              <span>
                Validar cada usuário no GitHub (mais lento, mas seguro)
              </span>
            </label>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowBatchModal(false)
                  setBatchError(null)
                  setBatchResult(null)
                  setBatchUsernames('')
                }}
                disabled={batchImporting}
              >
                {batchResult && batchResult.errors.length === 0
                  ? 'Fechar'
                  : 'Cancelar'}
              </Button>
              {(!batchResult ||
                (batchResult && batchResult.errors.length > 0)) && (
                <Button
                  variant={batchUsernames.trim() ? 'success' : 'secondary'}
                  fullWidth
                  onClick={() => {
                    // Se há resultado com erros, limpa o resultado para tentar novamente
                    if (batchResult && batchResult.errors.length > 0) {
                      setBatchResult(null)
                    }
                    handleBatchImport()
                  }}
                  loading={batchImporting}
                >
                  {batchResult ? 'Tentar Novamente' : 'Importar'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
