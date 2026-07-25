"use client";

import { useState } from "react";
import { FIXTURES } from "@/lib/fixtures";
import type { StreamEvent } from "@/lib/types";

const PRESETS = [
  { tag: "SAMPLE 01", chip: "Audit a ChatGPT answer", fixtureId: "fabrication" },
  { tag: "SAMPLE 02", chip: "Check a news claim", fixtureId: "mixed" },
  { tag: "SAMPLE 03", chip: "Try a tricky one", fixtureId: "clean" },
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
    if (!text.trim()) return;
    const fixture = FIXTURES.find((f) => f.id === fixtureId);
    onStart(fixture?.events);
  };

  return (
    <div className="relative z-10 mx-auto max-w-[1100px] px-7 pb-24">
        {/* status bar */}
        <div className="flex items-center justify-between border-b border-[rgba(120,160,255,.15)] py-4 text-[11px] uppercase tracking-[.18em] text-[#7c88a8]">
          <span>SYSTEM // TRIBUNAL‑CORE v2.6</span>
          <span className="flex items-center gap-2 font-semibold text-[#2be6a6]">
            <span className="tribunal-dot-live" />
            12 agents online
          </span>
        </div>

        {/* hero */}
        <div className="py-16 text-center">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-[.32em] text-[#3fe0ff]">
            Autonomous Multi‑Agent Verification
          </div>
          <h1 className="mx-auto font-[family-name:var(--font-display)] text-[clamp(38px,6.4vw,70px)] font-bold leading-[1.04] text-white">
            Every claim gets
            <br />
            <em className="bg-gradient-to-r from-[#3fe0ff] to-[#a86bff] bg-clip-text italic text-transparent">
              cross‑examined.
            </em>
          </h1>
          <p className="mx-auto mt-5 max-w-[540px] text-[14.5px] leading-[1.75] text-[#7c88a8]">
            Submit any claim or AI-generated answer. Twelve independent agents research it in
            parallel, trace it to primary sources, and converge on a verdict — typically in under
            four seconds.
          </p>
        </div>

        {/* intake console */}
        <div className="mx-auto mb-6 max-w-[720px] rounded-[10px] border border-[rgba(120,160,255,.2)] bg-gradient-to-b from-[#111629] to-[#0d1120] p-6 pb-5 shadow-[0_30px_70px_-30px_rgba(0,0,0,.7)]">
          <div className="mb-3 flex items-center justify-between text-[10.5px] uppercase tracking-[.16em] text-[#7c88a8]">
            <span>
              <span className="text-[#3fe0ff]">INPUT</span> // claim.txt
            </span>
            <span>encoding: utf‑8</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setFixtureId(null);
            }}
            placeholder="Paste the claim or AI answer to verify…"
            rows={6}
            className="w-full resize-y rounded-lg border border-[rgba(120,160,255,.18)] bg-[rgba(8,11,20,.5)] p-4 text-[14.5px] leading-[1.75] text-[#dfe6f5] outline-none placeholder:text-[#7c88a8] focus:border-[#3fe0ff]"
          />
        </div>

        {/* submit */}
        <div className="mb-14 text-center">
          <button
            onClick={handleStart}
            className="tribunal-submit-btn rounded-lg bg-gradient-to-r from-[#3fe0ff] to-[#2be6a6] px-10 py-4 text-[14px] font-semibold uppercase tracking-[.14em] text-[#04141b] transition-transform hover:-translate-y-0.5"
          >
            ▶ Run Verification
          </button>
          <span className="mt-3.5 block text-[11px] tracking-[.1em] text-[#7c88a8]">
            12 agents · parallel research · full source trace
          </span>
        </div>

        {/* sample queries */}
        <div className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PRESETS.map((p) => (
            <button
              key={p.fixtureId}
              onClick={() => pickPreset(p.fixtureId)}
              className={`rounded-[10px] border bg-[#111629] p-[18px] text-left transition-all hover:-translate-y-1 hover:border-[#3fe0ff] hover:shadow-[0_20px_40px_-22px_rgba(63,224,255,.4)] ${
                fixtureId === p.fixtureId ? "border-[#3fe0ff]" : "border-[rgba(120,160,255,.15)]"
              }`}
            >
              <span className="mb-2 block text-[10px] font-semibold tracking-[.18em] text-[#a86bff]">
                {p.tag}
              </span>
              <span className="font-[family-name:var(--font-display)] text-[17px] text-white">
                {p.chip}
              </span>
            </button>
          ))}
        </div>

        {/* footer */}
        <div className="border-t border-[rgba(120,160,255,.15)] pt-4 text-center text-[11px] uppercase tracking-[.2em] text-[#7c88a8]">
          <b className="text-[#3fe0ff]">12 agents</b> &nbsp;·&nbsp; <b className="text-[#3fe0ff]">~4s</b> avg
          verification &nbsp;·&nbsp; every claim <b className="text-[#3fe0ff]">source‑traced</b>
        </div>
    </div>
  );
}