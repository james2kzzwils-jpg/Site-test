import type { createSupabaseServerClient } from '@/lib/supabase/server';

export type PortalEventType =
  | 'comment_added'
  | 'file_uploaded'
  | 'stage_changed'
  | 'approval_requested'
  | 'approval_decided'
  | 'nda_signed'
  | 'project_created';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function resolveClientId(
  supabase: SupabaseServerClient,
  projectId: string,
  clientId?: string | null
) {
  if (clientId) return clientId;

  const { data } = await supabase
    .from('projects')
    .select('client_id')
    .eq('id', projectId)
    .maybeSingle();

  return data?.client_id ?? null;
}

function isMissingPortalEventsTable(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('portal_events') &&
    (normalized.includes('does not exist') ||
      normalized.includes('schema cache') ||
      normalized.includes('could not find the table'))
  );
}

export async function insertPortalEvent(args: {
  supabase: SupabaseServerClient;
  projectId: string;
  actorId: string;
  type: PortalEventType;
  clientId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const { supabase, projectId, actorId, type, payload = {} } = args;
  const clientId = await resolveClientId(supabase, projectId, args.clientId);
  if (!clientId) return;

  const { error } = await supabase.from('portal_events').insert({
    project_id: projectId,
    client_id: clientId,
    actor_id: actorId,
    type,
    payload,
  });

  if (!error) return;
  if (isMissingPortalEventsTable(error.message)) {
    console.warn('[portal_events] skipped:', error.message);
    return;
  }

  console.error('[portal_events] insert failed:', error.message);
}
