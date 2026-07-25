import { FAST_MODEL, groq } from "../config";
import { cached, keyOf } from "../cache";
import type { Argument, Claim, Source } from "../types";

/**
 * The adversarial panel — the core of the project.
 *
 * A sequential "checker" agent inherits the same blind spots as the agent that
 * produced the claim: both are trying to be right. So instead we run several
 * prosecutors in parallel, each given ONE lens and told its job is to REFUTE.
 * Specialisation is what makes them find different things; a single generalist
 * verifier finds one thing and stops.
 *
 * One defense agent argues the other side so the judge sees a real contest and
 * a true claim can't be talked to death.
 */

type Lens = {
  id: string;
  label: string;
  brief: string;
};

const PROSECUTOR_LENSES: Lens[] = [
  {
    id: "source_quality",
    label: "source quality",
    brief:
      "Attack the evidence base. Do the sources actually address this claim, or merely mention the topic? Is any cited study, paper, author, or figure real and correctly described? If a citation cannot be located in the sources, say so plainly — fabricated citations are the single most common failure.",
  },
  {
    id: "temporal",
    label: "temporal staleness",
    brief:
      "Attack the timeline. Was this true once but superseded? Are the sources current enough to support a present-tense claim? Does the claim attach a date, year, or 'recent' framing that the evidence does not support?",
  },
  {
    id: "entity",
    label: "entity conflation",
    brief:
      "Attack the identities. Are two similar people, organisations, studies, products, or places being merged? Is a finding attributed to the wrong author, institution, or year? Is a real finding being restated with the wrong numbers?",
  },
  {
    id: "logic",
    label: "logical leap",
    brief:
      "Attack the inference. Even granting the sources, does the conclusion follow? Look for correlation sold as causation, a sample generalised past its population, absolutes ('always', 'never', 'all') resting on partial evidence, and quantities that drift from what the evidence shows.",
  },
];

const DEFENSE_LENS: Lens = {
  id: "defense",
  label: "strongest defense",
  brief:
    "Argue FOR the claim as charitably as the evidence honestly allows. Find the reading under which it is true and point to the sources that support it. Do not fabricate support — if the evidence genuinely isn't there, say the defense is weak and give a low strength. An honest weak defense is more useful than an invented strong one.",
};

function prompt(role: "prosecutor" | "defense", lens: Lens): string {
  return `You are ${role === "prosecutor" ? "a PROSECUTOR" : "the DEFENSE"} on a fact-checking tribunal.

Your assigned lens: ${lens.label.toUpperCase()}
${lens.brief}

${
  role === "prosecutor"
    ? "Your job is to REFUTE the claim through your lens specifically. Do not argue outside it — other prosecutors cover other angles. If your lens reveals no genuine problem, say so and give a low strength. Never manufacture a flaw."
    : "Your job is to DEFEND the claim honestly."
}

Cite only from the numbered sources provided. Never invent a source, a study, or a statistic.

Return strict JSON only:
{"position": "one or two sentences, specific and concrete", "sourceIds": ["s1"], "strength": 0.0}

strength = how strong your own case honestly is, 0 to 1. Be calibrated, not theatrical.`;
}

function sourceBlock(sources: Source[]): string {
  if (sources.length === 0) return "(no sources were retrieved)";
  return sources
    .map(
      (s) =>
        `[${s.id}] ${s.domain} — ${s.title}\n"${s.snippet}"\n(credibility ${s.credibility})`,
    )
    .join("\n\n");
}

async function runAdvocate(
  claim: Claim,
  lens: Lens,
  role: "prosecutor" | "defense",
): Promise<Argument> {
  const key = keyOf("advocate", FAST_MODEL, role, lens.id, claim.text, claim.sources.map((s) => s.id + s.snippet));

  const out = await cached(key, async () => {
    try {
      const r = await groq().chat.completions.create({
        model: FAST_MODEL,
        messages: [
          { role: "system", content: prompt(role, lens) },
          {
            role: "user",
            content: `CLAIM UNDER TRIAL:\n"${claim.text}"\n\nSOURCES:\n${sourceBlock(claim.sources)}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });
      return JSON.parse(r.choices[0]?.message?.content ?? "{}") as {
        position?: string;
        sourceIds?: string[];
        strength?: number;
      };
    } catch (e) {
      console.error(`advocate ${role}/${lens.id} failed:`, e);
      return {};
    }
  });

  const valid = new Set(claim.sources.map((s) => s.id));

  return {
    id: `${claim.id}-${lens.id}`,
    claimId: claim.id,
    role,
    lens: lens.label,
    position: (out.position ?? "No argument returned.").trim(),
    // Drop hallucinated source ids — an agent citing [s9] when only s1–s4 exist
    // is exactly the failure we're built to catch, so we don't let it through.
    sourceIds: (out.sourceIds ?? []).filter((id) => valid.has(id)),
    strength: Math.min(1, Math.max(0, Number(out.strength ?? 0.5))),
  };
}

/**
 * Run the whole panel for one claim, in parallel. All five agents hit Groq at
 * once, so the full contest resolves in about the time of a single call.
 */
export async function runPanel(
  claim: Claim,
  onArgument?: (a: Argument) => void,
): Promise<Argument[]> {
  const jobs = [
    ...PROSECUTOR_LENSES.map((l) => runAdvocate(claim, l, "prosecutor" as const)),
    runAdvocate(claim, DEFENSE_LENS, "defense" as const),
  ];

  const settled = await Promise.all(
    jobs.map((p) =>
      p.then((a) => {
        onArgument?.(a);
        return a;
      }),
    ),
  );

  return settled;
}

/**
 * How much the prosecutors disagreed — spread of their strengths.
 *
 * This is a real uncertainty signal, not decoration: when three prosecutors
 * find nothing and one is certain, that tension belongs in front of the user
 * rather than averaged away.
 */
export function disagreementOf(args: Argument[]): number {
  const s = args.filter((a) => a.role === "prosecutor").map((a) => a.strength);
  if (s.length < 2) return 0;
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  const variance = s.reduce((acc, x) => acc + (x - mean) ** 2, 0) / s.length;
  // Std dev of values in [0,1] maxes near 0.5, so scale to roughly fill 0..1.
  return Number(Math.min(1, Math.sqrt(variance) * 2).toFixed(2));
}
