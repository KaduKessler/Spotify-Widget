import { Edit, Lock, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import Button from './Button'
import type { DataTableColumn } from './DataTable'
import DataTable from './DataTable'

type User = {
  id: number
  username: string
  provider: string
  role: 'admin' | 'user' | 'viewer'
  createdAt: string
}

export default function UsersPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'user' | 'viewer'>('user')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Edit role modal
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editRole, setEditRole] = useState<'admin' | 'user' | 'viewer'>('user')
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
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = (await res.json()) as { users: User[] }
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
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword.trim(),
          role: newRole,
        }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to create user')
      }
      // Refresh list
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
      const res = await fetch(`/api/admin/users/${editingUser.username}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to update role')
      }
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
      const res = await fetch(
        `/api/admin/users/${resettingUser.username}/password`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: resetPassword.trim() }),
        },
      )
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to reset password')
      }
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'user':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'viewer':
        return 'bg-sky-500/20 text-sky-400 border-sky-500/30'
      default:
        return 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
    }
  }

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
      label: 'Provider',
      render: (value) => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-neutral-800 text-neutral-300">
          {value}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(value as string)}`}
        >
          {value}
        </span>
      ),
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
          second: '2-digit',
        }),
    },
    {
      key: 'id',
      label: 'Ações',
      align: 'right',
      render: (_, user) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="primary"
            size="sm"
            icon={<Edit size={16} />}
            onClick={() => {
              setEditingUser(user)
              setEditRole(user.role)
            }}
          >
            Editar Role
          </Button>
          {user.provider === 'password' && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Lock size={16} />}
              onClick={() => {
                setResettingUser(user)
                setResetPassword('')
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Usuários</h2>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => setShowCreateModal(true)}
        >
          Criar Usuário
        </Button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="text-neutral-400">Carregando usuários...</div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-red-400">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="Nenhum usuário encontrado."
        rowKey="id"
      />

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Criar Usuário</h3>
            {createError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {createError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="new-username"
                  className="block text-sm font-medium text-neutral-400 mb-1"
                >
                  Usuário
                </label>
                <input
                  id="new-username"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="username"
                />
              </div>
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-neutral-400 mb-1"
                >
                  Senha
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label
                  htmlFor="new-role"
                  className="block text-sm font-medium text-neutral-400 mb-1"
                >
                  Role
                </label>
                <select
                  id="new-role"
                  value={newRole}
                  onChange={(e) =>
                    setNewRole(e.target.value as 'admin' | 'user' | 'viewer')
                  }
                  className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="viewer">viewer</option>
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
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
                variant={
                  newUsername.trim() && newPassword.trim()
                    ? 'success'
                    : 'primary'
                }
                size="sm"
                onClick={handleCreateUser}
                loading={creating}
              >
                Criar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">
              Editar Role: {editingUser.username}
            </h3>
            {updateError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {updateError}
              </div>
            )}
            <div>
              <label
                htmlFor="edit-role"
                className="block text-sm font-medium text-neutral-400 mb-1"
              >
                Nova Role
              </label>
              <select
                id="edit-role"
                value={editRole}
                onChange={(e) =>
                  setEditRole(e.target.value as 'admin' | 'user' | 'viewer')
                }
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="viewer">viewer</option>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
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
                variant="success"
                size="sm"
                onClick={handleUpdateRole}
                loading={updating}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">
              Redefinir Senha: {resettingUser.username}
            </h3>
            {resetError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {resetError}
              </div>
            )}
            <div>
              <label
                htmlFor="reset-password"
                className="block text-sm font-medium text-neutral-400 mb-1"
              >
                Nova Senha
              </label>
              <input
                id="reset-password"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                variant={resetPassword.trim() ? 'success' : 'secondary'}
                size="sm"
                onClick={handleResetPassword}
                loading={resetting}
              >
                Redefinir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
