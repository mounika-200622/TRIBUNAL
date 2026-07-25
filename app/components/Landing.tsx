"use client";

import { useState } from "react";
import { FIXTURES } from "@/lib/fixtures";
import type { StreamEvent } from "@/lib/types";

const PRESETS = [
  { chip: "Audit a ChatGPT answer", fixtureId: "fabrication" },
  { chip: "Check a news claim", fixtureId: "mixed" },
  { chip: "Try a tricky one", fixtureId: "clean" },
];

export function Landing({ onStart }: { onStart: (events?: StreamEvent[]) => void }) {
  const [text, setText] = useState("");
  const [fixtureId, setFixtureId] = useState<string | null>(null);

  const pickPreset = (id: string) => {
    const fixture = FIXTURES.find((f) => f.id === id);
    if (!fixture) return;
    setText(fixture.text);
    setFixtureId(id);
  };

  const handleStart = () => {
    const fixture = FIXTURES.find((f) => f.id === fixtureId);
    onStart(fixture?.events);
  };

  return (
    <section className="mx-auto flex min-h-[80vh] w-full max-w-2xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        Every claim gets a trial.
      </h1>
      <p className="mt-3 text-lg text-dim">
        Paste any AI answer. We&apos;ll put it on trial.
      </p>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setFixtureId(null);
        }}
        placeholder="Paste an AI answer or a claim to check…"
        rows={6}
        className="mt-8 w-full rounded-xl border border-line bg-panel p-4 text-paper placeholder:text-dim focus:border-accent focus:outline-none"
      />

      <button
        onClick={handleStart}
        disabled={!text.trim()}
        className="mt-4 w-full rounded-lg bg-accent px-6 py-3 font-display font-bold text-white disabled:opacity-40 sm:w-auto"
      >
        Convene the tribunal
      </button>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.fixtureId}
            onClick={() => pickPreset(p.fixtureId)}
            className="rounded-full border border-line px-3 py-1.5 text-sm text-dim hover:border-accent hover:text-paper"
          >
            {p.chip}
          </button>
        ))}
      </div>

      <p className="mt-8 font-mono text-xs uppercase tracking-wide text-dim">
        12 agents · 4 seconds · every claim sourced
      </p>
    </section>
  );
}