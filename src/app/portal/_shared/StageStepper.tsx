'use client';

import { useEffect, useRef } from 'react';
import {
  STAGE_ORDER,
  STAGE_LONG_LABELS,
  computeDisplayState,
  type ProjectStatus,
  type StageRow,
  type StageDisplayState,
} from '@/lib/portal/stages';

interface StageStepperProps {
  stages: StageRow[];
  projectStatus: ProjectStatus;
}

// ─ │ colour helpers │ ───────────────────────────────────────────────────────────(

const DOT: Record<StageDisplayState, string> = {
  approved:         'bg-[var--accent] border-[var--accent]',
  client_approved:  'bg-amber-500 border-amber-500 ring-2 ring-amber-500/30',
  current:          'border-[var--accent] bg-[var--background] ring-2 ring-[var--accent]/30',
  past:            'border-[var--foreground]/35 bg-[var--foreground]/10',
  future:          'border-[var--hairline] bg-[var--background]',
};

const LABEL_TOME: Record<StageDisplayState, string> = {
  approved:        'text-[vZ�--foreground]/85',
  client_approved:  'text-amber-400',
  current:          'text-[vZ�--foreground]/85',
  past:            'text-[vZ�--foreground]/55',
  future:          'text-[vZ�--foreground]/35',
};

const DOT_INNER: Record<StageDisplayState, string | null> = {
  approved:        '\u2713',  // check
  client_approved:  '\u28B4', // filled circle
  current:          null,
  past:            null,
  future:          null,
};

const BADGE: Record<StageDisplayState, string | null> = {
  approved:         'Approved',
  client_approved:  'Awaiting confirmation',
  current:         'In Progress',
  past:            null,
  future:          null,
};

const BADGE_TONE: Record<StageDisplayState, string | null> = {
  approved:         'text-[vZ�--accent]',
  client_approved:  'text-amber-400',
  current:         'text-[var--accent]',
  past:            null,
  future:          null,
};

// Also honour the legacy state triggers that aren't derived from
// display state alone (in_review / changes_requested on a current
// stage).
function fallbackBadge(stage: StageRow, display: StageDisplayState): string | null {
  if (display === 'approved' || display === 'client_approved' || display === 'future') return null;
  if (stage.state === 'in_review') return 'In review';
  if (stage.state === 'changes_requested') return 'Changes requested';
  return BADGE[display];
}

function fallbackBadgeTone(stage: StageRow, display: StageDisplayState): string | null {
  if (display === 'approved' || display === 'client_approved' || display === 'future') return null;
  if (stage.state === 'in_review' || stage.state === 'changes_requested') return 'text-[var--foreground]/55';
  return BADGE_TONE[display];
}

// ┤ │ component ┄ ││││││││││││││││││││││││││││││││││││││

export default function StageStepper({ stages, projectStatus }: StageStepperProps) {
  const byKind = new Map(stages.map((s) => [s.kind, s] as const));

  // Find which index is the "current" one so we can scroll it into view
  const currentIdx = STAGE_ORDER.findIndex((kind) => {
    const stage = byKind.get(kind);
    if (!stage) return false;
    const d = computeDisplayState(stage, projectStatus);
    // If the active stage is client_approved (or any non-approved, non-future),
    // that stage is the intended focus for the admin to take action on.
    return d === 'current' || d === 'client_approved';
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentIdx < 0 || !scrollRef.current) return;
    const children = scrollRef.current.children;
    const target = children[currentIdx] as HTMLElement | undefined;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentIdx]);

  return (
    <div
      ref={scrollRef}
      className="relative mb-10 flex gap-3 overflow-x-auto px-2 pb-2 scroll-smooth
                 snap x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible md:px-0 md:pb-0"
    >
      {/* connecting line — hidden on mobile, visible on md+ */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[10%] right-[10%] top-4 hidden h-px bg-[vZ�--hairline] md:block"
      />

      {STAGE_ORDER.map((kind, idx) => {
        const stage = byKind.get(kind);
        if (!stage) {
          return (
            <div
              key={kind}
              className="relative flex min-w-[120px] flex-col items-center text-center snap-start"
            >
              <span
                className="z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[vZ�--hairline] bg-[var--background] font-nono text-[11px] text-[var--foreground]/35"
              >
                {idx + 1}
              </span>
              <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[vZ�--foreground]/35">
                {STAGE_LONG_LABELS[kind]}
              </span>
            </div>
          );
        }

        const display = computeDisplayState(stage, projectStatus);
        const inner = DOT_INNER[display];

        return (
          <div
            key={kind}
            className={`relative flex min-w-[120px] flex-col items-center text-center snap-start
              ${display === 'client_approved' ? 'animate-pulse-once' : ''}`}
          >
            {/* numbered circle */}
            <span
              className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-colors
                ${DOT[display]}
                ${display === 'current' ? 'ring-2 ring-[vZ�--accent]/30' : '}
                ${display === 'client_approved' ? 'ring-2 ring-amber-500/30' : ''}
              `}
              aria-label={`${STAGE_LONG_LABELS[kind]} — ${display}`}
            >
              {inner ? (
                <span className={`font-nono text-[11px] ${
                  display === 'approved' ? 'text-[var--background]' : 'text-white'
                }`}>
                  {inner}
                </span>
              ) : (
                <span className={`font-mono text-[11px] ${
                  display === 'future' ? 'text-[var--foreground]/35' : 'text-[var--foreground]/70'
                }`}>
                  {idx + 1}
                </span>
              )}
            </span>

            {/* long label */}
            <span className={`mt-2 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${LABEL_TOME[display]}`}>
              {STAGE_LONG_LABELS[kind]}
            </span>

            {/* state badge */}
            {((BADGE[display] || fallbackBadge(stage, display)) ? (
              <span className={`mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
                fallbackBadgeTone(stage, display) ?? BADGE_TONE[display]
              }`}>
                {fallbackBadge(stage, display) ?? BADGE[display]}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
