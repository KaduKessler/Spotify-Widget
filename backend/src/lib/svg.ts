type TrackInfo = {
  name: string
  artist: string
  cover_url?: string
}

export function renderSvg(track: TrackInfo, theme: 'dark' | 'light') {
  const bg = theme === 'dark' ? '#121212' : '#F5F5F5'
  const textPrimary = theme === 'dark' ? '#FFFFFF' : '#111111'
  const textSecondary = theme === 'dark' ? '#B3B3B3' : '#555555'

  const cover = track.cover_url ?? 'https://placehold.co/400x400/png' // Placeholder show de bola

  const safeName = escapeXml(track.name)
  const safeArtist = escapeXml(track.artist)

  return `
<svg width="460" height="140" viewBox="0 0 460 140" fill="none" xmlns="http://www.w3.org/2000/svg">

  <defs>
    <linearGradient id="bg-grad" x1="0" y1="0" x2="460" y2="140">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${theme === 'dark' ? '#181818' : '#EDEDED'}"/>
    </linearGradient>

    <clipPath id="cover-clip">
      <rect x="20" y="20" width="100" height="100" rx="12"/>
    </clipPath>
  </defs>

  <rect width="460" height="140" rx="18" fill="url(#bg-grad)"/>

  <!-- Capa -->
  <image href="${cover}" x="20" y="20" width="100" height="100" clip-path="url(#cover-clip)"/>

  <!-- Nome da música -->
  <text x="140" y="60" fill="${textPrimary}" font-size="20" font-family="sans-serif" font-weight="600">
    ${safeName}
  </text>

  <!-- Artista -->
  <text x="140" y="90" fill="${textSecondary}" font-size="16" font-family="sans-serif">
    ${safeArtist}
  </text>

  <!-- Equalizer -->
  ${renderEq(360, 50, theme)}

</svg>
`
}

function renderEq(x: number, y: number, theme: 'dark' | 'light') {
  const barColor = theme === 'dark' ? '#1DB954' : '#1DB954'
  const barWidth = 6
  const gap = 6

  const yBase = y + 45 // base comum das barras

  // configurações das barras (min, max, duração, atraso)
  const configs = [
    { min: 10, max: 32, dur: 0.95, delay: 0.0 },
    { min: 8, max: 28, dur: 1.05, delay: 0.12 },
    { min: 6, max: 36, dur: 0.85, delay: 0.06 },
    { min: 12, max: 30, dur: 1.0, delay: 0.18 },
    { min: 8, max: 26, dur: 1.15, delay: 0.1 },
  ]

  // easing suave (cubic-bezier approximated para SMIL)
  const keyTimes = '0;0.25;0.5;0.75;1'
  const keySplines = '0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1'

  const bar = (
    index: number,
    minHeight: number,
    maxHeight: number,
    dur: number,
    delay: number,
  ) => {
    const xpos = x + index * (barWidth + gap)
    const mid = (minHeight + maxHeight) / 2

    // valores suaves: min -> mid -> max -> mid -> min
    const heightValues = `${minHeight};${mid};${maxHeight};${mid};${minHeight}`
    const yValues = `${yBase - minHeight};${yBase - mid};${yBase - maxHeight};${yBase - mid};${yBase - minHeight}`
    const opacityValues = `0.85;1;0.9;1;0.85`

    return `
    <rect x="${xpos}" y="${yBase - mid}" width="${barWidth}" height="${mid}" rx="2" fill="${barColor}">
      <animate attributeName="height"
        values="${heightValues}"
        keyTimes="${keyTimes}"
        keySplines="${keySplines}"
        calcMode="spline"
        dur="${dur}s"
        begin="${delay}s"
        repeatCount="indefinite" />
      <animate attributeName="y"
        values="${yValues}"
        keyTimes="${keyTimes}"
        keySplines="${keySplines}"
        calcMode="spline"
        dur="${dur}s"
        begin="${delay}s"
        repeatCount="indefinite" />
      <animate attributeName="fill-opacity"
        values="${opacityValues}"
        keyTimes="${keyTimes}"
        keySplines="${keySplines}"
        calcMode="spline"
        dur="${dur * 2}s"
        begin="${delay}s"
        repeatCount="indefinite" />
    </rect>
  `
  }

  return configs.map((c, i) => bar(i, c.min, c.max, c.dur, c.delay)).join('\n')
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
