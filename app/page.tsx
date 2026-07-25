"use client";

/**
 * PLACEHOLDER — teammate owns this file from here.
 *
 * It already wires the mock stream through the shared reducer, so events are
 * flowing on first load. Replace the rendering with the real five screens
 * (landing, tribunal, verdict cards, trust score, states) — but keep using
 * `reduce` so swapping to the live engine stays a one-line change.
 */

import { useCallback, useReducer, useState } from "react";
import { mockTribunal } from "@/lib/mock";
import { initialState, reduce, counts } from "@/lib/reducer";
import { FAILURE_LABELS } from "@/lib/types";

export default function Home() {
  const [state, dispatch] = useReducer(reduce, initialState);
  const [running, setRunning] = useState(false);

  const start = useCallback(() => {
    setRunning(true);
    // Swap this line for the real SSE endpoint when the engine lands.
    mockTribunal((e) => dispatch(e));
  }, []);

  const c = counts(state);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Tribunal
        </h1>
        <p className="mt-1 text-dim">Every claim gets a trial.</p>
      </header>

      {!running && (
        <button
          onClick={start}
          className="rounded-lg bg-accent px-6 py-3 font-display font-bold text-white"
        >
          Run mock trial
        </button>
      )}

      {running && (
        <p className="mb-6 font-mono text-sm text-dim">
          {c.settled}/{c.total} settled · {c.supported} supported · {c.refuted}{" "}
          refuted
          {state.trustScore !== null && ` · trust ${state.trustScore}/100`}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {state.claims.map((claim) => (
          <article
            key={claim.id}
            className="rounded-xl border border-line bg-panel p-5"
          >
            <p className="font-display text-lg">{claim.text}</p>

            <p className="mt-2 font-mono text-xs uppercase tracking-wide text-dim">
              {claim.status}
              {claim.verdict && ` · ${claim.verdict}`}
              {claim.confidence !== null &&
                ` · ${Math.round(claim.confidence * 100)}%`}
            </p>

            {claim.failureType && claim.failureType !== "none" && (
              <span className="mt-2 inline-block rounded bg-refuted/20 px-2 py-0.5 font-mono text-xs text-refuted">
                {FAILURE_LABELS[claim.failureType]}
              </span>
            )}

            {claim.arguments.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {claim.arguments.map((a) => (
                  <li key={a.id} className="text-sm text-dim">
                    <span
                      className={
                        a.role === "prosecutor"
                          ? "font-mono text-xs uppercase text-refuted"
                          : "font-mono text-xs uppercase text-supported"
                      }
                    >
                      {a.lens}
                    </span>{" "}
                    — {a.position}
                  </li>
                ))}
              </ul>
            )}

            {claim.reasoning && (
              <p className="mt-3 border-t border-line pt-3 text-sm">
                {claim.reasoning}
              </p>
            )}

            {claim.sources.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {claim.sources.map((s) => (
                  <a
                    key={s.id}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded border border-line px-2 py-0.5 font-mono text-xs text-dim hover:text-paper"
                  >
                    {s.domain}
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
