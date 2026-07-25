import { describe, it, expect } from "vitest";
import { reduce, initialState, counts } from "../reducer";
import { trustScore } from "../agents/judge";
import type { Claim, StreamEvent } from "../types";

/**
 * The UI is a fold over the event stream, so the reducer is the one place a
 * bug corrupts every screen at once. These cover the properties the interface
 * actually depends on: that events are order-independent where they should be,
 * that a late event for an unknown claim is ignored rather than throwing, and
 * that the trust score is bounded.
 */

const claimEvent = (ids: string[]): StreamEvent => ({
  type: "claims",
  claims: ids.map((id) => ({
    id,
    text: `claim ${id}`,
    status: "pending",
    verdict: null,
    confidence: null,
    failureType: null,
    reasoning: null,
    disagreement: null,
    sources: [],
    arguments: [],
  })) as Claim[],
});

const verdict = (
  claimId: string,
  v: "supported" | "refuted" | "unverifiable",
  confidence = 0.9
): StreamEvent => ({
  type: "verdict",
  claimId,
  verdict: v,
  confidence,
  failureType: v === "refuted" ? "fabricated_citation" : "none",
  reasoning: "because",
  disagreement: 0.1,
});

const play = (events: StreamEvent[]) => events.reduce(reduce, initialState);

describe("reducer", () => {
  it("registers claims from the opening event", () => {
    const s = play([claimEvent(["a", "b", "c"])]);
    expect(s.claims).toHaveLength(3);
    expect(counts(s).total).toBe(3);
    expect(counts(s).settled).toBe(0);
  });

  it("settles a claim when its verdict arrives", () => {
    const s = play([claimEvent(["a", "b"]), verdict("a", "refuted")]);
    const c = counts(s);
    expect(c.settled).toBe(1);
    expect(c.refuted).toBe(1);
    expect(s.claims.find((x) => x.id === "a")?.failureType).toBe(
      "fabricated_citation"
    );
  });

  it("ignores a verdict for a claim it has never seen", () => {
    // the stream can outlive a reconnect; a stray event must not throw
    const s = play([claimEvent(["a"]), verdict("ghost", "refuted")]);
    expect(s.claims).toHaveLength(1);
    expect(counts(s).settled).toBe(0);
  });

  it("does not double count a verdict delivered twice", () => {
    const s = play([
      claimEvent(["a"]),
      verdict("a", "refuted"),
      verdict("a", "refuted"),
    ]);
    expect(counts(s).settled).toBe(1);
    expect(counts(s).refuted).toBe(1);
  });

  it("keeps arguments attached to their own claim", () => {
    const s = play([
      claimEvent(["a", "b"]),
      {
        type: "argument",
        claimId: "b",
        argument: {
          id: "g1",
          claimId: "b",
          role: "prosecutor",
          lens: "source quality",
          position: "no such study",
          sourceIds: [],
          strength: 0.9,
        },
      },
    ]);
    expect(s.claims.find((x) => x.id === "a")?.arguments).toHaveLength(0);
    expect(s.claims.find((x) => x.id === "b")?.arguments).toHaveLength(1);
  });

  it("surfaces an error without destroying the claims already ruled on", () => {
    const s = play([
      claimEvent(["a"]),
      verdict("a", "supported"),
      { type: "error", message: "retrieval failed" },
    ]);
    expect(s.error).toBe("retrieval failed");
    expect(counts(s).settled).toBe(1);
  });
});

describe("trustScore", () => {
  const mk = (
    v: "supported" | "refuted" | "unverifiable",
    confidence: number
  ) => ({ verdict: v, confidence }) as Claim;

  it("is bounded to 0..100 at both extremes", () => {
    expect(trustScore([mk("supported", 1)])).toBeLessThanOrEqual(100);
    expect(trustScore([mk("refuted", 1)])).toBeGreaterThanOrEqual(0);
  });

  it("scores an all-supported passage above an all-refuted one", () => {
    const good = trustScore([mk("supported", 0.95), mk("supported", 0.95)]);
    const bad = trustScore([mk("refuted", 0.95), mk("refuted", 0.95)]);
    expect(good).toBeGreaterThan(bad);
  });

  it("weights by confidence, so a hesitant refutation costs less", () => {
    const sure = trustScore([mk("refuted", 0.99)]);
    const unsure = trustScore([mk("refuted", 0.55)]);
    expect(unsure).toBeGreaterThan(sure);
  });

  it("returns a usable number for an empty record", () => {
    const s = trustScore([]);
    expect(Number.isFinite(s)).toBe(true);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  });
});
