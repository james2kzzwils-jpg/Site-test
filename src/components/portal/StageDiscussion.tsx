'use client';
import { useRef, useState, useTransition } from 'react';
import { postDiscussionAction, deleteDiscussionAction } from '@/lib/portal/stage-discussion-actions';
export interface DiscussionComment {
  id: string; author_id: string; author_role: 'admin' | 'client'; body: string; created_at: string;
}
interface StageDiscussionProps {
  stageId: string; clientId: string | null; projectId: string;
  comments: DiscussionComment[]; role: 'admin' | 'client'; currentUserId: string | null;
  labels: { title: string; placeholder: string; send: string; sending: string; empty: string; studio: string; client: string; delete: string; };
}
export default function StageDiscussion({ stageId, clientId, projectId, comments, role, currentUserId, labels }: StageDiscussionProps) {
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();
  const sorted = [...comments].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!body.trim()) return;
    const fd = new FormData(); fd.set('stage_id', stageId); fd.set('body', body.trim());
    if (clientId) fd.set('client_id', clientId); fd.set('project_id', projectId);
    startTransition(async () => { await postDiscussionAction(fd); setBody(''); });
  };
  const handleDelete = (discussionId: string) => {
    const fd = new FormData(); fd.set('discussion_id', discussionId);
    if (clientId) fd.set('client_id', clientId); fd.set('project_id', projectId);
    startTransition(() => deleteDiscussionAction(fd));
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">{labels.title}</p>
      {sorted.length === 0 ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/35">{labels.empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map(c => {
            const isStudio = c.author_role === 'admin';
            const stamp = new Date(c.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
            const canDelete = role === 'admin' || c.author_id === currentUserId;
            return (
              <li key={c.id} className="flex flex-col gap-1 border-l border-[var(--hairline)] pl-3">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]">
                  <span className={'border px-2 py-[2px] ' + (isStudio ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--hairline)] text-[var(--foreground)]/65')}>{isStudio ? labels.studio : labels.client}</span>
                  <span className="text-[var(--foreground)]/35"> · {stamp}</span>
                  {canDelete ? <button type="button" onClick={() => handleDelete(c.id)} className="ml-auto font-mono text-[10px] text-[var(--foreground)]/25 hover:text-[var(--accent)] transition-colors">{labels.delete}</button> : null}
                </div>
                <p className="whitespace-pre-wrap text-[13px] leading-[1.7] text-[var(--foreground)]/82">{c.body}</p>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={2} placeholder={labels.placeholder} className="resize-y border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] leading-[1.6] outline-none focus:border-[var(--accent)]" />
        <button type="submit" disabled={isPending || !body.trim()} className="self-start border border-[var(--accent)] bg-[var(--accent)] px-4 py-[6px] font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-40">{isPending ? labels.sending : labels.send}</button>
      </form>
    </div>
  );
}