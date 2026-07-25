"use client";

import type { TribunalState } from "@/lib/reducer";
import { TrustScore } from "./TrustScore";
import { counts } from "@/lib/reducer";
import { ArgumentFeed } from "./ArgumentFeed";
import { EvidenceGraph } from "./EvidenceGraph";

export function TribunalView({ state }: { state: TribunalState }) {
  const c = counts(state);

  return (
    <div className="relative z-10 flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-3">
        <h1 className="font-display text-lg font-bold">Tribunal</h1>
        <p className="font-mono text-xs uppercase tracking-wide text-dim">
          {c.settled}/{c.total} settled · {c.supported} supported ·{" "}
          {c.refuted} refuted · {c.unverifiable} unverifiable
        </p>
      </header>
      {state.done && !state.error ? (
        <div className="relative z-10 flex-1 overflow-y-auto">
          <TrustScore state={state} />
        </div>
      ) : (
      <div className="relative z-10 grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
        <div className="flex flex-col p-4 md:border-b-0">
          <div className="flex h-full flex-col overflow-hidden rounded-[10px] border border-[rgba(255,255,255,.5)] bg-gradient-to-b from-[rgba(17,22,41,.55)] to-[rgba(13,17,32,.55)] shadow-[0_0_0_1px_rgba(255,255,255,.2),0_0_22px_-2px_rgba(255,255,255,.7),0_30px_70px_-30px_rgba(0,0,0,.7)]">
            <p className="border-b border-[rgba(120,160,255,.15)] px-4 py-3 font-mono text-xs uppercase tracking-wide text-dim">
              Evidence graph
            </p>
            <div className="flex-1 overflow-hidden">
              <EvidenceGraph state={state} />
            </div>
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