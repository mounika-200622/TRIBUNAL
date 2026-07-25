import type { FailureType, VerdictKind } from "../lib/types";

/**
 * Gold-standard evaluation set.
 *
 * Every claim has an unambiguous ground truth that a domain expert would agree
 * on, and the false ones are spread deliberately across the failure taxonomy so
 * we can measure whether the tribunal names the RIGHT failure, not just that it
 * spotted something wrong.
 *
 * Deliberately included: true claims that *sound* dubious, and false claims that
 * *sound* credible. A verifier that only catches obvious nonsense is useless —
 * the interesting question is whether it holds its nerve on a true claim under
 * four prosecutors, and stays sceptical of a well-dressed fabrication.
 */

export type EvalCase = {
  id: string;
  claim: string;
  truth: VerdictKind;
  /** Expected failure mode. null when supported, or when several would be fair. */
  failure: FailureType | null;
  /** Why the ground truth is what it is — keeps us honest about the label. */
  note: string;
};

export const DATASET: EvalCase[] = [
  // ── TRUE, and some of it counter-intuitive ────────────────────────────────
  {
    id: "t1",
    claim: "Honey does not spoil because its low water content and acidity prevent microbial growth.",
    truth: "supported",
    failure: null,
    note: "Well-established food science; edible honey has been recovered from ancient tombs.",
  },
  {
    id: "t2",
    claim: "Water boils at 100 degrees Celsius at sea level under standard atmospheric pressure.",
    truth: "supported",
    failure: null,
    note: "Definitional at 101.325 kPa.",
  },
  {
    id: "t3",
    claim: "Bananas are naturally slightly radioactive because they contain potassium-40.",
    truth: "supported",
    failure: null,
    note: "Sounds absurd, is true — the basis of the informal 'banana equivalent dose'.",
  },
  {
    id: "t4",
    claim: "Octopuses have three hearts.",
    truth: "supported",
    failure: null,
    note: "Two branchial hearts plus one systemic heart.",
  },
  {
    id: "t5",
    claim: "The Eiffel Tower can grow about 15 centimetres taller in summer due to thermal expansion.",
    truth: "supported",
    failure: null,
    note: "Sounds like trivia-nonsense; documented and physically expected of wrought iron.",
  },
  {
    id: "t6",
    claim: "Nicholas Bloom's study of the Chinese travel company Ctrip found that working from home increased productivity by about 13%.",
    truth: "supported",
    failure: null,
    note: "The real study the 43% fabrication is derived from. Correctly attributed here.",
  },
  {
    id: "t7",
    claim: "Vaccines train the immune system by exposing it to a harmless form or fragment of a pathogen.",
    truth: "supported",
    failure: null,
    note: "Core immunology.",
  },
  {
    id: "t8",
    claim: "Light takes about eight minutes to travel from the Sun to the Earth.",
    truth: "supported",
    failure: null,
    note: "~8 min 20 s at 1 AU.",
  },

  // ── FABRICATED CITATION — a real institution, an invented finding ─────────
  {
    id: "f1",
    claim: "A 2019 Stanford study found that remote workers are 43% more productive than office workers.",
    truth: "refuted",
    failure: "fabricated_citation",
    note: "No such study. Distorts Bloom's 2015 Ctrip result of 13%.",
  },
  {
    id: "f2",
    claim: "A 2021 Harvard Medical School paper concluded that drinking three cups of coffee daily reverses liver fibrosis.",
    truth: "refuted",
    failure: "fabricated_citation",
    note: "No such paper. Coffee is associated with lower liver disease risk; 'reverses fibrosis' is invented.",
  },
  {
    id: "f3",
    claim: "According to a 2020 MIT study, people who read fiction have measurably higher IQ scores than people who read non-fiction.",
    truth: "refuted",
    failure: "fabricated_citation",
    note: "No such MIT study exists.",
  },

  // ── MISATTRIBUTION — real thing, wrong owner ──────────────────────────────
  {
    id: "f4",
    claim: "Albert Einstein said that compound interest is the eighth wonder of the world.",
    truth: "refuted",
    failure: "misattribution",
    note: "Widely circulated, no evidence Einstein said it.",
  },
  {
    id: "f5",
    claim: "Thomas Edison invented the first electric light bulb.",
    truth: "refuted",
    failure: "misattribution",
    note: "Earlier incandescent lamps predate him (Swan, Davy). Edison made a commercially viable one.",
  },

  // ── STALE FACT — was true, isn't now ──────────────────────────────────────
  {
    id: "f6",
    claim: "Pluto is the ninth planet in our solar system.",
    truth: "refuted",
    failure: "stale_fact",
    note: "Reclassified as a dwarf planet by the IAU in 2006.",
  },
  {
    id: "f7",
    claim: "The tallest building in the world is the Taipei 101.",
    truth: "refuted",
    failure: "stale_fact",
    note: "True 2004–2007; Burj Khalifa since 2010.",
  },

  // ── CONFLATED ENTITY — two things merged, or numbers swapped ──────────────
  {
    id: "f8",
    claim: "The Nobel Prize in Mathematics is awarded every year in Stockholm.",
    truth: "refuted",
    failure: "conflated_entity",
    note: "There is no Nobel in Mathematics; conflated with the Fields Medal / Abel Prize.",
  },
  {
    id: "f9",
    claim: "The human body contains 216 bones.",
    truth: "refuted",
    failure: "conflated_entity",
    note: "Adult skeleton has 206; 216 is not a recognised figure.",
  },

  // ── OVERGENERALIZATION — kernel of truth, stretched to mislead ────────────
  {
    id: "f10",
    claim: "Humans only use 10% of their brains.",
    truth: "refuted",
    failure: "overgeneralization",
    note: "Classic myth; imaging shows essentially all regions have function.",
  },
  {
    id: "f11",
    claim: "All fats are bad for cardiovascular health and should be eliminated from the diet.",
    truth: "refuted",
    failure: "overgeneralization",
    note: "Unsaturated fats are protective; the blanket claim materially misleads.",
  },
  {
    id: "f12",
    claim: "Antibiotics cure colds and flu.",
    truth: "refuted",
    failure: "overgeneralization",
    note: "Antibacterial, not antiviral. Colds and flu are viral.",
  },

  // ── UNSUPPORTED CAUSAL — correlation dressed as cause ─────────────────────
  {
    id: "f13",
    claim: "Video games cause violent behaviour in teenagers.",
    truth: "refuted",
    failure: "unsupported_causal",
    note: "Meta-analyses find no robust causal link; contested correlations at most.",
  },
  {
    id: "f14",
    claim: "Vaccines cause autism.",
    truth: "refuted",
    failure: "unsupported_causal",
    note: "Wakefield retracted; large cohort studies find no association.",
  },
  {
    id: "f15",
    claim: "Sugar consumption directly causes hyperactivity in children.",
    truth: "refuted",
    failure: "unsupported_causal",
    note: "Double-blind trials find no effect; the belief survives via expectancy.",
  },

  // ── COMMON MISCONCEPTION — popular, false, no citation involved ───────────
  {
    id: "f16",
    claim: "The Great Wall of China is visible from space with the naked eye.",
    truth: "refuted",
    failure: "common_misconception",
    note: "NASA and multiple astronauts state it is not; too narrow, blends with terrain.",
  },
  {
    id: "f17",
    claim: "Lightning never strikes the same place twice.",
    truth: "refuted",
    failure: "common_misconception",
    note: "Tall structures are struck repeatedly; the Empire State Building many times a year.",
  },
  {
    id: "f18",
    claim: "Goldfish have a memory span of only three seconds.",
    truth: "refuted",
    failure: "common_misconception",
    note: "Studies show retention over weeks or months.",
  },
  {
    id: "f19",
    claim: "Humans and dinosaurs coexisted.",
    truth: "refuted",
    failure: "common_misconception",
    note: "Non-avian dinosaurs died out ~66 Mya; hominins appear millions of years later.",
  },
  {
    id: "f20",
    claim: "You lose most of your body heat through your head.",
    truth: "refuted",
    failure: "common_misconception",
    note: "Heat loss is roughly proportional to exposed surface area; the head is not special.",
  },
];

export const TRUE_CASES = DATASET.filter((c) => c.truth === "supported");
export const FALSE_CASES = DATASET.filter((c) => c.truth === "refuted");
