import type { createSupabaseServerClient } from '@/lib/supabase/server';
import type { PortalEventType } from '@/lib/portal/events';

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type RawPortalEvent = {
  id: string;
  type: PortalEventType;
  project_id: string;
  client_id: string;
  actor_id: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
};

export type PortalInboxItem = {
  id: string;
  type: PortalEventType;
  projectId: string;
  clientId: string;
  actorId: string;
  actorEmail: string | null;
  actorName: string | null;
  actorRole: 'admin' | 'client' | null;
  projectTitle: string | null;
  clientName: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
};

export type AdminInboxLoadResult = {
  status: 'ready' | 'not_ready' | 'error';
  items: PortalInboxItem[];
};

function isMissingPortalEventsTable(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('portal_events') &&
    (normalized.includes('does not exist') ||
      normalized.includes('schema cache') ||
      normalized.includes('could not find the table'))
  );
}

async function enrichPortalEvents(
  supabase: SupabaseServerClient,
  events: RawPortalEvent[]
): Promise<PortalInboxItem[]> {
  if (events.length === 0) return [];

  const projectIds = [...new Set(events.map((event) => event.project_id).filter(Boolean))];
  const clientIds = [...new Set(events.map((event) => event.client_id).filter(Boolean))];
  const actorIds = [...new Set(events.map((event) => event.actor_id).filter(Boolean))];

  const [projectsResult, clientsResult, actorsResult] = await Promise.all([
    projectIds.length > 0
      ? supabase.from('projects').select('id, title, client_id').in('id', projectIds)
      : Promise.resolve({ data: [], error: null }),
    clientIds.length > 0
      ? supabase.from('clients').select('id, name').in('id', clientIds)
      : Promise.resolve({ data: [], error: null }),
    actorIds.length > 0
      ? supabase
          .from('profiles')
          .select('id, email, display_name, role')
          .in('id', actorIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (projectsResult.error) {
    console.error('[portal_events] projects lookup failed:', projectsResult.error.message);
  }
  if (clientsResult.error) {
    console.error('[portal_events] clients lookup failed:', clientsResult.error.message);
  }
  if (actorsResult.error) {
    console.error('[portal_events] profiles lookup failed:', actorsResult.error.message);
  }

  const projects = new Map(
    (projectsResult.data ?? []).map((project) => [project.id, project])
  );
  const clients = new Map(
    (clientsResult.data ?? []).map((client) => [client.id, client])
  );
  const actors = new Map(
    (actorsResult.data ?? []).map((profile) => [profile.id, profile])
  );

  return events.map<PortalInboxItem>((event) => {
    const project = projects.get(event.project_id);
    const client =
      clients.get(event.client_id) ??
      (project?.client_id ? clients.get(project.client_id) : undefined);
    const actor = actors.get(event.actor_id);

    return {
      id: event.id,
      type: event.type,
      projectId: event.project_id,
      clientId: event.client_id,
      actorId: event.actor_id,
      actorEmail: actor?.email ?? null,
      actorName: actor?.display_name ?? null,
      actorRole:
        actor?.role === 'admin' || actor?.role === 'client' ? actor.role : null,
      projectTitle: project?.title ?? null,
      clientName: client?.name ?? null,
      payload: event.payload ?? {},
      createdAt: event.created_at,
      readAt: event.read_at,
    };
  });
}

async function loadPortalEvents(args: {
  supabase: SupabaseServerClient;
  limit: number;
  projectId?: string;
}): Promise<AdminInboxLoadResult> {
  const { supabase, limit, projectId } = args;

  let query = supabase
    .from('portal_events')
    .select('id, type, project_id, client_id, actor_id, payload, created_at, read_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingPortalEventsTable(error.message)) {
      return { status: 'not_ready', items: [] };
    }

    console.error('[portal_events] query failed:', error.message);
    return { status: 'error', items: [] };
  }

  const events = (data ?? []) as RawPortalEvent[];
  if (events.length === 0) {
    return { status: 'ready', items: [] };
  }

  const items = await enrichPortalEvents(supabase, events);
  return { status: 'ready', items };
}

export async function loadAdminInbox(args: {
  supabase: SupabaseServerClient;
  limit?: number;
}): Promise<AdminInboxLoadResult> {
  const { supabase, limit = 40 } = args;
  return loadPortalEvents({ supabase, limit });
}

export async function loadProjectActivity(args: {
  supabase: SupabaseServerClient;
  projectId: string;
  limit?: number;
}): Promise<AdminInboxLoadResult> {
  const { supabase, projectId, limit = 12 } = args;
  return loadPortalEvents({ supabase, limit, projectId });
}
