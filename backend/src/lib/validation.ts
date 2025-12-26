import { z } from 'zod'

// Widget configuration schema
export const WidgetConfigSchema = z.object({
  mode: z.enum(['NOW_PLAYING', 'FIXED_TRACK']).default('NOW_PLAYING'),
  track_id: z
    .string()
    .max(500, 'track_id too long. Max 500 characters')
    .trim()
    .nullable()
    .optional()
    .transform((val) => val || null),
  theme: z.enum(['dark', 'light']).default('dark'),
})

// Infer TypeScript type from schema
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>

// Output type with camelCase (for DB operations)
export interface ValidatedWidgetConfig {
  mode: 'NOW_PLAYING' | 'FIXED_TRACK'
  trackId: string | null
  theme: 'dark' | 'light'
}

/**
 * Helper to transform snake_case input to camelCase output
 */
export function parseWidgetConfig(
  input: unknown,
): { success: true; data: ValidatedWidgetConfig } | { success: false; error: string } {
  const result = WidgetConfigSchema.safeParse(input)

  if (!result.success) {
    // Format Zod errors into user-friendly message
    const firstError = result.error.issues[0]
    const message = firstError?.message || 'Invalid input'
    return { success: false, error: message }
  }

  return {
    success: true,
    data: {
      mode: result.data.mode,
      trackId: result.data.track_id ?? null,
      theme: result.data.theme,
    },
  }
}

export const SpotifyConfigSchema = z.object({
  clientId: z
    .string()
    .min(32, 'Client ID too short')
    .max(100, 'Client ID too long')
    .trim(),
  clientSecret: z
    .string()
    .min(32, 'Client Secret too short')
    .max(100, 'Client Secret too long')
    .trim(),
})

export type SpotifyConfig = z.infer<typeof SpotifyConfigSchema>

export const InviteTokenCreateSchema = z.object({
  expiresInDays: z.number().int().min(1).max(30).default(7),
  maxUses: z.number().int().min(1).max(100).default(1),
})

export type InviteTokenCreate = z.infer<typeof InviteTokenCreateSchema>

