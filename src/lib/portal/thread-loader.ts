// Server-side loader for stage threads.
//
// Returns, for a project, an array of `{ stageId, rounds[] }` so the
// page can render <StageThread> per stage without each thread
// re-querying. We also generate short-lived signed URLs for every
// attachment so they can be rendered inline without a second
// roundtrip.
//
// Important: this runs server-side under the caller's session, so
// Supabase RLS will already filter the rows down to what the caller
// can see (admin sees all; client sees their projects only).

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { ThreadAttachment, ThreadComment, ThreadRound } from '@/app/portal/_shared/StageThread';

interface RoundDbRow {
  id: string;
  stage_id: string;
  index: number;
  billable: boolean;
  opened_at: string;
  closed_at: string | null;
}

interface CommentDbRow {
  id: string;
  round_id: string;
  author_role: 'admin' | 'client';
  body: string;
  created_at: string;
}

interface AttachmentDbRow {
  id: string;
  comment_id: string | null;
  stage_id: string | null;
  kind: 'image' | 'video' | 'document' | 'link' | 'other';
  filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  storage_bucket: string | null;
  storage_path: string | null;
  external_url: string | null;
}

const SIGNED_URL_TTL = 60 * 10; // 10 min — enough for a page session

export async function loadProjectThreads(
  projectId: string
): Promise<Record<string, ThreadRound[]>> {
  const supabase = await createSupabaseServerClient();

  const { data: stages } = await supabase
    .from('stages')
    .select('id')
    .eq('project_id', projectId);
  const stageIds = (stages ?? []).map((s) => s.id);
  if (stageIds.length === 0) return {};

  const { data: roundsRaw } = await supabase
    .from('rounds')
    .select('id, stage_id, index, billable, opened_at, closed_at')
    .in('stage_id', stageIds)
    .order('index', { ascending: true });
  const rounds = (roundsRaw ?? []) as RoundDbRow[];
  const roundIds = rounds.map((r) => r.id);

  const commentRowsResult =
    roundIds.length > 0
      ? await supabase
          .from('comments')
          .select('id, round_id, author_role, body, created_at')
          .in('round_id', roundIds)
          .order('created_at', { ascending: true })
      : { data: [] as CommentDbRow[] };
  const comments = (commentRowsResult.data ?? []) as CommentDbRow[];
  const commentIds = comments.map((c) => c.id);

  // PostgREST's `.or()` doesn't play well with `.in.()` lists when the
  // lists contain commas, so we issue two scoped queries and merge —
  // attachments by stage and attachments by comment — instead of one
  // OR'd query.
  const attachmentSelect =
    'id, comment_id, stage_id, kind, filename, mime_type, size_bytes, storage_bucket, storage_path, external_url, created_at';
  const [byStage, byComment] = await Promise.all([
    stageIds.length > 0
      ? supabase
          .from('attachments')
          .select(attachmentSelect)
          .in('stage_id', stageIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as AttachmentDbRow[] }),
    commentIds.length > 0
      ? supabase
          .from('attachments')
          .select(attachmentSelect)
          .in('comment_id', commentIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [] as AttachmentDbRow[] }),
  ]);
  const seen = new Set<string>();
  const attachments: AttachmentDbRow[] = [];
  for (const row of [
    ...((byStage.data ?? []) as AttachmentDbRow[]),
    ...((byComment.data ?? []) as AttachmentDbRow[]),
  ]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    attachments.push(row);
  }

  // Generate signed URLs for every storage-backed attachment so the
  // client can render them inline.
  const storagePaths = attachments
    .map((a) => a.storage_path)
    .filter((p): p is string => typeof p === 'string' && p.length > 0);

  const signedMap = new Map<string, string>();
  if (storagePaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('project-attachments')
      .createSignedUrls(storagePaths, SIGNED_URL_TTL);
    if (signed) {
      for (const entry of signed) {
        if (entry.path && entry.signedUrl) {
          signedMap.set(entry.path, entry.signedUrl);
        }
      }
    }
  }

  // Group attachments by comment_id (and bucket "free" stage-level ones
  // under a per-stage key so we can render them next to the latest
  // comment in that stage).
  const attachByComment = new Map<string, ThreadAttachment[]>();
  for (const a of attachments) {
    const signed_url =
      a.external_url ?? (a.storage_path ? signedMap.get(a.storage_path) ?? null : null);
    const item: ThreadAttachment = {
      id: a.id,
      filename: a.filename,
      mime_type: a.mime_type,
      kind: a.kind,
      signed_url,
      size_bytes: a.size_bytes,
      comment_id: a.comment_id,
      stage_id: a.stage_id,
    };
    const key = a.comment_id ?? `stage:${a.stage_id ?? ''}`;
    const list = attachByComment.get(key) ?? [];
    list.push(item);
    attachByComment.set(key, list);
  }

  // Build the round → comments tree keyed by stage_id.
  const commentsByRound = new Map<string, ThreadComment[]>();
  for (const c of comments) {
    const items = commentsByRound.get(c.round_id) ?? [];
    items.push({
      id: c.id,
      body: c.body,
      author_role: c.author_role,
      created_at: c.created_at,
      attachments: attachByComment.get(c.id) ?? [],
    });
    commentsByRound.set(c.round_id, items);
  }

  const roundsByStage: Record<string, ThreadRound[]> = {};
  for (const r of rounds) {
    const list = roundsByStage[r.stage_id] ?? [];
    list.push({
      id: r.id,
      index: r.index,
      billable: r.billable,
      opened_at: r.opened_at,
      closed_at: r.closed_at,
      comments: commentsByRound.get(r.id) ?? [],
    });
    roundsByStage[r.stage_id] = list;
  }

  // Stage-level orphan attachments (not bound to any comment) get
  // appended onto a synthetic "pinned" comment in the latest round of
  // that stage so they still surface in the UI. If there's no round
  // yet for the stage, we skip them (the user must comment first).
  for (const stageId of stageIds) {
    const orphans = attachByComment.get(`stage:${stageId}`);
    if (!orphans || orphans.length === 0) continue;
    const list = roundsByStage[stageId];
    if (!list || list.length === 0) continue;
    const last = list[list.length - 1];
    if (last.comments.length === 0) {
      last.comments.push({
        id: `pinned-${stageId}`,
        body: '',
        author_role: 'admin',
        created_at: last.opened_at,
        attachments: orphans,
      });
    } else {
      last.comments[last.comments.length - 1].attachments.push(...orphans);
    }
  }

  return roundsByStage;
}
