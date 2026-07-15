'use server';

// Client-side stage actions.
//
// Mirrors the verbose admin-side stage controls but with two key
// differences:
//   1. The caller does NOT have to be an admin — but RLS will still
//      filter the row down to projects the caller is a member of.
//   2. The set of allowed transitions is narrower: a client can only
//      approve the current stage or request changes on it (which
//      flips state to `changes_requested`). They never set state to
//      `pending` or `in_review`.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { insertPortalEvent } from '@/lib/portal/events';

async function requireProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');
  return { supabase, user };
}

function pathsFor(projectId: string) {
  return `/portal/client/${projectId}`;
}

/**
 * Client approves the current stage's deliverable.
 *
 * Unlike the old behaviour (which set state=approved and immediately
 * advanced project.status), we now set state=client_approved as an
 * intermediate gate. The admin then reviews and explicitly confirms
 * payment / delivery before advancing to the next stage.
 *
 * The stage row is marked with client_approved + approved_at so the
 * admin UI can clearly show what the client has signed off.
 */
export async function clientApproveStageAction(formData: FormData) {
  const projectId = String(formData.get('project_id') || '');
  const stageId = String(formData.get('stage_id') || '');
  const stageKind = String(formData.get('stage_kind') || '');
  if (!projectId || !stageId) return;

  const { supabase, user } = await requireProfile();

  await supabase
    .from('stages')
    .update({
      state: 'client_approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', stageId);

  await insertPortalEvent({
    supabase,
    projectId,
    actorId: user.id,
    type: 'approval_decided',
    payload: {
      stage_id: stageId,
      stage_kind: stageKind || null,
      decision: 'approved',
    },
  });

  // NOTE: project.status is NOT advanced here — that happens when
  // the admin calls confirmAndAdvanceAction.

  revalidatePath(pathsFor(projectId));
}

/**
 * Client requests revisions on the current stage. We just flip state
 * to `changes_requested`; the next comment will lazily open a new
 * revision round via the thread action layer.
 */
export async function clientRequestChangesAction(formData: FormData) {
  const projectId = String(formData.get('project_id') || '');
  const stageId = String(formData.get('stage_id') || '');
  if (!projectId || !stageId) return;

  const { supabase, user } = await requireProfile();

  await supabase
    .from('stages')
    .update({ state: 'changes_requested' })
    .eq('id', stageId);

  await insertPortalEvent({
    supabase,
    projectId,
    actorId: user.id,
    type: 'approval_decided',
    payload: {
      stage_id: stageId,
      decision: 'changes_requested',
    },
  });

  revalidatePath(pathsFor(projectId));
}
