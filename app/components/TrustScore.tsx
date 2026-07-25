"use client";

import { useRef, useState } from "react";
import type { TribunalState } from "@/lib/reducer";
import { counts } from "@/lib/reducer";

function verdictSentence(score: number) {
  if (score >= 80) return "This answer is highly reliable.";
  if (score >= 55) return "This answer is mostly reliable.";
  if (score >= 30) return "This answer is mixed — verify before trusting it.";
  return "This answer is mostly unreliable.";
}

export function TrustScore({ state }: { state: TribunalState }) {
  const c = counts(state);
  const score = state.trustScore ?? 0;
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const color =
    score >= 55 ? "text-supported" : score >= 30 ? "text-unverifiable" : "text-refuted";

  const handleShare = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#08090c",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = "tribunal-verdict.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      alert("Couldn't generate the image. Try a screenshot instead.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-10">
      <div
        ref={cardRef}
        className="rounded-2xl border border-line bg-panel p-8 text-center"
      >
        <p className="font-mono text-xs uppercase tracking-wide text-dim">
          Trust score
        </p>
        <p className={`mt-2 font-display text-7xl font-extrabold ${color}`}>
          {score}
        </p>
        <p className="mt-2 text-paper">{verdictSentence(score)}</p>

        <p className="mt-6 font-mono text-xs text-dim">
          {c.total} claims · {c.supported} supported · {c.refuted} refuted ·{" "}
          {c.unverifiable} unverifiable
        </p>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-dim">
          Tribunal
        </p>
      </div>

      <button
        onClick={handleShare}
        disabled={downloading}
        className="mx-auto mt-6 block rounded-lg border border-accent px-6 py-2.5 font-display font-bold text-accent hover:bg-accent hover:text-white disabled:opacity-50"
      >
        {downloading ? "Generating…" : "Share verdict"}
      </button>
    </div>
  );
}