import type { StreamEvent, Claim } from "./types";

/**
 * A scripted trial that emits the exact events the real engine emits.
 *
 * This exists so the interface can be built end to end before the engine is
 * finished. When the real endpoint is ready, swap the source of events — the
 * reducer and every component stay identical.
 */

const CLAIMS: Claim[] = [
  {
    id: "c1",
    text: "The Great Wall of China is visible from space with the naked eye.",
    status: "pending",
    verdict: null,
    confidence: null,
    failureType: null,
    reasoning: null,
    disagreement: null,
    sources: [],
    arguments: [],
  },
  {
    id: "c2",
    text: "A 2019 Stanford study found that remote workers are 43% more productive.",
    status: "pending",
    verdict: null,
    confidence: null,
    failureType: null,
    reasoning: null,
    disagreement: null,
    sources: [],
    arguments: [],
  },
  {
    id: "c3",
    text: "Honey never spoils because of its low water content and acidity.",
    status: "pending",
    verdict: null,
    confidence: null,
    failureType: null,
    reasoning: null,
    disagreement: null,
    sources: [],
    arguments: [],
  },
];

/** The scripted event log, in order. */
export const MOCK_EVENTS: StreamEvent[] = [
  { type: "claims", claims: CLAIMS },

  // ── c1: a popular myth → REFUTED, overgeneralization ──────────────────
  { type: "claim_status", claimId: "c1", status: "retrieving" },
  {
    type: "source",
    claimId: "c1",
    source: {
      id: "s1",
      url: "https://www.nasa.gov/vision/space/workinginspace/great_wall.html",
      domain: "nasa.gov",
      title: "China's Wall Less Great in View from Space",
      snippet:
        "The Great Wall is barely visible from low Earth orbit and not visible at all from the Moon.",
      stance: "contradicts",
      credibility: 0.97,
    },
  },
  {
    type: "source",
    claimId: "c1",
    source: {
      id: "s2",
      url: "https://www.scientificamerican.com/article/is-chinas-great-wall-visible-from-space/",
      domain: "scientificamerican.com",
      title: "Is China's Great Wall Visible from Space?",
      snippet:
        "Under ideal conditions astronauts report difficulty distinguishing it from surrounding terrain.",
      stance: "contradicts",
      credibility: 0.9,
    },
  },
  { type: "claim_status", claimId: "c1", status: "arguing" },
  {
    type: "argument",
    claimId: "c1",
    argument: {
      id: "a1",
      claimId: "c1",
      role: "prosecutor",
      lens: "source quality",
      position:
        "NASA directly contradicts the claim. No primary source supports naked-eye visibility.",
      sourceIds: ["s1"],
      strength: 0.94,
    },
  },
  {
    type: "argument",
    claimId: "c1",
    argument: {
      id: "a2",
      claimId: "c1",
      role: "prosecutor",
      lens: "logical leap",
      position:
        "The wall is long but only a few metres wide — length does not imply visibility at orbital distance.",
      sourceIds: ["s2"],
      strength: 0.88,
    },
  },
  {
    type: "argument",
    claimId: "c1",
    argument: {
      id: "a3",
      claimId: "c1",
      role: "defense",
      lens: "charitable reading",
      position:
        "Some astronauts have reported seeing it under ideal conditions with optical aid.",
      sourceIds: ["s2"],
      strength: 0.31,
    },
  },
  { type: "claim_status", claimId: "c1", status: "judging" },
  {
    type: "verdict",
    claimId: "c1",
    verdict: "refuted",
    confidence: 0.93,
    failureType: "overgeneralization",
    reasoning:
      "NASA's own material contradicts the claim. The kernel of truth — that it is faintly detectable from low orbit under ideal conditions with aid — has been overgeneralized into unaided naked-eye visibility from space.",
    disagreement: 0.18,
  },

  // ── c2: THE KILLER — a plausible but fabricated citation ───────────────
  { type: "claim_status", claimId: "c2", status: "retrieving" },
  {
    type: "source",
    claimId: "c2",
    source: {
      id: "s3",
      url: "https://www.gsb.stanford.edu/faculty-research/publications",
      domain: "gsb.stanford.edu",
      title: "Stanford GSB Publications Index",
      snippet:
        "No 2019 publication matching the described finding appears in the index.",
      stance: "contradicts",
      credibility: 0.95,
    },
  },
  {
    type: "source",
    claimId: "c2",
    source: {
      id: "s4",
      url: "https://nbloom.people.stanford.edu/research",
      domain: "stanford.edu",
      title: "Nicholas Bloom — Work From Home Research",
      snippet:
        "Bloom's 2015 Ctrip experiment reports a 13% productivity increase, not 43%.",
      stance: "contradicts",
      credibility: 0.96,
    },
  },
  { type: "claim_status", claimId: "c2", status: "arguing" },
  {
    type: "argument",
    claimId: "c2",
    argument: {
      id: "a4",
      claimId: "c2",
      role: "prosecutor",
      lens: "source quality",
      position:
        "No 2019 Stanford study with this finding exists. The citation appears fabricated.",
      sourceIds: ["s3"],
      strength: 0.96,
    },
  },
  {
    type: "argument",
    claimId: "c2",
    argument: {
      id: "a5",
      claimId: "c2",
      role: "prosecutor",
      lens: "entity conflation",
      position:
        "This appears to be a distorted echo of Bloom's 2015 Ctrip study, which found 13% — not 43% — and was not 2019.",
      sourceIds: ["s4"],
      strength: 0.92,
    },
  },
  {
    type: "argument",
    claimId: "c2",
    argument: {
      id: "a6",
      claimId: "c2",
      role: "defense",
      lens: "charitable reading",
      position:
        "Stanford has published remote-work research, but none matching this year, figure, or framing.",
      sourceIds: ["s4"],
      strength: 0.14,
    },
  },
  { type: "claim_status", claimId: "c2", status: "judging" },
  {
    type: "verdict",
    claimId: "c2",
    verdict: "refuted",
    confidence: 0.91,
    failureType: "fabricated_citation",
    reasoning:
      "No such 2019 Stanford study exists. The claim is a fabricated citation that borrows Stanford's authority while distorting a real 2015 experiment by Nicholas Bloom, which measured a 13% gain. Both the year and the figure are invented.",
    disagreement: 0.09,
  },

  // ── c3: actually true → SUPPORTED (proves we're not just cynical) ──────
  { type: "claim_status", claimId: "c3", status: "retrieving" },
  {
    type: "source",
    claimId: "c3",
    source: {
      id: "s5",
      url: "https://www.smithsonianmag.com/science-nature/the-science-behind-honeys-eternal-shelf-life-1218690/",
      domain: "smithsonianmag.com",
      title: "The Science Behind Honey's Eternal Shelf Life",
      snippet:
        "Low water activity and acidity make honey inhospitable to microorganisms.",
      stance: "supports",
      credibility: 0.88,
    },
  },
  {
    type: "source",
    claimId: "c3",
    source: {
      id: "s6",
      url: "https://pubmed.ncbi.nlm.nih.gov/22315240/",
      domain: "pubmed.ncbi.nlm.nih.gov",
      title: "Antibacterial properties of honey",
      snippet:
        "Hygroscopic nature, low pH and hydrogen peroxide production inhibit bacterial growth.",
      stance: "supports",
      credibility: 0.94,
    },
  },
  { type: "claim_status", claimId: "c3", status: "arguing" },
  {
    type: "argument",
    claimId: "c3",
    argument: {
      id: "a7",
      claimId: "c3",
      role: "prosecutor",
      lens: "logical leap",
      position:
        "\"Never\" is absolute — improperly sealed honey can absorb moisture and ferment.",
      sourceIds: ["s5"],
      strength: 0.42,
    },
  },
  {
    type: "argument",
    claimId: "c3",
    argument: {
      id: "a8",
      claimId: "c3",
      role: "defense",
      lens: "mechanism",
      position:
        "The stated mechanism is correct and corroborated by peer-reviewed work on honey's antibacterial properties.",
      sourceIds: ["s6", "s5"],
      strength: 0.89,
    },
  },
  { type: "claim_status", claimId: "c3", status: "judging" },
  {
    type: "verdict",
    claimId: "c3",
    verdict: "supported",
    confidence: 0.86,
    failureType: "none",
    reasoning:
      "The mechanism is accurate and well corroborated. Low water activity and acidity do prevent microbial growth. The only caveat is the absolute framing — honey sealed improperly can absorb moisture and ferment.",
    disagreement: 0.24,
  },

  { type: "done", trustScore: 34 },
];

/**
 * Replay the scripted trial with realistic pacing.
 * Returns a cancel function.
 */
export function mockTribunal(
  onEvent: (e: StreamEvent) => void,
  events: StreamEvent[] = MOCK_EVENTS,
): () => void {
  let cancelled = false;

  (async () => {
    for (const e of events) {
      // Retrieval and judging feel slower than arguments arriving.
      const pause =
        e.type === "claims"
          ? 700
          : e.type === "claim_status"
            ? 450
            : e.type === "verdict"
              ? 900
              : 320 + Math.random() * 380;
      await new Promise((r) => setTimeout(r, pause));
      if (cancelled) return;
      onEvent(e);
    }
  })();

  return () => {
    cancelled = true;
  };
}
