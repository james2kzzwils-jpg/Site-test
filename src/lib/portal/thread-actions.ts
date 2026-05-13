'use server';

// Server actions used by the per-stage comment thread on both the
// admin and client project pages. Each action enforces RLS at the DB
// layer (we never use service-role from here) and reuses Supabase RLS
// policies to decide whether the caller is allowed to mutate.
//
// Three actions:
//   postCommentAction      - either side adds a comment to the
//                            currently-open round; opens a round if
//                            none exists yet
//   closeRoundAction       - admin closes the open round on a stage
//                            (clears the way for the next round)
//   finalizeAttachmentAction
//                          - inserts an attachment metadata row after
//                            the client side has uploaded the bytes
//                            into storage via a signed URL

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isRoundBillable } from '@/lib/portal/rounds';
import type { StageKind } from '@/lib/portal/stages';

// Shared auth helper. Returns the supabase client + profile or
// redirects to /portal/login. Profile shape carries the role so the
// caller can branch on it.
async function requireProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, email')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) redirect('/portal/login');

  return { supabase, profile };
}

function pathsFor(opts: {
  clientId?: string | null;
  projectId: string;
}) {
  const clientView = `/portal/client/${opts.projectId}`;
  const adminView = opts.clientId
    ? `/portal/admin/clients/${opts.clientId}/projects/${opts.projectId}`
    : null;
  return { clientView, adminView };
}

/**
 * Find the currently-open round on a stage, or open one if there isn't
 * one yet. The new round inherits its `billable` flag from the policy:
 * round 1 is included on stages 1–4, every other round is billable.
 *
 * Returns the round id and its (computed) round index.
 */
async function ensureOpenRound(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  stageId: string,
  stageKind: StageKind
) {
  const { data: open } = await supabase
    .from('rounds')
    .select('id, index, billable, closed_at')
    .eq('stage_id', stageId)
    .is('closed_at', null)
    .order('index', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (open) return { id: open.id, index: open.index };

  // Find the highest index used so far so we know what to bump to.
  const { data: latest } = await supabase
    .from('rounds')
    .select('index')
    .eq('stage_id', stageId)
    .order('index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextIndex = (latest?.index ?? 0) + 1;
  const billable = isRoundBillable(stageKind, nextIndex);

  const { data: created, error } = await supabase
    .from('rounds')
    .insert({
      stage_id: stageId,
      index: nextIndex,
      billable,
    })
    .select('id, index')
    .single();
  if (error || !created) throw error ?? new Error('round insert failed');
  return { id: created.id, index: created.index };
}

/**
 * Posts a comment under the active round on a stage. Lazily opens the
 * round if needed (so the first comment from either side starts round
 * 1 automatically). Returns the created comment id so the client can
 * follow up with attachment uploads.
 */
export async function postCommentAction(formData: FormData) {
  const projectId = String(formData.get('project_id') ?? '');
  const stageId = String(formData.get('stage_id') ?? '');
  const stageKindRaw = String(formData.get('stage_kind') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  const clientIdRaw = String(formData.get('client_id') ?? '');

  if (!projectId || !stageId || !stageKindRaw || !body) return;
  const stageKind = stageKindRaw as StageKind;

  const { supabase, profile } = await requireProfile();

  const round = await ensureOpenRound(supabase, stageId, stageKind);

  await supabase.from('comments').insert({
    round_id: round.id,
    author_id: profile.id,
    author_role: profile.role,
    body,
  });

  const { clientView, adminView } = pathsFor({
    clientId: clientIdRaw || null,
    projectId,
  });
  revalidatePath(clientView);
  if (adminView) revalidatePath(adminView);
}

/**
 * Admin-only: closes the currently-open round on a stage so the next
 * comment opens round N+1. We don't expose this to clients — only the
 * studio side decides when feedback is incorporated.
 */
export async function closeRoundAction(formData: FormData) {
  const projectId = String(formData.get('project_id') ?? '');
  const stageId = String(formData.get('stage_id') ?? '');
  const clientIdRaw = String(formData.get('client_id') ?? '');
  if (!projectId || !stageId) return;

  const { supabase, profile } = await requireProfile();
  if (profile.role !== 'admin') return;

  await supabase
    .from('rounds')
    .update({ closed_at: new Date().toISOString(), closed_by: profile.id })
    .eq('stage_id', stageId)
    .is('closed_at', null);

  const { clientView, adminView } = pathsFor({
    clientId: clientIdRaw || null,
    projectId,
  });
  revalidatePath(clientView);
  if (adminView) revalidatePath(adminView);
}

/**
 * Generates a short-lived signed upload URL for a single attachment.
 * The client uploads bytes directly to Supabase Storage via PUT, then
 * calls `finalizeAttachmentAction` to register the metadata row.
 *
 * Path layout: `<project_id>/<random_id>/<filename>` — keeping the
 * project id as the leading folder lets us write a single storage RLS
 * policy that's tied to project membership.
 */
export async function createUploadUrlAction(formData: FormData) {
  const projectId = String(formData.get('project_id') ?? '');
  const filename = String(formData.get('filename') ?? '').trim();
  if (!projectId || !filename) {
    return { ok: false as const, error: 'missing params' };
  }

  const { supabase } = await requireProfile();

  // We let the storage RLS policy decide whether the caller may write
  // to <project_id>/... — no need to recheck membership here.
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const safeName = filename.replace(/[^\w.\-]+/g, '_').slice(0, 96);
  const path = `${projectId}/${random}/${safeName}`;

  const { data, error } = await supabase.storage
    .from('project-attachments')
    .createSignedUploadUrl(path);
  if (error || !data) {
    return { ok: false as const, error: error?.message ?? 'sign failed' };
  }
  return {
    ok: true as const,
    path,
    token: data.token,
    signedUrl: data.signedUrl,
  };
}

/**
 * After the client PUTs the bytes into Supabase Storage, register the
 * metadata row so we can render the attachment in the thread. We rely
 * on the attachments RLS to enforce that the caller is allowed to add
 * this row — see 0002_rls_policies.sql.
 */
export async function finalizeAttachmentAction(formData: FormData) {
  const projectId = String(formData.get('project_id') ?? '');
  const stageId = String(formData.get('stage_id') ?? '');
  const commentId = String(formData.get('comment_id') ?? '') || null;
  const storagePath = String(formData.get('storage_path') ?? '');
  const filename = String(formData.get('filename') ?? '');
  const mime = String(formData.get('mime') ?? '') || null;
  const sizeRaw = String(formData.get('size_bytes') ?? '');
  const clientIdRaw = String(formData.get('client_id') ?? '');
  if (!projectId || !stageId || !storagePath || !filename) {
    return { ok: false as const, error: 'missing params' };
  }

  const size = Number(sizeRaw);
  const kind = pickKind(mime, filename);

  const { supabase, profile } = await requireProfile();
  const { error } = await supabase.from('attachments').insert({
    stage_id: stageId,
    comment_id: commentId,
    uploaded_by: profile.id,
    kind,
    storage_bucket: 'project-attachments',
    storage_path: storagePath,
    filename,
    size_bytes: Number.isFinite(size) ? size : null,
    mime_type: mime,
  });
  if (error) return { ok: false as const, error: error.message };

  const { clientView, adminView } = pathsFor({
    clientId: clientIdRaw || null,
    projectId,
  });
  revalidatePath(clientView);
  if (adminView) revalidatePath(adminView);

  return { ok: true as const };
}

function pickKind(
  mime: string | null,
  filename: string
): 'image' | 'video' | 'document' | 'other' {
  const m = (mime ?? '').toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('application/pdf')) return 'document';
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'].includes(ext))
    return 'image';
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'xls', 'xlsx'].includes(ext))
    return 'document';
  return 'other';
}
