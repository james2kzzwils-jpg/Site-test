'use server';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
export async function postDiscussionAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  const stageId = String(formData.get('stage_id') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  const clientId = String(formData.get('client_id') ?? '');
  const projectId = String(formData.get('project_id') ?? '');
  if (!stageId || !body) return { ok: false, error: 'Missing fields' };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const authorRole = profile?.role === 'admin' ? 'admin' : 'client';
  const { error } = await supabase.from('stage_discussions').insert({ stage_id: stageId, author_id: user.id, author_role: authorRole, body });
  if (error) return { ok: false, error: error.message };
  const cmp = clientId ? `/portal/admin/clients/${clientId}/projects/${projectId}` : '';
  if (cmp) revalidatePath(cmp);
  revalidatePath(`/portal/client/projects/${projectId}`);
  return { ok: true };
}
export async function deleteDiscussionAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const discussionId = String(formData.get('discussion_id') ?? '');
  const clientId = String(formData.get('client_id') ?? '');
  const projectId = String(formData.get('project_id') ?? '');
  if (!discussionId) return;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const isAdmin = profile?.role === 'admin';
  const { data: msg } = await supabase.from('stage_discussions').select('author_id').eq('id', discussionId).maybeSingle();
  if (!msg) return;
  if (msg.author_id !== user.id && !isAdmin) return;
  await supabase.from('stage_discussions').delete().eq('id', discussionId);
  const cmp = clientId ? `/portal/admin/clients/${clientId}/projects/${projectId}` : '';
  if (cmp) revalidatePath(cmp);
  revalidatePath(`/portal/client/projects/${projectId}`);
}