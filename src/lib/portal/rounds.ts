// Round/billing rules for the portal.
//
// Mirrors the About section copy on the marketing site:
//   - stages 1–4 (discovery / mood / animatic / lookdev): the first
//     round is included in the project cost; every later round on
//     that stage is billable
//   - stage 5 (final): every round is billable
//
// A "round" is opened lazily — the first comment from anyone on a
// stage opens round 1. The admin closes the round (e.g. when feedback
// is incorporated and a new deliverable is sent) which clears the way
// for round 2.

import type { StageKind } from '@/lib/portal/stages';

export interface RoundRow {
  id: string;
  stage_id: string;
  index: number;
  billable: boolean;
  opened_at: string;
  closed_at: string | null;
  closed_by: string | null;
}

/**
 * Compute whether round `index` on a given stage should be billable.
 * Round indices are 1-based.
 */
export function isRoundBillable(stage: StageKind, index: number): boolean {
  if (stage === 'final') return true;
  return index > 1;
}

/**
 * Title for a round in the UI, localized via a passed-in translator.
 * Returns e.g. "Round 1 · included" or "Round 2 · billable".
 */
export function roundLabel(
  stage: StageKind,
  index: number,
  labels: { round: string; included: string; billable: string }
): string {
  const billable = isRoundBillable(stage, index);
  const pill = billable ? labels.billable : labels.included;
  return `${labels.round} ${index} · ${pill}`;
}
