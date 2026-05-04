import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import type { AuditEventInput } from './types'

const SENSITIVE_KEYS = new Set([
  'noteText',
  'encryptedContent',
  'cnp',
  'cnpFull',
  'rawAnswers',
  'password',
  'token',
  'tokenHash',
  'secret',
  'apiKey',
  'accessToken',
  'refreshToken',
])

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.has(key)) continue
    result[key] = value
  }
  return result
}

function sanitizeSnapshot(
  snapshot: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!snapshot) return undefined
  return sanitizeMetadata(snapshot)
}

function buildRow(therapistId: string, actorId: string, input: AuditEventInput) {
  return {
    therapist_id: therapistId,
    actor_user_id: actorId,
    actor_role: 'THERAPIST',
    action: input.action,
    category: input.category,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    client_id: input.clientId ?? null,
    severity: input.severity ?? 'INFO',
    status: input.status ?? 'SUCCESS',
    metadata: sanitizeMetadata(input.metadata ?? {}),
    before_snapshot: sanitizeSnapshot(input.beforeSnapshot) ?? null,
    after_snapshot: sanitizeSnapshot(input.afterSnapshot) ?? null,
  }
}

// Variantă pentru contexte fără sesiune auth (service role, onboarding tokens etc.)
export async function logAuditEventAs(therapistId: string, input: AuditEventInput): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createSupabaseServiceClient() as any
    const { error } = await admin.from('audit_logs').insert(buildRow(therapistId, therapistId, input))
    if (error) {
      console.error('[audit] Insert failed:', error.message)
    }
  } catch (err) {
    console.error('[audit] Unexpected error:', err)
  }
}

export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('audit_logs').insert(buildRow(user.id, user.id, input))

    if (error) {
      console.error('[audit] Insert failed:', error.message)
    }
  } catch (err) {
    // Audit nu blochează niciodată flow-ul principal
    console.error('[audit] Unexpected error:', err)
  }
}
