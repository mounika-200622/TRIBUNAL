# Tribunal — Frontend Guide

**You own everything the judge sees.** The engine half is being built in
parallel, but you will never wait on it: a full scripted trial already streams
in `lib/mock.ts`.

---

## 0 · Get running (10 minutes)

```bash
git pull
npm install
npm run dev
```

Open <http://localhost:3000> → click **"Run mock trial"**. You'll see three
claims get argued and ruled on. That's the real event shape, already flowing.

### Read these three files first

| File | What it is |
|---|---|
| `lib/types.ts` | **The frozen contract.** Never edit. Everything you render is one of these types. |
| `lib/mock.ts` | A complete scripted trial, correct pacing. Your data source. |
| `lib/reducer.ts` | `reduce(state, event)` — folds events into state. **Always use this.** |

### Your files vs mine

| Yours (I never touch) | Mine (never touch) |
|---|---|
| `app/page.tsx` | `app/api/**` |
| `app/components/**` | `lib/agents/**` |
| `app/globals.css` | `lib/retrieval/**` |
| `docs/` (this file) | `lib/judge/**` |

**Shared, change only by telling me:** `lib/types.ts`, `lib/reducer.ts`

`app/page.tsx` right now is a throwaway placeholder — **gut it and start fresh.**

---

## 1 · The one rule that makes this work

Never fetch or parse anything yourself. Every event goes through `reduce()`:

```tsx
const [state, dispatch] = useReducer(reduce, initialState);

// today — mock
mockTribunal((e) => dispatch(e));

// tomorrow — live engine. THIS IS THE ONLY LINE THAT CHANGES.
// streamTribunal(text, (e) => dispatch(e));
```

Because of this, your UI works identically on mock and real data. Build the
whole thing on mock, swap one line at integration, done.

Selectors you already have: `counts(state)` → `{total, supported, refuted, unverifiable, settled}`

---

## 2 · What you're building — five screens

> Budget: **60% of your time on screen ②.** It's what wins.

### ① Landing / paste

The entry point. Keep it to one decision.

- Big headline. Suggested: **"Every claim gets a trial."**
- Sub: *"Paste any AI answer. We'll put it on trial."*
- One large `<textarea>`
- Primary button: **Convene the tribunal**
- Three preset chips that fill the textarea:
  - `Audit a ChatGPT answer` — loads a sample AI answer
  - `Check a news claim`
  - `Try a tricky one`
- One line of proof: *"12 agents · 4 seconds · every claim sourced"*

### ② The tribunal — the centerpiece

Two panes side by side. This is the jaw-drop.

**Left — live evidence graph**
- Claim nodes centre, source nodes fly in and attach
- Edge colour by `source.stance`: green `supports` · red `contradicts` · grey `neutral`
- Node ring **pulses** while `status !== "done"`, locks on verdict
- Node fill on verdict: green `supported` · red `refuted` · amber `unverifiable`
- Node size ∝ number of sources

Use **`react-force-graph-2d`**:
```bash
npm i react-force-graph-2d
```
```tsx
// It needs {nodes, links}. Derive from state — don't store graph state separately.
const graph = {
  nodes: [
    ...state.claims.map(c => ({ id: c.id, kind: "claim", label: c.text, verdict: c.verdict })),
    ...state.claims.flatMap(c => c.sources.map(s => ({ id: s.id, kind: "source", label: s.domain }))),
  ],
  links: state.claims.flatMap(c =>
    c.sources.map(s => ({ source: c.id, target: s.id, stance: s.stance }))
  ),
};
```
> ⚠️ It's client-only. Import with
> `const Graph = dynamic(() => import("react-force-graph-2d"), { ssr: false })`

**🚨 FALLBACK — decide by 18:00, no later.**
If the graph fights you, switch to a vertical **docket**: claim cards stacked,
arguments animating in, sources as chips. Still looks excellent. **Never let the
graph put the demo at risk.** Tell me the moment you make this call.

**Right — live argument feed**
- Arguments append as they arrive (`state.claims.flatMap(c => c.arguments)`)
- Prosecutor → red left border · Defense → green left border
- Lens in mono caps above the text: `TEMPORAL STALENESS`
- Strength as a thin bar
- Auto-scroll to newest

### ③ Verdict card

Appears per claim when its verdict lands. This is what gets screenshotted.

- The claim text, quoted, prominent
- Huge verdict badge: **REFUTED** / **SUPPORTED** / **UNVERIFIABLE**
- Failure chip — **only when `failureType !== "none"`**:
  ```tsx
  import { FAILURE_LABELS } from "@/lib/types";
  {FAILURE_LABELS[claim.failureType]}  // "Fabricated citation"
  ```
  This chip is our whole differentiator. Make it look important.
- Confidence bar + number
- **Disagreement meter** — render as *"prosecutors split 3–1"*. Great detail,
  nobody else will have it.
- The judge's `reasoning` paragraph
- Sources as `domain` chips linking to `url` (favicons are a nice touch:
  `https://www.google.com/s2/favicons?domain=${domain}`)

### ④ Trust score

On `{ type: "done" }`:
- One huge number 0–100
- A verdict sentence: *"This answer is mostly unreliable."*
- Breakdown from `counts(state)`
- **"Share verdict"** button → renders a clean card that screenshots well

### ⑤ States — do not skip, this is half the polish

| State | Must show |
|---|---|
| Empty | Landing, nothing pasted |
| Extracting | Skeleton claim nodes, *"decomposing into claims…"* |
| In progress | `settled / total` counter always visible |
| Error | `state.error` → friendly + retry button. **Never a stack trace.** |
| Done | Trust score card |
| Reduced motion | Freeze graph physics, no autoplay |

---

## 3 · Design direction

**Courtroom, not dashboard.** Serious, theatrical, high contrast.

Colours are already in `app/globals.css` as Tailwind tokens:

```
bg-void      #08090c   canvas
bg-panel     #101319   cards
border-line  #1e232d   hairlines
text-paper   #eceef2   primary
text-dim     #8b93a3   secondary
supported    #1fc16b
refuted      #ff5a5f
unverifiable #ffc83a
accent       #7b61ff   chrome only
```

Fonts wired: `font-display` (Sora) for verdicts/headlines, `font-body` (Inter),
`font-mono` for lenses, domains, metrics.

**Motion is the product.** Nodes should *arrive*, edges should *draw*, verdicts
should *land* with weight. Nothing should just appear. But keep it tasteful —
one orchestrated moment beats five scattered effects.

**Readable on a projector from 3 metres.** Big type. Test by standing back.

---

## 4 · Your timeline

| Time | Do this | Gate |
|---|---|---|
| **now → 14:00** | Kill the placeholder. Landing screen + `useTribunal` hook + tribunal layout shell (two panes, hardcoded sizes OK) | Mock events render in your own components |
| **14:00 → 18:00** | Graph spike + argument feed. Get nodes animating. | ✅ **Graph decision: keep or fallback** |
| **18:00 → 20:00** | Verdict cards + failure chips + confidence/disagreement | Integration with real engine — we do this together |
| **20:00 → 00:00** | Trust score, share card, all five states, polish | ✅ Demo path flawless |
| **00:00 → 02:00** | Landing polish, reduced-motion, projector test | ✅ Deployed and pretty |
| **02:00 → 06:00** | 😴 sleep — non-negotiable | |
| **06:00 → 08:00** | **PPT (6–7 slides)** — outline in the battle plan §8 | |
| **08:00 → 09:00** | Proofread, Drive public access, submit | ✅ **DONE** |

---

## 5 · Definition of done

- [ ] Works end-to-end on mock with zero backend
- [ ] Swapping mock → live is one line
- [ ] All five states designed
- [ ] Smooth with 3 claims × 2–4 sources
- [ ] Failure-type chip is visually prominent
- [ ] Readable from 3 metres
- [ ] `prefers-reduced-motion` respected
- [ ] Trust card screenshots well

---

## 6 · Don't

- ❌ Touch `app/api/**` or `lib/agents/**`
- ❌ Wait for my backend — the mock is the point
- ❌ Edit `lib/types.ts` without telling me
- ❌ Build features outside the five screens
- ❌ Bypass `reduce()` and hold your own parallel state
- ❌ Let the graph become a single point of failure

---

## 7 · If you're stuck

1. **Something's not in the contract?** Message me — I add it, we both pull. Do
   not invent a field.
2. **Graph too hard?** Fallback docket. Tell me you've switched.
3. **Blocked >20 min on anything?** Ship the ugly version, note a TODO, keep
   moving. We polish at 20:00.

Ping me at each gate so we stay in sync.
