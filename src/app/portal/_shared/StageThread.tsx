'use client';

// StageThread — the comment/round timeline for a single stage. Used on
// both the admin project page and the client project page.
//
// Each stage shows:
//   - the round counter ("Round N · included | billable") for the
//     currently-open round, plus all historical rounds as collapsed
//     summaries
//   - every comment inside each round (oldest first), labelled with
//     the author's role ("Studio" / "Client") since clients can't
//     read other profiles
//   - inline attachments rendered as thumbnails (images) or file pills
//     (anything else); clicking an image opens a basic full-screen
//     viewer
//   - a composer (textarea + file input + paste-from-clipboard)
//
// Uploads go in two steps so the bytes don't go through the Next.js
// server: client asks for a signed upload URL → PUTs the file to
// Supabase Storage → calls a finalize action to register the
// attachment in the `attachments` table.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
} from 'react';
import type { StageKind } from '@/lib/portal/stages';
import { isRoundBillable } from '@/lib/portal/rounds';
import {
  createUploadUrlAction,
  finalizeAttachmentAction,
  postCommentAction,
  closeRoundAction,
} from '@/lib/portal/thread-actions';

export interface ThreadAttachment {
  id: string;
  filename: string | null;
  mime_type: string | null;
  kind: 'image' | 'video' | 'document' | 'link' | 'other';
  signed_url: string | null;
  size_bytes: number | null;
  comment_id: string | null;
  stage_id: string | null;
}

export interface ThreadComment {
  id: string;
  body: string;
  author_role: 'admin' | 'client';
  /** Display name resolved from `profiles` when RLS allows it
   * (admin viewing any author; client viewing their own messages).
   * `null` falls back to the generic role label. */
  author_name: string | null;
  created_at: string;
  attachments: ThreadAttachment[];
}

export interface ThreadRound {
  id: string;
  index: number;
  billable: boolean;
  opened_at: string;
  closed_at: string | null;
  comments: ThreadComment[];
}

export interface StageThreadLabels {
  studio: string;
  client: string;
  round: string;
  included: string;
  billable: string;
  open: string;
  closed: string;
  empty: string;
  closeRound: string;
  composerPlaceholder: string;
  composerAttach: string;
  composerSend: string;
  composerSending: string;
  composerHint: string;
  uploading: string;
  uploadFailed: string;
  attachmentsLabel: string;
  pastedClipboard: string;
}

interface StageThreadProps {
  projectId: string;
  clientId: string | null;
  stageId: string;
  stageKind: StageKind;
  rounds: ThreadRound[];
  role: 'admin' | 'client';
  labels: StageThreadLabels;
}

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string | null;
}

export default function StageThread({
  projectId,
  clientId,
  stageId,
  stageKind,
  rounds,
  role,
  labels,
}: StageThreadProps) {
  const [body, setBody] = useState('');
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [viewer, setViewer] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sortedRounds = [...rounds].sort((a, b) => a.index - b.index);
  const openRound = sortedRounds.find((r) => r.closed_at === null) ?? null;
  const nextRoundIndex =
    openRound?.index ??
    (sortedRounds.length === 0 ? 1 : sortedRounds[sortedRounds.length - 1].index + 1);
  const nextRoundBillable = isRoundBillable(stageKind, nextRoundIndex);

  useEffect(() => {
    return () => {
      pending.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const accepted: PendingFile[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 25 * 1024 * 1024) continue;
      const isImage = file.type.startsWith('image/');
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      accepted.push({
        id,
        file,
        previewUrl: isImage ? URL.createObjectURL(file) : null,
      });
    }
    if (accepted.length === 0) return;
    setPending((prev) => [...prev, ...accepted]);
  }, []);

  const removePending = (id: string) => {
    setPending((prev) => {
      const next = prev.filter((p) => p.id !== id);
      const removed = prev.find((p) => p.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const it of items) {
      if (it.kind === 'file') {
        const f = it.getAsFile();
        if (f) {
          const ext = (f.type.split('/')[1] ?? 'png').toLowerCase();
          const named = new File([f], `clipboard-${Date.now()}.${ext}`, {
            type: f.type,
          });
          files.push(named);
        }
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      addFiles(files);
    }
  };

  const onDrop = (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt?.files && dt.files.length > 0) addFiles(dt.files);
  };

  const onDragOver = (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };

  const uploadOne = async (
    file: File
  ): Promise<{ storagePath: string; filename: string; mime: string; size: number } | null> => {
    const fd = new FormData();
    fd.set('project_id', projectId);
    fd.set('filename', file.name);
    const signed = await createUploadUrlAction(fd);
    if (!signed.ok) {
      setUploadError(signed.error ?? labels.uploadFailed);
      return null;
    }
    const putResp = await fetch(signed.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    if (!putResp.ok) {
      setUploadError(`${labels.uploadFailed} (${putResp.status})`);
      return null;
    }
    return {
      storagePath: signed.path,
      filename: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
    };
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!body.trim() && pending.length === 0) return;

    startTransition(async () => {
      setUploadError(null);

      // 1) Post the comment first so we have a comment_id to attach
      //    files to. If body is empty but attachments exist, use a
      //    non-breaking space so the row stays non-null.
      const commentBody = body.trim().length > 0 ? body.trim() : '\u00A0';
      const commentFd = new FormData();
      commentFd.set('project_id', projectId);
      commentFd.set('stage_id', stageId);
      commentFd.set('stage_kind', stageKind);
      commentFd.set('body', commentBody);
      if (clientId) commentFd.set('client_id', clientId);
      const commentResult = await postCommentAction(commentFd);
      if (!commentResult.ok) {
        setUploadError(commentResult.error ?? labels.uploadFailed);
        return;
      }
      const newCommentId = commentResult.commentId;

      // 2) Upload + finalize each attachment in sequence, binding
      //    every attachment row to the comment id we just got back
      //    from postCommentAction (B2 gap #1 fix).
      for (const p of pending) {
        const up = await uploadOne(p.file);
        if (!up) continue;
        const fin = new FormData();
        fin.set('project_id', projectId);
        fin.set('stage_id', stageId);
        fin.set('comment_id', newCommentId);
        fin.set('storage_path', up.storagePath);
        fin.set('filename', up.filename);
        fin.set('mime', up.mime);
        fin.set('size_bytes', String(up.size));
        if (clientId) fin.set('client_id', clientId);
        const ok = await finalizeAttachmentAction(fin);
        if (!ok.ok) {
          setUploadError(ok.error ?? labels.uploadFailed);
        }
      }

      setBody('');
      setPending((prev) => {
        prev.forEach((p) => {
          if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        });
        return [];
      });
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {sortedRounds.length === 0 ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/45">
          {labels.empty}
        </p>
      ) : (
        <ol className="flex flex-col gap-5">
          {sortedRounds.map((round) => (
            <li key={round.id} className="flex flex-col gap-3 border-l border-[var(--hairline)] pl-5">
              <RoundHeader round={round} stageKind={stageKind} labels={labels} />
              {round.comments.length === 0 ? null : (
                <ul className="flex flex-col gap-3">
                  {round.comments.map((c) => (
                    <CommentRow
                      key={c.id}
                      comment={c}
                      labels={labels}
                      onOpenImage={setViewer}
                    />
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}

      {role === 'admin' && openRound ? (
        <form action={closeRoundAction} className="self-start">
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="stage_id" value={stageId} />
          {clientId ? <input type="hidden" name="client_id" value={clientId} /> : null}
          <button
            type="submit"
            className="border border-[var(--hairline)] px-3 py-[6px] font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/55 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {labels.closeRound} · {labels.round} {openRound.index}
          </button>
        </form>
      ) : null}

      <form
        onSubmit={onSubmit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="flex flex-col gap-3 border border-dashed border-[var(--hairline)] p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/55">
            {labels.round} {nextRoundIndex} ·{' '}
            <span className={nextRoundBillable ? 'text-[var(--accent)]' : 'text-[var(--foreground)]/65'}>
              {nextRoundBillable ? labels.billable : labels.included}
            </span>
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/35">
            {labels.composerHint}
          </p>
        </div>
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onPaste={onPaste}
          rows={3}
          placeholder={labels.composerPlaceholder}
          className="resize-y border border-[var(--hairline)] bg-transparent px-3 py-2 text-[13px] leading-[1.6] outline-none focus:border-[var(--accent)]"
        />

        {pending.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {pending.map((p) => (
              <li
                key={p.id}
                className="relative flex items-center gap-2 border border-[var(--hairline)] px-2 py-1 text-[11px] text-[var(--foreground)]/70"
              >
                {p.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.previewUrl}
                    alt={p.file.name}
                    className="h-10 w-10 object-cover"
                  />
                ) : (
                  <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--foreground)]/45">
                    {(p.file.name.split('.').pop() ?? 'file').slice(0, 4)}
                  </span>
                )}
                <span className="max-w-[180px] truncate">{p.file.name}</span>
                <button
                  type="button"
                  onClick={() => removePending(p.id)}
                  className="ml-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/45 hover:text-[var(--accent)]"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {uploadError ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff6363]">
            {uploadError}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <label className="cursor-pointer border border-[var(--hairline)] px-3 py-[6px] font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/55 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
            {labels.composerAttach}
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
          <button
            type="submit"
            disabled={isPending || (body.trim().length === 0 && pending.length === 0)}
            className="border border-[var(--accent)] bg-[var(--accent)] px-4 py-[6px] font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? labels.composerSending : labels.composerSend}
          </button>
        </div>
      </form>

      {viewer ? (
        <button
          type="button"
          onClick={() => setViewer(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/85 p-6 backdrop-blur"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewer}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        </button>
      ) : null}
    </div>
  );
}

function RoundHeader({
  round,
  stageKind,
  labels,
}: {
  round: ThreadRound;
  stageKind: StageKind;
  labels: StageThreadLabels;
}) {
  const billable = isRoundBillable(stageKind, round.index);
  return (
    <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/55">
      <span className="text-[var(--accent)]">◆</span>
      <span>
        {labels.round} {round.index}
      </span>
      <span className={billable ? 'text-[var(--accent)]' : 'text-[var(--foreground)]/65'}>
        · {billable ? labels.billable : labels.included}
      </span>
      <span className="text-[var(--foreground)]/35">
        · {round.closed_at ? labels.closed : labels.open}
      </span>
    </div>
  );
}

function CommentRow({
  comment,
  labels,
  onOpenImage,
}: {
  comment: ThreadComment;
  labels: StageThreadLabels;
  onOpenImage: (url: string) => void;
}) {
  const isStudio = comment.author_role === 'admin';
  const stamp = new Date(comment.created_at).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const roleLabel = isStudio ? labels.studio : labels.client;
  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]">
        <span
          className={`border px-2 py-[2px] ${
            isStudio
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-[var(--hairline)] text-[var(--foreground)]/65'
          }`}
        >
          {roleLabel}
        </span>
        {comment.author_name ? (
          <span className="text-[var(--foreground)]/65 normal-case tracking-normal text-[11px]">
            {comment.author_name}
          </span>
        ) : null}
        <span className="text-[var(--foreground)]/35">· {stamp}</span>
      </div>
      {comment.body.trim().length > 0 ? (
        <p className="whitespace-pre-wrap text-[13px] leading-[1.7] text-[var(--foreground)]/82">
          {comment.body}
        </p>
      ) : null}
      {comment.attachments.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {comment.attachments.map((a) => (
            <AttachmentTile key={a.id} a={a} labels={labels} onOpenImage={onOpenImage} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function AttachmentTile({
  a,
  labels,
  onOpenImage,
}: {
  a: ThreadAttachment;
  labels: StageThreadLabels;
  onOpenImage: (url: string) => void;
}) {
  if (!a.signed_url) {
    return (
      <li className="border border-[var(--hairline)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/45">
        {a.filename ?? labels.attachmentsLabel}
      </li>
    );
  }
  if (a.kind === 'image') {
    return (
      <li>
        <button
          type="button"
          onClick={() => onOpenImage(a.signed_url!)}
          className="block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a.signed_url}
            alt={a.filename ?? ''}
            className="h-24 w-24 cursor-zoom-in border border-[var(--hairline)] object-cover transition-opacity hover:opacity-80"
            loading="lazy"
          />
        </button>
      </li>
    );
  }
  if (a.kind === 'video') {
    return (
      <li>
        <video
          src={a.signed_url}
          controls
          className="block max-h-48 max-w-full border border-[var(--hairline)]"
          preload="metadata"
        />
      </li>
    );
  }
  return (
    <li>
      <a
        href={a.signed_url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 border border-[var(--hairline)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--foreground)]/65 hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        {a.filename ?? labels.attachmentsLabel}
        <span aria-hidden="true">↗</span>
      </a>
    </li>
  );
}
