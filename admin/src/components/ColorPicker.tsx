import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { createPortal } from 'react-dom'

const PRESETS = [
  '151b23',
  '1e3a2f',
  '3a1e2f',
  '1e2a3a',
  '3a2e1e',
  'fef3c7',
  'ffffff',
  '000000',
]

const PANEL_WIDTH = 208
const PANEL_HEIGHT = 340
const MARGIN = 8

export default function ColorPicker({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (hex: string) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [hexInput, setHexInput] = useState(value)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHexInput(value)
  }, [value])

  useLayoutEffect(() => {
    if (!open) return

    function reposition() {
      const button = buttonRef.current
      if (!button) return
      const rect = button.getBoundingClientRect()
      // Ancora nos limites do card que contém o botão (não da viewport),
      // pra nunca vazar visualmente sobre outros cards abaixo/ao lado.
      const card = button.closest('[data-widget-card]')
      const bounds = card
        ? card.getBoundingClientRect()
        : {
            left: MARGIN,
            right: window.innerWidth - MARGIN,
            top: MARGIN,
            bottom: window.innerHeight - MARGIN,
          }

      const left = Math.min(
        Math.max(bounds.left + MARGIN, rect.right - PANEL_WIDTH),
        bounds.right - PANEL_WIDTH - MARGIN,
      )
      const top =
        rect.bottom + MARGIN + PANEL_HEIGHT > bounds.bottom
          ? Math.max(bounds.top + MARGIN, rect.top - PANEL_HEIGHT - MARGIN)
          : rect.bottom + MARGIN
      setCoords({ top, left })
    }

    reposition()
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)

    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (
        !buttonRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function commitHex(raw: string) {
    const clean = raw.replace('#', '').trim()
    if (/^[0-9a-fA-F]{6}$/.test(clean)) onChange(clean.toLowerCase())
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-9 shrink-0 cursor-pointer rounded-lg border border-white/10 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70"
        style={{ backgroundColor: `#${value}` }}
      />

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: coords.top, left: coords.left, width: PANEL_WIDTH }}
            className="modal-panel-in fixed z-50 space-y-3 rounded-2xl border border-white/10 bg-neutral-900/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <div className="overflow-hidden rounded-lg border border-white/10">
              <HexColorPicker
                color={`#${value}`}
                onChange={(hex) => onChange(hex.slice(1))}
              />
            </div>

            <div className="grid grid-cols-8 gap-1.5">
              {PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={`#${hex}`}
                  onClick={() => onChange(hex)}
                  className={`h-5 w-5 rounded-md border transition-transform duration-150 active:scale-90 ${value === hex ? 'border-emerald-400 ring-1 ring-emerald-400' : 'border-white/15'}`}
                  style={{ backgroundColor: `#${hex}` }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
              <span className="text-xs text-neutral-500">#</span>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                onBlur={() => commitHex(hexInput)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitHex(hexInput)
                }}
                maxLength={6}
                className="w-full bg-transparent font-mono text-xs uppercase text-neutral-200 focus-visible:outline-none"
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
