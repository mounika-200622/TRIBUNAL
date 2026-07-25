# Cost, throughput and what breaks first

Same rule as the accuracy work: measured where we measured it, derived where we
derived it, and the arithmetic left visible so anyone can substitute their own
rates and check.

---

## What one claim actually costs

**Measured from the code and the runs:**

| Quantity | Value | How we know |
|---|---|---|
| Model calls per claim | **6** | 4 prosecutors + 1 defense + 1 judge, `lib/agents/advocate.ts` |
| Retrieval calls per claim | **1** | one Tavily search, shared by all six |
| System prompt payload | **~5.4k tokens** | measured across `lib/agents/*.ts` |
| Median time to a full ruling | **4.1s** | six agents in parallel, not in sequence |

**Derived, at the rates in the table:**

The five panel calls run on Groq. Each sends one lens prompt plus the retrieved
sources, and returns a short structured argument. Taking ~1.5k input and ~250
output tokens per call:

```
panel   5 calls x 1.5k in   =  7.5k input tokens
        5 calls x 250 out   =  1.25k output tokens
judge   1 call  x 3k in     =  3.0k input tokens
        1 call  x 400 out   =  0.4k output tokens
```

At Groq's published `llama-3.3-70b-versatile` rate of $0.59/M input and
$0.79/M output, the panel is **about $0.005 per claim**. The judge runs on a
frontier model and dominates the total; substitute your own rate against the
3.4k tokens above.

**The honest version: single-digit cents per claim, and the judge is most of
it.** That is the number to attack if this ever needs to be cheaper, and the
architecture already allows it: the judge is one call behind one interface.

## Throughput

The six agents for a claim run **in parallel**, so per-claim latency is bounded
by the slowest agent, not the sum. Claims within a passage also run in
parallel. Wall-clock is therefore roughly flat in the number of claims until
you hit a provider limit rather than growing with it.

**The bottleneck is not inference. It is retrieval and rate limits.**

## What breaks first, and what we did about it

We know the first failure mode because we hit it during development: **provider
rate limits, and they are per key AND per model.** One evaluation sweep
exhausted a 100k token-per-day allowance.

`lib/config.ts` carries the response — a failover chain that walks the
preferred model across every available key before dropping a tier:

```ts
for (const model of FAST_MODEL_CHAIN) {
  for (const [i, key] of GROQ_KEYS.entries()) {
    try { return await call(model, key); }
    catch (e) { if (!isQuotaError(e)) throw e; /* rotate */ }
  }
}
```

That is not a diagram of a scaling plan. It is the code, and it exists because
the limit was real.

**A disk cache** sits in front of retrieval and extraction, so a claim that has
been seen before costs approximately nothing. In a deployment where many users
check the same viral claim, that is the difference between linear and
near-constant cost.

## What would need to change at real scale

Stated plainly, because pretending otherwise is how these slides go wrong:

- **Retrieval is the cost floor.** Every novel claim needs a live search. A
  shared cache across users amortises this; a private one does not.
- **The judge is the price driver.** A distilled judge trained on the panel's
  own rulings is the obvious next step, and the ablation data is exactly the
  training set for it.
- **Nothing here is stateful.** Each claim is independent, so horizontal scale
  is adding workers, not sharding a database.
- **The 8 true / 20 false evaluation set is small.** It is enough to show the
  panel beats the ablations by a wide margin. It is not enough to claim a
  precise accuracy figure in the wild, and we do not.

## Who this is for

Ordered by how little has to change for them to use it today:

1. **Students and researchers** checking an AI answer before citing it. Works
   now, unchanged.
2. **Journalists and editors** running a draft past a panel before filing. The
   named failure modes matter more than the score here; "fabricated citation"
   is actionable in a way that "72% confidence" is not.
3. **Educators** marking work that may be model-written. The record shows
   which claim failed and why, which is the part a student can learn from.
4. **Anyone shipping an LLM feature**, as an evaluation harness. The ablation
   scripts in `eval/` are the product for this audience.

The failure taxonomy is the durable asset. A score tells you not to trust an
answer. **A named failure mode tells you what to do about it.**
