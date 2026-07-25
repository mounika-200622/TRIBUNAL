"use client";

import type { TribunalState } from "@/lib/reducer";
import { TrustScore } from "./TrustScore";
import { counts } from "@/lib/reducer";
import { ArgumentFeed } from "./ArgumentFeed";
import { EvidenceGraph } from "./EvidenceGraph";

export function TribunalView({ state }: { state: TribunalState }) {
  const c = counts(state);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-3">
        <h1 className="font-display text-lg font-bold">Tribunal</h1>
        <p className="font-mono text-xs uppercase tracking-wide text-dim">
          {c.settled}/{c.total} settled · {c.supported} supported ·{" "}
          {c.refuted} refuted · {c.unverifiable} unverifiable
        </p>
      </header>
      {state.done && !state.error ? (
        <div className="flex-1 overflow-y-auto">
          <TrustScore state={state} />
        </div>
      ) : (
      <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
        <div className="flex flex-col border-b border-line md:border-b-0 md:border-r">
          <p className="px-4 pt-4 font-mono text-xs uppercase tracking-wide text-dim">
            Evidence graph
          </p>
          <div className="flex-1 overflow-hidden">
            <EvidenceGraph state={state} />
          </div>
        </div>
        <div className="overflow-hidden">
          <ArgumentFeed state={state} />
        </div>
      </div>
      )}
    </div>
  );
}