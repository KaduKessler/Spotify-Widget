import { Github } from 'lucide-react'
import { useState } from 'react'
import DashboardHeader from './components/DashboardHeader'
import FlagsModal from './components/FlagsModal'
import GitHubWhitelistPanel from './components/GitHubWhitelistPanel'
import LoadingScreen from './components/LoadingScreen'
import LoginScreen from './components/LoginScreen'
import NowPlayingCard from './components/NowPlayingCard'
import SpotifyPanel from './components/SpotifyPanel'
import TabNav, { type TabId } from './components/TabNav'
import UsersPanel from './components/UsersPanel'
import WidgetEditorCard from './components/WidgetEditorCard'
import { useAuth } from './hooks/useAuth'
import { useSpotify } from './hooks/useSpotify'
import { useWidgetConfig } from './hooks/useWidgetConfig'

export default function App() {
  const auth = useAuth()
  const spotify = useSpotify(auth.me)
  const widget = useWidgetConfig(auth.me, spotify.fetchNowPlaying)
  const [activeTab, setActiveTab] = useState<TabId>('config')

  // LOADING inicial
  if (!auth.authProviders.length || auth.checkingAuth) {
    return <LoadingScreen label="Carregando painel..." />
  }

  // Se não autenticado → tela de login adequada pro provider
  if (!auth.me) {
    return (
      <LoginScreen
        hasPassword={auth.hasPassword}
        hasGithub={auth.hasGithub}
        authError={auth.authError}
        loginUsername={auth.loginUsername}
        loginPassword={auth.loginPassword}
        loginLoading={auth.loginLoading}
        showPassword={auth.showPassword}
        onUsernameChange={auth.setLoginUsername}
        onPasswordChange={auth.setLoginPassword}
        onToggleShowPassword={auth.toggleShowPassword}
        onSubmitPassword={auth.handleLoginPassword}
        onLoginGithub={auth.handleLoginWithGithub}
      />
    )
  }

  // Autenticado → painel normal
  if (widget.loadingConfig || !widget.config) {
    return <LoadingScreen label="Carregando configuração..." />
  }

  const config = widget.config

  return (
    <>
      <div className="relative min-h-screen bg-neutral-950 text-neutral-50">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 via-cyan-500/8 to-sky-600/12 blur-3xl" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 space-y-10">
          <DashboardHeader
            username={auth.me.username}
            role={auth.me.role}
            avatarUrl={auth.userAvatar}
            jsonUrl={widget.jsonUrl}
            registrationPolicy={auth.registrationPolicy}
            showLogout={!auth.hasNone}
            onLogout={auth.handleLogout}
          />

          <TabNav
            activeTab={activeTab}
            isAdmin={auth.me.role === 'admin'}
            onChange={setActiveTab}
          />

          {/* Tab Content */}
          {activeTab === 'users' && auth.me.role === 'admin' && <UsersPanel />}

          {activeTab === 'whitelist' && auth.me.role === 'admin' && (
            <GitHubWhitelistPanel />
          )}

          {activeTab === 'config' && (
            <>
              <section className="space-y-3">
                <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                  Configuração
                </p>
                <WidgetEditorCard
                  config={config}
                  saving={widget.saving}
                  configError={widget.configError}
                  onChangeMode={(mode) => widget.setConfig({ ...config, mode })}
                  onChangeTrackId={(track_id) =>
                    widget.setConfig({ ...config, track_id })
                  }
                  onChangeTheme={(theme) =>
                    widget.setConfig({ ...config, theme })
                  }
                  onOpenFlags={() => widget.setShowFlagsModal(true)}
                  onSave={() => widget.handleSave()}
                  customBg={widget.customBg}
                  customColor={widget.customColor}
                  customScale={widget.customScale}
                  onChangeCustomBg={(value) => {
                    widget.setCustomBg(value)
                    widget.scheduleAppearanceRefresh({
                      bg: value,
                      color: widget.customColor,
                      scale: widget.customScale,
                    })
                  }}
                  onChangeCustomColor={(value) => {
                    widget.setCustomColor(value)
                    widget.scheduleAppearanceRefresh({
                      bg: widget.customBg,
                      color: value,
                      scale: widget.customScale,
                    })
                  }}
                  onChangeCustomScale={(value) => {
                    widget.setCustomScale(value)
                    widget.scheduleAppearanceRefresh({
                      bg: widget.customBg,
                      color: widget.customColor,
                      scale: value,
                    })
                  }}
                  widgetUrl={widget.widgetUrl}
                  previewUrl={widget.previewUrl}
                  previewKey={widget.previewKey}
                  previewLoading={widget.previewLoading}
                  onPreviewLoad={() => widget.setPreviewLoading(false)}
                  onPreviewError={() => widget.setPreviewLoading(false)}
                  copiedFormat={widget.copiedFormat}
                  onCopyMarkdown={() => widget.copyToClipboard('markdown')}
                  onCopyHtml={() => widget.copyToClipboard('html')}
                  onCopyUrl={() => widget.copyToClipboard('url')}
                />
                {spotify.spotifyConnected && config.mode === 'FIXED_TRACK' && (
                  <NowPlayingCard
                    nowPlaying={spotify.nowPlaying}
                    loadingNowPlaying={spotify.loadingNowPlaying}
                    onRefresh={spotify.fetchNowPlaying}
                  />
                )}
              </section>

              <SpotifyPanel
                spotifyConfig={spotify.spotifyConfig}
                spotifyClientId={spotify.spotifyClientId}
                spotifyClientSecret={spotify.spotifyClientSecret}
                savingSpotify={spotify.savingSpotify}
                spotifyError={spotify.spotifyError}
                spotifySuccess={spotify.spotifySuccess}
                spotifyConnected={spotify.spotifyConnected}
                loadingSpotifyStatus={spotify.loadingSpotifyStatus}
                onClientIdChange={spotify.setSpotifyClientId}
                onClientSecretChange={spotify.setSpotifyClientSecret}
                onSubmit={spotify.handleSaveSpotify}
                onClear={spotify.handleClearSpotify}
                onConnect={spotify.handleConnectSpotify}
                onDisconnect={spotify.handleDisconnectSpotify}
              />
            </>
          )}
        </div>

        <footer className="relative z-10 flex items-center justify-center gap-1.5 pb-6 text-[11px] text-neutral-600">
          <a
            href="https://github.com/KaduKessler/Spotify-Widget"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 transition-colors duration-150 hover:text-neutral-400"
          >
            <Github aria-hidden="true" className="h-3.5 w-3.5" />
            Spotify Widget
          </a>
          <span aria-hidden="true">·</span>
          <span className="font-mono">v{__APP_VERSION__}</span>
        </footer>
      </div>

      <FlagsModal
        open={widget.showFlagsModal}
        onClose={() => widget.setShowFlagsModal(false)}
        exposeNowPlaying={config.expose_now_playing}
        onToggleExpose={(checked) => {
          widget.setConfig((prev) => {
            if (!prev) return prev
            const next = { ...prev, expose_now_playing: checked }
            void widget.handleSave(next)
            return next
          })
        }}
      />
    </>
  )
}
