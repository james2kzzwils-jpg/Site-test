// Shared stage helpers used by admin and client project views.
//
// We mirror the DB enums here so the UI can render in a sensible order
// without an extra query, and so the "advance to next" action has a
// canonical step list.

export const STAGE_ORDER = [
  'discovery',
  'mood',
  'animatic',
  'lookdev',
  'final',
] as const;

export type StageKind = (typeof STAGE_ORDER)[number];

export type ProjectStatus = StageKind | 'archived';

export type StageState =
  | 'pending'
  | 'in_review'
  | 'client_approved'
  | 'changes_requested'
  | 'approved';

export interface StageRow {
  id: string;
  kind: StageKind;
  order_index: number;
  title: string;
  deliverable: string | null;
  admin_summary: string | null;
  state: StageState;
}

// Pretty labels for the stepper. Keep these short — they live in a
// small mono row.
export const STAGE_LABELS: Record<StageKind, string> = {
  discovery: 'Discovery',
  mood: 'Mood',
  animatic: 'Animatic',
  lookdev: 'Lookdev',
  final: 'Final',
};

// Longer labels for the redesigned stage-stepper circles.
export const STAGE_LONG_LABELS: Record<StageKind, string> = {
  discovery: 'Discovery Call',
  mood: 'Concept Creation',
  animatic: 'Rough Animatic',
  lookdev: 'Color / Mood Comp',
  final: 'Final Render',
};

// Returns the next stage kind after `current`, or null when `current`
// is the last stage (the caller should move project.status to
// 'archived' in that case).
export function nextStageKind(current: StageKind): StageKind | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx < 0 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

// Returns the previous stage kind before `current`, or null if already
// at the first stage.
export function prevStageKind(current: StageKind): StageKind | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return STAGE_ORDER[idx - 1];
}

// Renders the visual state for a stage given the project status. We
// keep this pure so both server and client components can call it.
export type StageDisplayState =
  | 'approved'         // stage.state === 'approved'
  | 'client_approved'  // client approved but admin hasn't confirmed yet
  | 'current'          // stage.kind === project.status (and not approved)
  | 'past'             // earlier than the current stage but not approved yet
  | 'future';          // later than the current stage

export function computeDisplayState(
  stage: StageRow,
  projectStatus: ProjectStatus
): StageDisplayState {
  if (stage.state === 'approved') return 'approved';
  if (stage.state === 'client_approved') return 'client_approved';
  if (projectStatus === 'archived') return 'past';

  const currentIdx = STAGE_ORDER.indexOf(projectStatus as StageKind);
  const stageIdx = STAGE_ORDER.indexOf(stage.kind);

  if (stageIdx === currentIdx) return 'current';
  if (stageIdx < currentIdx) return 'past';
  return 'future';
}
