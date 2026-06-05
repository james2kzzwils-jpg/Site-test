'use client';
import { useOptimistic, useState, useTransition } from 'react';
import { addTaskAction, toggleTaskAction, deleteTaskAction, updateTaskAction } from '@/lib/portal/stage-task-actions';
export interface TaskItem {
  id: string; title: string; assignee: string | null; completed: boolean;
  completed_at: string | null; order_index: number; created_at: string;
}
interface StageTaskListProps {
  stageId: string; clientId: string | null; projectId: string;
  tasks: TaskItem[]; role: 'admin' | 'client';
  labels: { title: string; add: string; placeholder: string; assignee: string; delete: string; empty: string; save: string; cancel: string; };
}
export default function StageTaskList({ stageId, clientId, projectId, tasks, role, labels }: StageTaskListProps) {
  const [optimisticTasks, addOpt] = useOptimistic(tasks, (s, nt: TaskItem) => [...s, nt].sort((a, b) => a.order_index - b.order_index));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const fd = new FormData(); fd.set('stage_id', stageId); fd.set('title', newTitle.trim());
    fd.set('assignee', newAssignee.trim()); if (clientId) fd.set('client_id', clientId); fd.set('project_id', projectId);
    const temp: TaskItem = { id: `temp-${Date.now()}`, title: newTitle.trim(), assignee: newAssignee.trim() || null, completed: false, completed_at: null, order_index: optimisticTasks.length, created_at: new Date().toISOString() };
    startTransition(async () => { addOpt(temp); setNewTitle(''); setNewAssignee(''); setIsAdding(false); await addTaskAction(fd); });
  };
  const handleToggle = (taskId: string, current: boolean) => {
    const fd = new FormData(); fd.set('task_id', taskId); fd.set('completed', current ? 'false' : 'true');
    if (clientId) fd.set('client_id', clientId); fd.set('project_id', projectId);
    startTransition(() => toggleTaskAction(fd));
  };
  const handleDelete = (taskId: string) => {
    const fd = new FormData(); fd.set('task_id', taskId); if (clientId) fd.set('client_id', clientId); fd.set('project_id', projectId);
    startTransition(() => deleteTaskAction(fd));
  };
  const handleUpdate = (taskId: string, title: string, assignee: string) => {
    const fd = new FormData(); fd.set('task_id', taskId); fd.set('title', title); fd.set('assignee', assignee);
    if (clientId) fd.set('client_id', clientId); fd.set('project_id', projectId);
    startTransition(async () => { await updateTaskAction(fd); setEditingId(null); });
  };
  const doneCount = optimisticTasks.filter(t => t.completed).length;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55">
        <span>{labels.title}</span><span>{doneCount}/{optimisticTasks.length}</span>
      </div>
      {optimisticTasks.length === 0 && !isAdding ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/35">{labels.empty}</p>
      ) : (
        <ul className="flex flex-col gap-[2px]">
          {optimisticTasks.map(task => (
            <li key={task.id} className="group flex items-start gap-2 text-[13px] leading-[1.6]">
              <input type="checkbox" checked={task.completed} onChange={() => handleToggle(task.id, task.completed)} className="mt-[4px] accent-[var(--accent)] shrink-0" />
              {editingId === task.id && role === 'admin' ? (
                <EditForm task={task} labels={labels} onSave={(t, a) => handleUpdate(task.id, t, a)} onCancel={() => setEditingId(null)} />
              ) : (
                <div className="flex-1 min-w-0">
                  <span className={`${task.completed ? 'line-through text-[var(--foreground)]/35' : ''} cursor-pointer`} onClick={() => role === 'admin' && setEditingId(task.id)}>{task.title}</span>
                  {task.assignee ? <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--foreground)]/45">→ {task.assignee}</span> : null}
                </div>
              )}
              {role === 'admin' && editingId !== task.id ? (
                <button type="button" onClick={() => handleDelete(task.id)} className="shrink-0 font-mono text-[10px] text-[var(--foreground)]/25 opacity-0 group-hover:opacity-100 hover:text-[var(--accent)] transition-opacity">×</button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {isAdding ? (
        <form onSubmit={e => { e.preventDefault(); handleAdd(); }} className="flex flex-col gap-2 border border-[var(--hairline)] p-3">
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={labels.placeholder} className="border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]" />
          <input value={newAssignee} onChange={e => setNewAssignee(e.target.value)} placeholder={labels.assignee} className="border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]" />
          <div className="flex gap-2">
            <button type="submit" disabled={!newTitle.trim() || isPending} className="border border-[var(--accent)] bg-[var(--accent)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--background)] disabled:opacity-40">{labels.save}</button>
            <button type="button" onClick={() => setIsAdding(false)} className="border border-[var(--hairline)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--foreground)]/55">{labels.cancel}</button>
          </div>
        </form>
      ) : role === 'admin' ? (
        <button type="button" onClick={() => setIsAdding(true)} className="self-start border border-dashed border-[var(--hairline)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/45 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">+ {labels.add}</button>
      ) : null}
    </div>
  );
}
function EditForm({ task, labels, onSave, onCancel }: { task: TaskItem; labels: StageTaskListProps['labels']; onSave: (title: string, assignee: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(task.title);
  const [assignee, setAssignee] = useState(task.assignee ?? '');
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(title.trim(), assignee.trim()); }} className="flex flex-col gap-1 flex-1">
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} className="border border-[var(--hairline)] bg-transparent px-2 py-1 text-[13px] outline-none focus:border-[var(--accent)]" />
      <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder={labels.assignee} className="border border-[var(--hairline)] bg-transparent px-2 py-1 text-[11px] outline-none focus:border-[var(--accent)]" />
      <div className="flex gap-2">
        <button type="submit" className="border border-[var(--accent)] bg-[var(--accent)] px-2 py-[2px] font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--background)]">{labels.save}</button>
        <button type="button" onClick={onCancel} className="border border-[var(--hairline)] px-2 py-[2px] font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--foreground)]/55">{labels.cancel}</button>
      </div>
    </form>
  );
}