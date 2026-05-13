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
import { nextStageKind, type StageKind } from '@/lib/portal/stages';

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
 * Client approves the current stage's deliverable. We then either
 * move the project to the next stage, or archive it if we were on
 * Final. The DB-side approval flip keeps the stage row honest so the
 * admin UI lights up the next step automatically.
 */
export async function clientApproveStageAction(formData: FormData) {
  const projectId = String(formData.get('project_id') ?? '');
  const stageId = String(formData.get('stage_id') ?? '');
  const stageKindRaw = String(formData.get('stage_kind') ?? '');
  if (!projectId || !stageId || !stageKindRaw) return;
  const kind = stageKindRaw as StageKind;

  const { supabase } = await requireProfile();

  await supabase
    .from('stages')
    .update({
      state: 'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', stageId);

  const nextKind = nextStageKind(kind);
  await supabase
    .from('projects')
    .update({ status: nextKind ?? 'archived' })
    .eq('id', projectId);

  revalidatePath(pathsFor(projectId));
}

/**
 * Client requests revisions on the current stage. We just flip state
 * to `changes_requested`; the next comment will lazily open a new
 * revision round via the thread action layer.
 */
export async function clientRequestChangesAction(formData: FormData) {
  const projectId = String(formData.get('project_id') ?? '');
  const stageId = String(formData.get('stage_id') ?? '');
  if (!projectId || !stageId) return;

  const { supabase } = await requireProfile();

  await supabase
    .from('stages')
    .update({ state: 'changes_requested' })
    .eq('id', stageId);

  revalidatePath(pathsFor(projectId));
}
