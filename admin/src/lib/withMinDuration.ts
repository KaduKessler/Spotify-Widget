// Garante duração mínima pra evitar flicker em loading states de requests muito rápidos
export async function withMinDuration<T>(
  promise: Promise<T>,
  ms = 350,
): Promise<T> {
  const [result] = await Promise.all([
    promise,
    new Promise((resolve) => setTimeout(resolve, ms)),
  ])
  return result
}
