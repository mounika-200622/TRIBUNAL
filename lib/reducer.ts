import type { Claim, StreamEvent } from "./types";

/**
 * The whole UI is a fold over the event log. Keeping this pure and shared means
 * the mock stream and the live engine are indistinguishable to every component,
 * and either half of the team can work without the other.
 */

export type TribunalState = {
  claims: Claim[];
  trustScore: number | null;
  done: boolean;
  error: string | null;
};

export const initialState: TribunalState = {
  claims: [],
  trustScore: null,
  done: false,
  error: null,
};

export function reduce(state: TribunalState, e: StreamEvent): TribunalState {
  switch (e.type) {
    case "claims":
      return { ...state, claims: e.claims };

    case "claim_status":
      return {
        ...state,
        claims: state.claims.map((c) =>
          c.id === e.claimId ? { ...c, status: e.status } : c,
        ),
      };

    case "source":
      return {
        ...state,
        claims: state.claims.map((c) =>
          c.id === e.claimId
            ? // Guard against a duplicate id arriving twice on retry.
              c.sources.some((s) => s.id === e.source.id)
              ? c
              : { ...c, sources: [...c.sources, e.source] }
            : c,
        ),
      };

    case "argument":
      return {
        ...state,
        claims: state.claims.map((c) =>
          c.id === e.claimId
            ? c.arguments.some((a) => a.id === e.argument.id)
              ? c
              : { ...c, arguments: [...c.arguments, e.argument] }
            : c,
        ),
      };

    case "verdict":
      return {
        ...state,
        claims: state.claims.map((c) =>
          c.id === e.claimId
            ? {
                ...c,
                status: "done",
                verdict: e.verdict,
                confidence: e.confidence,
                failureType: e.failureType,
                reasoning: e.reasoning,
                disagreement: e.disagreement,
              }
            : c,
        ),
      };

    case "done":
      return { ...state, done: true, trustScore: e.trustScore };

    case "error":
      return { ...state, error: e.message, done: true };
  }
}

/** Convenience selectors so components don't re-derive these. */
export const counts = (s: TribunalState) => ({
  total: s.claims.length,
  supported: s.claims.filter((c) => c.verdict === "supported").length,
  refuted: s.claims.filter((c) => c.verdict === "refuted").length,
  unverifiable: s.claims.filter((c) => c.verdict === "unverifiable").length,
  settled: s.claims.filter((c) => c.status === "done").length,
});

/** Flat list of every argument across claims, in arrival order. */
export const allArguments = (s: TribunalState) =>
  s.claims.flatMap((c) => c.arguments);
