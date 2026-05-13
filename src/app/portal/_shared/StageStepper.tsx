import {
  STAGE_ORDER,
  STAGE_LABELS,
  computeDisplayState,
  type ProjectStatus,
  type StageRow,
} from '@/lib/portal/stages';

interface StageStepperProps {
  stages: StageRow[];
  projectStatus: ProjectStatus;
}

// Horizontal stepper across the five stages. Visual hierarchy:
//   approved  → filled accent dot + bright label
//   current   → outlined accent ring + bright label
//   past      → dim hairline dot (touched but not approved)
//   future    → faint dot + 35% label opacity (clearly inactive)
export default function StageStepper({ stages, projectStatus }: StageStepperProps) {
  // Index stages by kind so we can render them in canonical order
  // even if the DB returned them in a different sort.
  const byKind = new Map(stages.map((s) => [s.kind, s] as const));

  return (
    <div className="relative mb-10 grid grid-cols-5 gap-3">
      <div
        aria-hidden
        className="pointer-events-none absolute left-[10%] right-[10%] top-3 h-px bg-[var(--hairline)]"
      />

      {STAGE_ORDER.map((kind, idx) => {
        const stage = byKind.get(kind);
        if (!stage) {
          return (
            <div key={kind} className="relative flex flex-col items-center text-center">
              <span className="z-10 h-6 w-6 rounded-full border border-[var(--hairline)] bg-[var(--background)]" />
              <span className="mt-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/35">
                {String(idx + 1).padStart(2, '0')} · {STAGE_LABELS[kind]}
              </span>
            </div>
          );
        }

        const display = computeDisplayState(stage, projectStatus);

        const dot = (() => {
          switch (display) {
            case 'approved':
              return 'bg-[var(--accent)] border-[var(--accent)]';
            case 'current':
              return 'border-[var(--accent)] bg-[var(--background)] ring-2 ring-[var(--accent)]/30';
            case 'past':
              return 'border-[var(--foreground)]/35 bg-[var(--foreground)]/10';
            case 'future':
            default:
              return 'border-[var(--hairline)] bg-[var(--background)]';
          }
        })();

        const labelTone =
          display === 'future'
            ? 'text-[var(--foreground)]/35'
            : display === 'past'
            ? 'text-[var(--foreground)]/55'
            : 'text-[var(--foreground)]/85';

        const stateBadge =
          display === 'approved'
            ? 'Approved'
            : stage.state === 'in_review'
            ? 'In review'
            : stage.state === 'changes_requested'
            ? 'Changes'
            : display === 'current'
            ? 'Current'
            : null;

        return (
          <div
            key={kind}
            className="relative flex flex-col items-center text-center"
          >
            <span
              className={`z-10 h-6 w-6 rounded-full border ${dot} flex items-center justify-center`}
              aria-label={`${STAGE_LABELS[kind]} — ${display}`}
            >
              {display === 'approved' ? (
                <span className="font-mono text-[10px] text-[var(--background)]">✓</span>
              ) : null}
            </span>
            <span className={`mt-3 font-mono text-[10px] uppercase tracking-[0.24em] ${labelTone}`}>
              {String(idx + 1).padStart(2, '0')} · {STAGE_LABELS[kind]}
            </span>
            {stateBadge ? (
              <span
                className={`mt-1 font-mono text-[9px] uppercase tracking-[0.16em] ${
                  display === 'approved'
                    ? 'text-[var(--accent)]'
                    : display === 'current'
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--foreground)]/45'
                }`}
              >
                {stateBadge}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
