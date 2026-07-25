/**
 * THE CONTRACT — frozen. Both halves of the team build against this.
 *
 * The engine (app/api, lib/agents) emits StreamEvents.
 * The interface (app/components) folds them into Claim[] and renders.
 *
 * Do not change a field without telling the other person. If something is
 * missing, add — never rename or remove.
 */

export type VerdictKind = "supported" | "refuted" | "unverifiable";

/**
 * We never say merely "false". Naming the failure mode is the whole point —
 * it's what separates this from a yes/no fact checker.
 */
export type FailureType =
  | "fabricated_citation"
  | "misattribution"
  | "overgeneralization"
  | "stale_fact"
  | "conflated_entity"
  | "unsupported_causal"
  | "common_misconception"
  | "none";

export type Stance = "supports" | "contradicts" | "neutral";

export type Source = {
  id: string;
  url: string;
  /** Display domain, e.g. "nature.com" — the UI shows this, not the full URL. */
  domain: string;
  title: string;
  snippet: string;
  stance: Stance;
  /** 0..1 — how much weight the judge gave this source. */
  credibility: number;
};

/** One agent's move in the trial. */
export type Argument = {
  id: string;
  claimId: string;
  role: "prosecutor" | "defense";
  /** The lens this agent was assigned, e.g. "temporal staleness". */
  lens: string;
  /** The argument itself, one or two sentences. */
  position: string;
  sourceIds: string[];
  /** 0..1 — how strong the agent believes its own case is. */
  strength: number;
};

export type ClaimStatus =
  | "pending"
  | "retrieving"
  | "arguing"
  | "judging"
  | "done";

export type Claim = {
  id: string;
  /** The atomic claim, quoted from the input. */
  text: string;
  status: ClaimStatus;
  verdict: VerdictKind | null;
  /** 0..1 */
  confidence: number | null;
  failureType: FailureType | null;
  /** The judge's ruling, one paragraph. */
  reasoning: string | null;
  /** 0..1 — how much the prosecutors disagreed. High = real uncertainty. */
  disagreement: number | null;
  sources: Source[];
  arguments: Argument[];
};

/**
 * Everything the server streams, in the order it happens. The UI is a pure
 * function of the accumulated event log — which is why the mock and the real
 * backend are interchangeable.
 */
export type StreamEvent =
  | { type: "claims"; claims: Claim[] }
  | { type: "claim_status"; claimId: string; status: ClaimStatus }
  | { type: "source"; claimId: string; source: Source }
  | { type: "argument"; claimId: string; argument: Argument }
  | {
      type: "verdict";
      claimId: string;
      verdict: VerdictKind;
      confidence: number;
      failureType: FailureType;
      reasoning: string;
      disagreement: number;
    }
  | { type: "done"; trustScore: number }
  | { type: "error"; message: string };

/** Human-readable labels for the taxonomy. The UI renders these on chips. */
export const FAILURE_LABELS: Record<FailureType, string> = {
  fabricated_citation: "Fabricated citation",
  misattribution: "Misattribution",
  overgeneralization: "Overgeneralization",
  stale_fact: "Stale fact",
  conflated_entity: "Conflated entity",
  unsupported_causal: "Unsupported causal leap",
  common_misconception: "Common misconception",
  none: "No failure found",
};

/** The four adversarial lenses. Each prosecutor gets exactly one. */
export const LENSES = [
  "source quality",
  "temporal staleness",
  "entity conflation",
  "logical leap",
] as const;
