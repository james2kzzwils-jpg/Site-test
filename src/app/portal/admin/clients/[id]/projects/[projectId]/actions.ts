'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { insertPortalEvent } from '@/lib/portal/events';
import {
  STAGE_ORDER,
  nextStageKind,
  type ProjectStatus,
  type StageKind,
} from '@/lib/portal/stages';

// Guard: every admin action runs through this so we never trust the
// caller's claim of admin-ness. The middleware redirects non-admins
// already, but a misconfigured client could still call the action.
async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') redirect('/portal');

  return { supabase, userId: user.id };
}

function pathsFor(clientId: string, projectId: string) {
  const adminProject = `/portal/admin/clients/${clientId}/projects/${projectId}`;
  const clientProject = `/portal/client/${projectId}`;
  return { adminProject, clientProject };
}

/**
 * Admin confirms client approval and advances to the next stage.
 *
 * This is the "payment gate" action: the client has approved
 * (state=client_approved), and the admin now confirms the move.
 * Sets the current stage to fully approved and bumps project.status
 * to the next stage (or archived if final).
 */
export async function confirmAndAdvanceAction(formData: FormData) {
  const clientId = String(formData.get('client_id') || '');
  const projectId = String(formData.get('project_id') || '');
  if (!clientId || !projectId) return;

  const { supabase, userId } = await requireAdmin();

  const { data: project } = await supabase
    .from('projects')
    .select('id, status')
    .eq('id', projectId)
    .maybeSingle();
  if (!project) return;

  const currentStatus = project.status as ProjectStatus;
  if (currentStatus === 'archived') return;

  const current = currentStatus as StageKind;
  const next = nextStageKind(current);

  // Mark current stage fully approved
  await supabase
    .from('stages')
    .update({ state: 'approved', approved_at: new Date().toISOString() })
    .eq('project_id', projectId)
    .eq('kind', current);

  // Advance project to next stage (or archive if final)
  await supabase
    .from('projects')
    .update({ status: next ?? 'archived' })
    .eq('id', projectId);

  await insertPortalEvent({
    supabase,
    projectId,
    clientId,
    actorId: userId,
    type: 'stage_changed',
    payload: {
      from_stage: current,
      to_stage: next ?? 'archived',
      trigger: 'confirm_and_advance',
    },
  });

  const { adminProject, clientProject } = pathsFor(clientId, projectId);
  revalidatePath(adminProject);
  revalidatePath(clientProject);
}

/**
 * Admin freely navigates stages forward or backward.
 *
 * This allows the admin to set project.status to any stage,
 * enabling flexible workflow management. Useful for corrections,
 * skipping stages, or rolling back.
 */
export async function navigateStageAction(formData: FormData) {
  const clientId = String(formData.get('client_id') || '');
  const projectId = String(formData.get('project_id') || '');
  const targetKindRaw = String(formData.get('target_kind') || '');
  if (!clientId || !projectId || !targetKindRaw) return;

  const targetKind = targetKindRaw as StageKind;
  if (!STAGE_ORDER.includes(targetKind)) return;

  const { supabase, userId } = await requireAdmin();

  const { data: current } = await supabase
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .maybeSingle();

  await supabase
    .from('projects')
    .update({ status: targetKind })
    .eq('id', projectId);

  await insertPortalEvent({
    supabase,
    projectId,
    clientId,
    actorId: userId,
    type: 'stage_changed',
    payload: {
      from_stage: current?.status ?? null,
      to_stage: targetKind,
      trigger: 'navigate',
    },
  });

  const { adminProject, clientProject } = pathsFor(clientId, projectId);
  revalidatePath(adminProject);
  revalidatePath(clientProject);
}

// Advance: mark the current stage approved and bump project.status to
// the next stage. If we're already on the last stage, the project is
// flipped to 'archived'. Kept for backward compatibility but internal
// flow should prefer confirmAndAdvanceAction.
export async function advanceStageAction(formData: FormData) {
  const clientId = String(formData.get('client_id') || '');
  const projectId = String(formData.get('project_id') || '');
  if (!clientId || !projectId) return;

  const { supabase, userId } = await requireAdmin();

  const { data: project } = await supabase
    .from('projects')
    .select('id, status')
    .eq('id', projectId)
    .maybeSingle();
  if (!project) return;

  const currentStatus = project.status as ProjectStatus;
  if (currentStatus === 'archived') return;

  const current = currentStatus as StageKind;
  const next = nextStageKind(current);

  await supabase
    .from('stages')
    .update({ state: 'approved', approved_at: new Date().toISOString() })
    .eq('project_id', projectId)
    .eq('kind', current);

  await supabase
    .from('projects')
    .update({ status: next ?? 'archived' })
    .eq('id', projectId);

  await insertPortalEvent({
    supabase,
    projectId,
    clientId,
    actorId: userId,
    type: 'stage_changed',
    payload: {
      from_stage: current,
      to_stage: next ?? 'archived',
      trigger: 'legacy_advance',
    },
  });

  const { adminProject, clientProject } = pathsFor(clientId, projectId);
  revalidatePath(adminProject);
  revalidatePath(clientProject);
}

// Move a stage state forward without finalising the project.
export async function setStageStateAction(formData: FormData) {
  const clientId = String(formData.get('client_id') || '');
  const projectId = String(formData.get('project_id') || '');
  const stageId = String(formData.get('stage_id') || '');
  const stateRaw = String(formData.get('state') || '');
  const allowed = new Set([
    'pending',
    'in_review',
    'changes_requested',
    'client_approved',
    'approved',
  ]);
  if (!projectId || !clientId || !stageId || !allowed.has(stateRaw)) return;

  const { supabase, userId } = await requireAdmin();
  await supabase
    .from('stages')
    .update({
      state: stateRaw,
      approved_at:
        stateRaw === 'approved' || stateRaw === 'client_approved'
          ? new Date().toISOString()
          : null,
    })
    .eq('id', stageId);

  await insertPortalEvent({
    supabase,
    projectId,
    clientId,
    actorId: userId,
    type: stateRaw === 'in_review' ? 'approval_requested' : 'stage_changed',
    payload: {
      stage_id: stageId,
      stage_state: stateRaw,
      trigger: 'set_stage_state',
    },
  });

  const { adminProject, clientProject } = pathsFor(clientId, projectId);
  revalidatePath(adminProject);
  revalidatePath(clientProject);
}

// Reset everything: bump project back to 'discovery' and wipe all
// stage approvals. Used while iterating, not exposed in default UI yet.
export async function resetProjectAction(formData: FormData) {
  const clientId = String(formData.get('client_id') || '');
  const projectId = String(formData.get('project_id') || '');
  if (!projectId || !clientId) return;

  const { supabase, userId } = await requireAdmin();
  await supabase
    .from('stages')
    .update({ state: 'pending', approved_at: null })
    .eq('project_id', projectId);
  await supabase
    .from('projects')
    .update({ status: STAGE_ORDER[0] })
    .eq('id', projectId);

  await insertPortalEvent({
    supabase,
    projectId,
    clientId,
    actorId: userId,
    type: 'stage_changed',
    payload: {
      to_stage: STAGE_ORDER[0],
      trigger: 'reset',
    },
  });

  const { adminProject, clientProject } = pathsFor(clientId, projectId);
  revalidatePath(adminProject);
  revalidatePath(clientProject);
}

export async function updateProjectMetaAction(formData: FormData) {
  const clientId = String(formData.get('client_id') || '');
  const projectId = String(formData.get('project_id') || '');
  const brief = String(formData.get('brief') || '');
  const budgetRaw = String(formData.get('budget') || '').trim();
  const currency = String(formData.get('currency') || '').trim() || null;
  const dueDate = String(formData.get('due_date') || '').trim() || null;
  if (!projectId) return;

  const { supabase } = await requireAdmin();

  const update: Record<string, unknown> = {
    brief: brief.length > 0 ? brief : null,
    currency,
    dueDate,
  };
  if (budgetRaw === '') {
    update.budget_cents = null;
  } else {
    const n = Number(budgetRaw);
    if (Number.isFinite(n) && n >= 0) {
      update.budget_cents = Math.round(n * 100);
    }
  }

  await supabase.from('projects').update(update).eq('id', projectId);

  const { adminProject, clientProject } = pathsFor(clientId, projectId);
  revalidatePath(adminProject);
  revalidatePath(clientProject);
}

export async function updateProjectNdaAction(formData: FormData) {
  const clientId = String(formData.get('client_id') || '');
  const projectId = String(formData.get('project_id') || '');
  const mode = String(formData.get('nda_mode') || 'none');
  const date = String(formData.get('nda_until_date') || '').trim();
  if (!projectId) return;

  const { supabase } = await requireAdmin();

  let value: string | null = null;
  if (mode === 'perpetual') value = 'infinity';
  else if (mode === 'until' && date) value = date;

  await supabase.from('projects').update({ nda_until: value }).eq('id', projectId);

  const { adminProject, clientProject } = pathsFor(clientId, projectId);
  revalidatePath(adminProject);
  revalidatePath(clientProject);
}

export async function togglePublishAction(formData: FormData) {
  const clientId = String(formData.get('client_id') || '');
  const projectId = String(formData.get('project_id') || '');
  const next = formData.get('publish') === 'on';
  if (!projectId) return;

  const { supabase } = await requireAdmin();

  const { data: current } = await supabase
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .maybeSingle();
  if (!current) return;
  if (current.status !== 'final' && current.status !== 'archived') return;

  await supabase
    .from('projects')
    .update({ is_public_portfolio: next })
    .eq('id', projectId);

  const { adminProject, clientProject } = pathsFor(clientId, projectId);
  revalidatePath(adminProject);
  revalidatePath(clientProject);
}

export async function updateStageSummaryAction(formData: FormData) {
  const clientId = String(formData.get('client_id') || '');
  const projectId = String(formData.get('project_id') || '');
  const stageId = String(formData.get('stage_id') || '');
  const summary = String(formData.get('summary') || '');
  if (!projectId || !stageId) return;

  const { supabase } = await requireAdmin();
  await supabase
    .from('stages')
    .update({ admin_summary: summary.length > 0 ? summary : null })
    .eq('id', stageId);

  const { adminProject, clientProject } = pathsFor(clientId, projectId);
  revalidatePath(adminProject);
  revalidatePath(clientProject);
}
