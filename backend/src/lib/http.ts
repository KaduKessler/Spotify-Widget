const DEFAULT_TIMEOUT_MS = 8000

// Node's fetch não tem timeout por padrão: uma chamada travada pra API/CDN
// externa (Spotify) prende quem espera a resposta pra sempre (ex: o preview
// do widget, que so termina de carregar quando o handler responde).
export function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
}
