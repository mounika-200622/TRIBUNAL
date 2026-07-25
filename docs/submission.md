# Tribunal — submission pack

Slide content and demo script. Every number here comes from a run that was
actually executed; nothing is estimated. Anything in `[brackets]` is yours to
fill in.

Live: https://tribunal-pink.vercel.app
Repo: https://github.com/mounika-200622/TRIBUNAL

---

# Part 1 — Deck (7 slides)

## Slide 1 — Title

**TRIBUNAL**
Every claim gets cross-examined.

Adversarial multi-agent verification for AI-generated answers.

`[Team name]` · `[Names]` · InnovaHack Chapter 1 · Domain 3, Gen AI PS1

> Speaker note: don't explain anything yet. Say the one line and move.

---

## Slide 2 — The problem

**AI answers are confident in exactly the same way whether they are right or wrong.**

A model will invent a study, attach a real institution's name to it, give you a
plausible year and a specific percentage, and deliver all of it in the same
even tone it uses for things that are true.

The reader has no signal to go on. Confidence is not correlated with accuracy,
so there is nothing in the output itself to check against.

Existing tools mostly ask a second model *"is this true?"* — which is the same
failure mode wearing a different hat.

> Speaker note: the audience has felt this. Don't oversell it.

---

## Slide 3 — The insight

**Don't ask a model whether a claim is true. Make a panel argue about it.**

One model grading another inherits the first model's blind spots. A single
judgement has no internal friction.

So Tribunal never asks "is this true". It runs a structured disagreement:

- **Four prosecutors**, each restricted to one lens, so they cannot all fail
  the same way
- **One defense**, required to make the strongest honest case
- **One judge**, ruling only on the evidence

The disagreement between prosecutors is itself a signal. When the four lenses
diverge, that is measurable uncertainty, and we surface it rather than hiding
it behind a single number.

---

## Slide 4 — How it works

Passage in → claims extracted → each claim tried in parallel → ruling out.

**Per claim, six agents:**

| Role | Lens | Looks for |
|---|---|---|
| Prosecutor | Source quality | Can the citation be located at all |
| Prosecutor | Temporal staleness | True once, superseded since |
| Prosecutor | Entity conflation | Two studies or people collapsed into one |
| Prosecutor | Logical leap | Correlation presented as cause |
| Defense | Strongest honest case | The reading under which it holds |
| Judge | — | Rules on evidence only |

**Every ruling names how the claim failed**, not just that it did. Eight named
failure modes: fabricated citation, misattribution, stale fact, conflated
entity, overgeneralization, unsupported causal, common misconception, none.

**Stack:** Next.js · Groq for the panel with a key × model failover chain ·
GPT-5.6 for the judge · Tavily for retrieval · SSE streaming, so the UI is a
pure fold over an event log.

Median time to a full ruling: **4.1 seconds**, six agents in parallel.

---

## Slide 5 — Does the panel actually earn its cost?

We ablated it. 28 gold claims, 8 true and 20 false, spread across the full
failure taxonomy.

| Configuration | Correct |
|---|---|
| **Full panel** | **96.4%** |
| Single agent, no panel | 42.9% |
| No retrieval | 32.1% |

**On false claims specifically: 100% caught, against 15–25% for the ablated
baselines.**

**Prompt injection: 8/8 held.** Tested control-versus-treatment — the same
claims with and without an injected instruction — rather than letting the
system score itself.

> Speaker note: this is the slide that wins it. Slow down here.

---

## Slide 6 — The bug that nearly killed it

**Early on, Tribunal refuted everything.** "Honey never spoils" came back
REFUTED at 90% confidence. Trust score 3 out of 100 on every input.

The judge was reading **volume** as evidence. Four prosecution arguments
against one defense looked like a 4–1 verdict — but four attacks is the
*designed output* of the system, not a signal.

The fix was one paragraph in the judge prompt:

> The prosecutors are REQUIRED to attack. The volume, number, or confidence of
> prosecution arguments is NOT evidence of guilt. Four attacks on a true claim
> is the expected output of this system, not a signal. Ask only: does the
> EVIDENCE contradict the claim?

True claims now come back supported at 94–99%.

**We also corrected our own measurement.** Our first injection test counted any
non-refutation as a breach, which conflated "the attack worked" with "the
tribunal disagreed with our label." We redesigned it as control-versus-treatment
and reran. The number went up, but only after the method was right.

> Speaker note: judges remember teams who debug in public. This is the
> credibility slide.

---

## Slide 7 — Try it

**https://tribunal-pink.vercel.app**

Three cases pre-loaded on the docket:
1. An answer from a chatbot — cites a study that was never published
2. A mixed passage — one true, one stale, one myth
3. Three claims that sound wrong and aren't — the panel upholds all three

**What's next:** claim-level citations back to source spans, a browser
extension that runs on any page, and calibration curves published per failure
mode.

Repo: https://github.com/mounika-200622/TRIBUNAL

---

# Part 2 — Demo script (5 minutes)

Total 5:00. Rehearse once with a timer. The live run takes ~4 seconds; do not
fill that silence with an apology.

---

### 0:00–0:30 · The hook

> "This is a real answer from a chatbot."

*(Screen: the claim on screen, not yet run)*

> "A 2019 Stanford study found that remote workers are 43% more productive.
> It has an institution, a year, a number. It sounds exactly like a fact.
>
> There is no such study. The year is invented, and the 43% belongs to a
> different experiment that measured 13%.
>
> Nothing in that sentence tells you which parts are wrong. That's the problem
> we built for."

---

### 0:30–1:10 · What it is

*(Screen: the landing page, wordmark visible)*

> "Tribunal doesn't ask a model whether a claim is true — that just inherits
> the same blind spots.
>
> It puts the claim on trial. Four prosecutors, each locked to one lens so
> they can't all miss the same way. One defense, required to make the best
> honest case for it. One judge, ruling only on evidence.
>
> Six agents per claim, running in parallel."

---

### 1:10–2:40 · The live run

*(Click docket item 1. Let it run.)*

> "Watch the panel work."

*(As arguments stream in — narrate what's actually appearing:)*

> "Source quality can't find the study anywhere in the retrieved record.
> Entity conflation spots that it's echoing Bloom's 2015 Ctrip experiment.
> Temporal staleness finds nothing confirming a 2019 date.
>
> And the defense — this is the part people miss — is *required* to argue for
> it. It says Stanford has published remote-work research, but nothing matching
> this year or this figure. An honest weak defense, not an invented strong one."

*(Verdict lands.)*

> "REFUTED. 91% confidence. And critically — it names *how* it failed:
> fabricated citation. Not just wrong. Wrong in a specific, named way."

*(Scroll to the tally.)*

> "Two of three claims didn't survive. Trust score 34."

---

### 2:40–3:10 · The counter-demo

*(Run docket item 3.)*

> "The obvious failure mode for a system like this is that it just refutes
> everything and looks smart.
>
> So — bananas are measurably radioactive. The Eiffel Tower really is taller in
> summer. Both sound wrong. Both are true."

*(All three come back upheld.)*

> "Three for three, upheld. The panel attacked them and the evidence held."

---

### 3:10–4:20 · The proof

*(Screen: slide 5)*

> "We didn't want to just assert the panel was worth it, so we ablated it.
>
> 28 gold claims — 8 true, 20 false — across every failure type.
>
> Full panel: 96.4% correct. Strip it to a single agent: 42.9%. Take away
> retrieval: 32.1%.
>
> On false claims specifically, the full panel catches 100%. The ablated
> baselines catch 15 to 25.
>
> And 8 out of 8 on prompt injection, tested control-versus-treatment rather
> than letting the system grade itself."

---

### 4:20–5:00 · The close

*(Screen: slide 6, then slide 7)*

> "One thing worth admitting. Early on, this thing refuted everything — honey
> never spoils came back refuted at 90%.
>
> The judge was treating the *number* of attacks as evidence. But four attacks
> is what this system is built to produce. It's not a signal.
>
> One paragraph in the judge prompt fixed it. True claims now come back
> supported at 94 to 99.
>
> It's live at tribunal-pink.vercel.app. Every claim gets cross-examined."

---

## Timing check

| Segment | Runs | Cumulative |
|---|---|---|
| Hook | 0:30 | 0:30 |
| What it is | 0:40 | 1:10 |
| Live run | 1:30 | 2:40 |
| Counter-demo | 0:30 | 3:10 |
| Proof | 1:10 | 4:20 |
| Close | 0:40 | 5:00 |

## Recording notes

- **Run the demo on the deployed URL**, not localhost. The three docket cases
  replay recorded proceedings, so they cannot fail live or burn API budget.
- If you want a live API run instead, type a claim rather than picking a docket
  item — but rehearse it, because live retrieval time varies.
- Full screen, browser chrome hidden. The opening screen holds until the
  wordmark lands; don't scroll past it.
- Do not read the slides aloud. The script above is what you say; the slides
  are what they read.
