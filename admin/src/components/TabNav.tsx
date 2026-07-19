export type TabId = 'config' | 'users' | 'whitelist'

export type TabNavProps = {
  activeTab: TabId
  isAdmin: boolean
  onChange: (tab: TabId) => void
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition whitespace-nowrap ${
        active
          ? 'bg-white/5 border-b-2 border-emerald-400 text-white'
          : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  )
}

export default function TabNav({ activeTab, isAdmin, onChange }: TabNavProps) {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-white/10 pb-0">
      <TabButton
        active={activeTab === 'config'}
        onClick={() => onChange('config')}
      >
        Configuração
      </TabButton>
      {isAdmin && (
        <>
          <TabButton
            active={activeTab === 'users'}
            onClick={() => onChange('users')}
          >
            Usuários
          </TabButton>
          <TabButton
            active={activeTab === 'whitelist'}
            onClick={() => onChange('whitelist')}
          >
            Whitelist GitHub
          </TabButton>
        </>
      )}
    </nav>
  )
}
