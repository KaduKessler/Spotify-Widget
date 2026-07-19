import { Edit, Lock, Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { postJson, putJson, requestJson } from '../api/client'
import Button from './Button'
import type { DataTableColumn } from './DataTable'
import DataTable from './DataTable'
import ModalShell from './ModalShell'
import Segmented from './Segmented'

type Role = 'admin' | 'user' | 'viewer'

type User = {
  id: number
  username: string
  provider: string
  role: Role
  createdAt: string
}

const roleBadgeStyles: Record<Role, string> = {
  admin: 'bg-red-500/15 text-red-300 border-red-500/30',
  user: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  viewer: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
}

const roleOptions: { value: Role; label: string }[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
]

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase ${roleBadgeStyles[role]}`}
    >
      {role}
    </span>
  )
}

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

const inputClass =
  'w-full rounded-xl border border-white/10 bg-neutral-900/80 px-3 py-2.5 text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70'

export default function UsersPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<Role>('user')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit role modal
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editRole, setEditRole] = useState<Role>('user')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Reset password modal
  const [resettingUser, setResettingUser] = useState<User | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await requestJson<{ users: User[] }>('/api/admin/users')
      setUsers(data.users)
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      setCreateError('Usuário e senha são obrigatórios.')
      return
    }

    setCreating(true)
    setCreateError(null)
    try {
      await postJson('/api/admin/users', {
        username: newUsername.trim(),
        password: newPassword.trim(),
        role: newRole,
      })
      await fetchUsers()
      setShowCreateModal(false)
      setNewUsername('')
      setNewPassword('')
      setNewRole('user')
    } catch (err: unknown) {
      console.error(err)
      setCreateError(
        err instanceof Error ? err.message : 'Erro ao criar usuário.',
      )
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!editingUser) return
    setUpdating(true)
    setUpdateError(null)
    try {
      await putJson(`/api/admin/users/${editingUser.username}/role`, {
        role: editRole,
      })
      await fetchUsers()
      setEditingUser(null)
    } catch (err: unknown) {
      console.error(err)
      setUpdateError(
        err instanceof Error ? err.message : 'Erro ao atualizar role.',
      )
    } finally {
      setUpdating(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resettingUser) return
    if (!resetPassword.trim()) {
      setResetError('Digite uma senha.')
      return
    }

    setResetting(true)
    setResetError(null)
    try {
      await putJson(`/api/admin/users/${resettingUser.username}/password`, {
        password: resetPassword.trim(),
      })
      setResettingUser(null)
      setResetPassword('')
    } catch (err: unknown) {
      console.error(err)
      setResetError(
        err instanceof Error ? err.message : 'Erro ao redefinir senha.',
      )
    } finally {
      setResetting(false)
    }
  }

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const columns: DataTableColumn<User>[] = [
    {
      key: 'username',
      label: 'Usuário',
      render: (value) => (
        <span className="font-medium text-white">{value}</span>
      ),
    },
    {
      key: 'provider',
      label: 'Origem',
      render: (value) => (
        <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
          {value}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Função',
      render: (value) => <RoleBadge role={value as Role} />,
    },
    {
      key: 'createdAt',
      label: 'Criado em',
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
      label: 'Ações',
      align: 'right',
      render: (_, user) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Edit size={14} />}
            onClick={() => {
              setEditingUser(user)
              setEditRole(user.role)
              setUpdateError(null)
            }}
          >
            Editar Função
          </Button>
          {user.provider === 'password' && (
            <Button
              variant="outline"
              size="sm"
              icon={<Lock size={14} />}
              onClick={() => {
                setResettingUser(user)
                setResetPassword('')
                setResetError(null)
              }}
            >
              Resetar Senha
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
            Administração
          </p>
          <h2 className="text-lg font-semibold text-white">
            Usuários
            <span className="ml-2 text-sm font-normal text-neutral-400">
              {users.length}
            </span>
          </h2>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => {
            setShowCreateModal(true)
            setCreateError(null)
          }}
        >
          Criar Usuário
        </Button>
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

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-900/40 px-3 py-2 text-xs text-red-100">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage={
          searchQuery
            ? `Nenhum resultado para "${searchQuery}"`
            : 'Nenhum usuário encontrado.'
        }
        rowKey="id"
      />

      {showCreateModal && (
        <ModalShell
          title="Criar Usuário"
          onClose={() => {
            setShowCreateModal(false)
            setNewUsername('')
            setNewPassword('')
            setNewRole('user')
            setCreateError(null)
          }}
        >
          {createError && (
            <div className="rounded-xl border border-red-500/40 bg-red-900/40 px-3 py-2 text-xs text-red-100">
              {createError}
            </div>
          )}
          <div className="space-y-1.5">
            <FieldLabel htmlFor="new-username">Usuário</FieldLabel>
            <input
              id="new-username"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className={inputClass}
              placeholder="username"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="new-password">Senha</FieldLabel>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="new-role">Função</FieldLabel>
            <Segmented
              value={newRole}
              onChange={setNewRole}
              options={roleOptions}
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCreateModal(false)
                setNewUsername('')
                setNewPassword('')
                setNewRole('user')
                setCreateError(null)
              }}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateUser}
              loading={creating}
              loadingText="Criando..."
            >
              Criar
            </Button>
          </div>
        </ModalShell>
      )}

      {editingUser && (
        <ModalShell
          title={`Editar Função: ${editingUser.username}`}
          onClose={() => {
            setEditingUser(null)
            setUpdateError(null)
          }}
        >
          {updateError && (
            <div className="rounded-xl border border-red-500/40 bg-red-900/40 px-3 py-2 text-xs text-red-100">
              {updateError}
            </div>
          )}
          <div className="space-y-1.5">
            <FieldLabel htmlFor="edit-role">Nova função</FieldLabel>
            <Segmented
              value={editRole}
              onChange={setEditRole}
              options={roleOptions}
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingUser(null)
                setUpdateError(null)
              }}
              disabled={updating}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateRole}
              loading={updating}
              loadingText="Salvando..."
            >
              Salvar
            </Button>
          </div>
        </ModalShell>
      )}

      {resettingUser && (
        <ModalShell
          title={`Redefinir Senha: ${resettingUser.username}`}
          onClose={() => {
            setResettingUser(null)
            setResetPassword('')
            setResetError(null)
          }}
        >
          {resetError && (
            <div className="rounded-xl border border-red-500/40 bg-red-900/40 px-3 py-2 text-xs text-red-100">
              {resetError}
            </div>
          )}
          <div className="space-y-1.5">
            <FieldLabel htmlFor="reset-password">Nova senha</FieldLabel>
            <input
              id="reset-password"
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResettingUser(null)
                setResetPassword('')
                setResetError(null)
              }}
              disabled={resetting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleResetPassword}
              loading={resetting}
              loadingText="Redefinindo..."
            >
              Redefinir
            </Button>
          </div>
        </ModalShell>
      )}
    </div>
  )
}
