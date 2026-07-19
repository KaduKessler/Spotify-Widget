import {
  ChevronDown,
  GitBranch,
  Info,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { del, postJson, requestJson } from '../api/client'
import Button from './Button'
import type { DataTableColumn } from './DataTable'
import DataTable from './DataTable'
import ModalShell from './ModalShell'
import Toggle from './Toggle'

type WhitelistEntry = {
  id: number
  username: string
  addedBy: string | null
  note: string | null
  createdAt: string
  removedBy: string | null
  removedAt: string | null
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-neutral-900/80 px-3 py-2.5 text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70'

function FieldLabel({
  children,
  htmlFor,
}: {
  children: string
  htmlFor: string
}) {
  return (
    <label htmlFor={htmlFor} className="block text-xs text-neutral-400">
      {children}
    </label>
  )
}

function InlineNote({
  tone,
  children,
}: {
  tone: 'error' | 'success' | 'warning'
  children: ReactNode
}) {
  const styles = {
    error: 'border-red-500/40 bg-red-900/40 text-red-100',
    success: 'border-emerald-500/40 bg-emerald-900/40 text-emerald-100',
    warning: 'border-amber-500/40 bg-amber-900/30 text-amber-100',
  }
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs ${styles[tone]}`}>
      {children}
    </div>
  )
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
          className="rounded font-medium text-emerald-400 transition-colors duration-150 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
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
          <span className="inline-flex items-center rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-medium text-sky-300">
            {value}
          </span>
        ) : (
          <span className="text-sm text-neutral-400">Sistema</span>
        ),
    },
    {
      key: 'note',
      label: 'Nota',
      render: (value) => (
        <span className="max-w-xs truncate text-neutral-400">
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
        }),
    },
    {
      key: 'id',
      label: 'Ação',
      align: 'right',
      render: (_, row) => (
        <div className="flex justify-end">
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={() => handleRemoveFromWhitelist(row.username)}
          >
            Remover
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
            Administração
          </p>
          <h2 className="text-lg font-semibold text-white">
            Whitelist GitHub
            <span className="ml-2 text-sm font-normal text-neutral-400">
              {whitelist.length} usuário{whitelist.length !== 1 ? 's' : ''}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
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

      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
        />
        <input
          type="text"
          placeholder="Buscar usuário..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`${inputClass} pl-9`}
        />
      </div>

      <div
        className="fade-in-up overflow-hidden rounded-2xl border border-white/8 bg-neutral-900/70 shadow-[0_20px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        style={{ animationDelay: '30ms', animationFillMode: 'backwards' }}
      >
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          aria-expanded={showInfo}
          className="flex w-full items-center gap-3 px-6 py-4 transition-colors duration-150 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/70"
        >
          <Info
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-neutral-400"
          />
          <span className="flex-1 text-left text-sm font-semibold text-white">
            Como funciona a whitelist
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-150 ${showInfo ? 'rotate-180' : ''}`}
          />
        </button>

        {showInfo && (
          <div className="field-reveal grid gap-3 border-t border-white/10 bg-white/[0.02] p-4 sm:grid-cols-3">
            <div className="space-y-1.5 rounded-xl border border-white/8 bg-white/5 p-4">
              <UserPlus
                aria-hidden="true"
                className="h-4 w-4 text-emerald-400"
              />
              <p className="text-sm font-semibold text-white">Acesso</p>
              <p className="text-xs leading-relaxed text-neutral-400">
                Usuários na lista podem criar conta via GitHub OAuth.
              </p>
            </div>

            <div className="space-y-1.5 rounded-xl border border-white/8 bg-white/5 p-4">
              <GitBranch
                aria-hidden="true"
                className="h-4 w-4 text-emerald-400"
              />
              <p className="text-sm font-semibold text-white">
                Relação com{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px]">
                  .env
                </code>
              </p>
              <p className="text-xs leading-relaxed text-neutral-400">
                Complementa, não substitui. Quem está lá entra automaticamente
                aqui na primeira tentativa de login. "Adicionado por" vazio =
                importado dele (ou política aberta).
              </p>
            </div>

            <div className="space-y-1.5 rounded-xl border border-white/8 bg-white/5 p-4">
              <ShieldCheck
                aria-hidden="true"
                className="h-4 w-4 text-emerald-400"
              />
              <p className="text-sm font-semibold text-white">Validação</p>
              <p className="text-xs leading-relaxed text-neutral-400">
                Opcional: confere se o usuário existe de fato no GitHub antes de
                adicionar.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <InlineNote tone="error">{error}</InlineNote>}

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

      {showAddModal && (
        <ModalShell
          title="Adicionar à Whitelist"
          description="Adicione um novo usuário do GitHub"
          onClose={() => {
            setShowAddModal(false)
            setAddError(null)
            setAddSuccess(null)
            setNewUsername('')
            setNewNote('')
          }}
        >
          {addError && <InlineNote tone="error">{addError}</InlineNote>}
          {addSuccess && <InlineNote tone="success">{addSuccess}</InlineNote>}

          <div className="space-y-1.5">
            <FieldLabel htmlFor="add-username">Usuário do GitHub</FieldLabel>
            <input
              id="add-username"
              type="text"
              placeholder="jdoe"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              disabled={adding}
              className={`${inputClass} disabled:opacity-50`}
            />
            <p className="text-[11px] text-neutral-500">
              1-39 caracteres, sem espaços
            </p>
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="add-note">Nota (opcional)</FieldLabel>
            <input
              id="add-note"
              type="text"
              placeholder="Motivo da adição..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              disabled={adding}
              className={`${inputClass} disabled:opacity-50`}
            />
          </div>

          <Toggle
            id="validate-github"
            checked={validateGithub}
            onChange={setValidateGithub}
            disabled={adding}
            label="Validar usuário no GitHub antes de adicionar"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
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
              variant="primary"
              size="sm"
              onClick={handleAddToWhitelist}
              loading={adding}
              loadingText="Adicionando..."
            >
              Adicionar
            </Button>
          </div>
        </ModalShell>
      )}

      {showBatchModal && (
        <ModalShell
          title="Import em Lote"
          description="Cole múltiplos usuários, um por linha"
          maxWidth="max-w-lg"
          onClose={() => {
            setShowBatchModal(false)
            setBatchError(null)
            setBatchResult(null)
            setBatchUsernames('')
          }}
        >
          {batchError && <InlineNote tone="error">{batchError}</InlineNote>}

          {batchResult && (
            <div className="space-y-3">
              {batchResult.added.length > 0 && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-900/40 px-3 py-2 text-xs text-emerald-100">
                  <p className="mb-2 font-semibold">
                    Adicionados com sucesso ({batchResult.added.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {batchResult.added.map((username) => (
                      <span
                        key={username}
                        className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px]"
                      >
                        @{username}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {batchResult.skipped.length > 0 && (
                <InlineNote tone="warning">
                  <p className="mb-2 font-semibold">
                    Já existem na whitelist ({batchResult.skipped.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {batchResult.skipped.map((username) => (
                      <span
                        key={username}
                        className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px]"
                      >
                        @{username}
                      </span>
                    ))}
                  </div>
                </InlineNote>
              )}

              {batchResult.errors.length > 0 && (
                <div className="space-y-2 rounded-xl border border-red-500/40 bg-red-900/40 px-3 py-2 text-xs text-red-100">
                  <p className="font-semibold">
                    Erros ({batchResult.errors.length}):
                  </p>
                  <ul className="max-h-40 space-y-1.5 overflow-y-auto">
                    {batchResult.errors.map((err) => (
                      <li
                        key={`${err.username}-${err.error}`}
                        className="flex items-start gap-2"
                      >
                        <span className="font-mono text-[11px]">
                          @{err.username}:
                        </span>
                        <span className="text-[11px]">{err.message}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="border-t border-red-500/30 pt-2 text-[11px] italic text-red-200/80">
                    Os usuários com erro foram mantidos no campo acima. Corrija
                    e tente novamente.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <FieldLabel htmlFor="batch-usernames">Usuários</FieldLabel>
            <textarea
              id="batch-usernames"
              placeholder={'jdoe\njane-smith\njohn_doe'}
              value={batchUsernames}
              onChange={(e) => setBatchUsernames(e.target.value)}
              disabled={batchImporting}
              rows={8}
              className={`${inputClass} font-mono disabled:opacity-50`}
            />
          </div>

          <Toggle
            id="batch-validate-github"
            checked={batchValidateGithub}
            onChange={setBatchValidateGithub}
            disabled={batchImporting}
            label="Validar cada usuário no GitHub (mais lento, mas seguro)"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
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
                variant="primary"
                size="sm"
                onClick={() => {
                  if (batchResult && batchResult.errors.length > 0) {
                    setBatchResult(null)
                  }
                  handleBatchImport()
                }}
                loading={batchImporting}
                loadingText="Importando..."
              >
                {batchResult ? 'Tentar Novamente' : 'Importar'}
              </Button>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  )
}
