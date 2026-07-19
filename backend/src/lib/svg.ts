type TrackInfo = {
  name: string
  artist: string
  cover_url?: string
  isPlaying?: boolean
  lastPlayedAt?: string
}

export function renderSvg(
  track: TrackInfo,
  theme: 'dark' | 'light',
  opts?: {
    spin?: boolean
    rainbow?: boolean
    scanCodeSrc?: string
    bg?: string // hex sem '#', ou 'transparent'
    textColor?: string // hex sem '#'
    scale?: number
  },
) {
  const width = 495
  const height = 160
  const outWidth = width * (opts?.scale ?? 1)
  const outHeight = height * (opts?.scale ?? 1)

  const bgTransparent = opts?.bg === 'transparent'
  const bg = bgTransparent
    ? 'none'
    : opts?.bg
      ? `#${opts.bg}`
      : theme === 'dark'
        ? '#151b23'
        : '#ffffff'
  const textPrimary = opts?.textColor
    ? `#${opts.textColor}`
    : theme === 'dark'
      ? '#FFFFFF'
      : '#161B22'
  const textSecondary = opts?.textColor
    ? hexToRgba(opts.textColor, 0.66)
    : theme === 'dark'
      ? 'rgba(240,248,255,0.66)'
      : 'rgba(22,27,34,0.66)'

  const cover = track.cover_url ?? 'https://placehold.co/400x400/png'

  // Área útil para título e artista (entre capa e scan code)
  const hasScan = !!opts?.scanCodeSrc
  const contentStartX = 160
  const contentEndX = width - 20 - (hasScan ? 120 : 0)
  const centerX = Math.floor((contentStartX + contentEndX) / 2)
  const maxTextWidth = contentEndX - contentStartX

  // Trunca por largura aproximada (font-size * 0.55 por caractere)
  const titleText = truncateByWidth(track.name, 20, maxTextWidth)
  const artistText = truncateByWidth(track.artist, 18, maxTextWidth)
  const safeName = escapeXml(titleText)
  const safeArtist = escapeXml(artistText)
  // Sem status textual

  // Equalizer abaixo do conteúdo de texto
  const eqBarWidth = 10
  const eqGap = 2
  const eqBarCount = 20
  const totalBarsWidth = eqBarCount * eqBarWidth + (eqBarCount - 1) * eqGap
  const eqLeftX = centerX - Math.floor(totalBarsWidth / 2)

  return `
<svg width="${outWidth}" height="${outHeight}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">

  <defs>
    <mask id="cover-mask">
      <rect x="20" y="20" width="120" height="120" rx="10" fill="#fff"/>
    </mask>
    <filter id="card-shadow" x="-20" y="-20" width="${width + 40}" height="${height + 40}" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity="${theme === 'dark' ? '0.35' : '0.2'}"/>
    </filter>
  </defs>

  <rect width="${width}" height="${height}" rx="8" fill="${bg}" ${bgTransparent ? '' : 'filter="url(#card-shadow)"'}/>

  <!-- Barras do equalizer alinhadas com a base da capa -->
  ${renderEq(eqLeftX, 110, theme, opts?.rainbow)}

  <!-- Capa -->
  <g>
    <g>
      ${opts?.spin ? `<animateTransform attributeName="transform" type="rotate" from="0 80 80" to="360 80 80" dur="10s" repeatCount="indefinite"/>` : ''}
      <image xlink:href="${cover}" href="${cover}" x="20" y="20" width="120" height="120" mask="url(#cover-mask)"/>
      <rect x="20" y="20" width="120" height="120" rx="10" fill="none" stroke="${theme === 'dark' ? '#1b2027' : '#f1f3f5'}"/>
    </g>
  </g>

  <!-- Conteúdo centralizado: título acima, artista no meio da capa (na frente das barras) -->
  <text x="${centerX}" y="58" fill="${textPrimary}" font-size="20" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif" font-weight="600" text-anchor="middle">
    ${safeName}
  </text>
  <text x="${centerX}" y="84" fill="${textSecondary}" font-size="18" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif" font-weight="500" text-anchor="middle">
    ${safeArtist}
  </text>

  <!-- Scan code opcional (rotacionado) -->
  ${
    hasScan
      ? `
  <g transform="translate(${width - 20}, 20) rotate(-90)">
    <image xlink:href="${opts?.scanCodeSrc}" href="${opts?.scanCodeSrc}" x="0" y="0" width="120" height="${height}"/>
  </g>
  `
      : ''
  }

</svg>
`
}

function renderEq(
  x: number,
  y: number,
  theme: 'dark' | 'light',
  _rainbow?: boolean,
) {
  const barColor = theme === 'dark' ? '#1DB954' : '#1DB954'
  const barWidth = 10
  const gap = 2
  const barCount = 20

  const yBase = y + 30

  // Gera um array com configurações para cada barra
  const bars: string[] = []

  for (let i = 0; i < barCount; i++) {
    const xpos = x + i * (barWidth + gap)

    let minHeight: number
    let maxHeight: number

    // Barras das extremidades - menores
    if (i < 3 || i >= barCount - 3) {
      minHeight = 8
      maxHeight = 20
    }
    // Barras intermediárias - médias
    else if (i < 8 || i >= barCount - 8) {
      minHeight = 12
      maxHeight = 28
    }
    // Barra do centro - maior
    else {
      minHeight = 16
      maxHeight = 35
    }

    // Duração mais lenta: entre 0.5s e 1.2s
    const dur = (Math.random() * (1.2 - 0.5) + 0.5).toFixed(2)

    const heightValues = `${minHeight};${maxHeight};${minHeight}`
    const opacityValues = `0.35;1;0.35`

    bars.push(`
    <rect x="${xpos.toFixed(1)}" y="${yBase - minHeight}" width="${barWidth}" height="${minHeight}" rx="1" fill="${barColor}">
      <animate attributeName="height"
        values="${heightValues}"
        dur="${dur}s"
        repeatCount="indefinite" />
      <animate attributeName="y"
        values="${yBase - minHeight};${yBase - maxHeight};${yBase - minHeight}"
        dur="${dur}s"
        repeatCount="indefinite" />
      <animate attributeName="opacity"
        values="${opacityValues}"
        dur="${dur}s"
        repeatCount="indefinite" />
    </rect>`)
  }

  return bars.join('\n')
}

function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncateByWidth(
  text: string,
  fontSize: number,
  maxWidth: number,
): string {
  const perChar = fontSize * 0.55
  const maxChars = Math.max(3, Math.floor(maxWidth / perChar))
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars - 3)}...`
}
