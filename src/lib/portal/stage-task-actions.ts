'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') throw new Error('Forbidden');

  return { supabase, userId: user.id };
}

function pathsFor(clientId: string, projectId: string) {
  return {
    adminProject: `/portal/admin/clients/${clientId}/projects/${projectId}`,
    clientProject: `/portal/client/${projectId}`,
  };
}

export async function addTaskAction(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const stageId = String(formData.get('stage_id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const assignee = String(formData.get('assignee') ?? '').trim();
  const clientId = String(formData.get('client_id') ?? '');
  const projectId = String(formData.get('project_id') ?? '');
  if (!stageId || !title || !clientId || !projectId) return;

  const { data: maxRow } = await supabase
    .from('stage_tasks')
    .select('order_index')
    .eq('stage_id', stageId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextIndex = (maxRow?.order_index ?? -1) + 1;

  await supabase.from('stage_tasks').insert({
    stage_id: stageId,
    title,
    assignee: assignee || null,
    created_by: userId,
    order_index: nextIndex,
  });

  const paths = pathsFor(clientId, projectId);
  revalidatePath(paths.adminProject);
  revalidatePath(paths.clientProject);
}

export async function toggleTaskAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const taskId = String(formData.get('task_id') ?? '');
  const completed = formData.get('completed') === 'true';
  const clientId = String(formData.get('client_id') ?? '');
  const projectId = String(formData.get('project_id') ?? '');
  if (!taskId || !clientId || !projectId) return;

  await supabase
    .from('stage_tasks')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId);

  const paths = pathsFor(clientId, projectId);
  revalidatePath(paths.adminProject);
  revalidatePath(paths.clientProject);
}

export async function deleteTaskAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const taskId = String(formData.get('task_id') ?? '');
  const clientId = String(formData.get('client_id') ?? '');
  const projectId = String(formData.get('project_id') ?? '');
  if (!taskId || !clientId || !projectId) return;

  await supabase.from('stage_tasks').delete().eq('id', taskId);

  const paths = pathsFor(clientId, projectId);
  revalidatePath(paths.adminProject);
  revalidatePath(paths.clientProject);
}

export async function updateTaskAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  const taskId = String(formData.get('task_id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const assignee = String(formData.get('assignee') ?? '').trim();
  const clientId = String(formData.get('client_id') ?? '');
  const projectId = String(formData.get('project_id') ?? '');
  if (!taskId || !title || !clientId || !projectId) return;

  await supabase
    .from('stage_tasks')
    .update({ title, assignee: assignee || null })
    .eq('id', taskId);

  const paths = pathsFor(clientId, projectId);
  revalidatePath(paths.adminProject);
  revalidatePath(paths.clientProject);
}
