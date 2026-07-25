"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TribunalState } from "@/lib/reducer";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

const VERDICT_COLOR: Record<string, string> = {
  supported: "#1fc16b",
  refuted: "#ff5a5f",
  unverifiable: "#ffc83a",
};

const STANCE_COLOR: Record<string, string> = {
  supports: "#1fc16b",
  contradicts: "#ff5a5f",
  neutral: "#8b93a3",
};

function SkeletonNodes() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="flex gap-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-12 w-12 animate-pulse rounded-full bg-accent/30"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <p className="font-mono text-xs uppercase tracking-wide text-dim">
        Decomposing into claims…
      </p>
    </div>
  );
}

export function EvidenceGraph({ state }: { state: TribunalState }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const updateSize = () => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const claimNodes = state.claims.map((c) => ({
      id: c.id,
      kind: "claim" as const,
      label: c.text.slice(0, 40) + (c.text.length > 40 ? "…" : ""),
      verdict: c.verdict,
      status: c.status,
      val: 6 + c.sources.length,
    }));

    const sourceNodes = state.claims.flatMap((c) =>
      c.sources.map((s) => ({
        id: s.id,
        kind: "source" as const,
        label: s.domain,
        stance: s.stance,
        val: 3,
      })),
    );

    const links = state.claims.flatMap((c) =>
      c.sources.map((s) => ({
        source: c.id,
        target: s.id,
        stance: s.stance,
      })),
    );

    return { nodes: [...claimNodes, ...sourceNodes], links };
  }, [state.claims]);

  const showSkeleton = state.claims.length === 0;

  return (
    <div ref={containerRef} className="h-full w-full">
      {showSkeleton && <SkeletonNodes />}

      {!showSkeleton && size.width > 0 && (
        <ForceGraph2D
          width={size.width}
          height={size.height}
          graphData={graphData}
          backgroundColor="#08090c"
          nodeRelSize={4}
          cooldownTicks={reducedMotion ? 0 : Infinity}
          linkColor={(l: any) => STANCE_COLOR[l.stance] ?? "#8b93a3"}
          linkWidth={1.5}
          nodeLabel={(n: any) => n.label}
          nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D) => {
            if (node.x === undefined || node.y === undefined) return;

            const baseR = 3 + Math.sqrt(node.val ?? 3) * 2;
            const fill =
              node.kind === "claim"
                ? node.verdict
                  ? VERDICT_COLOR[node.verdict]
                  : "#7b61ff"
                : "#8b93a3";

            ctx.beginPath();
            ctx.arc(node.x, node.y, baseR, 0, 2 * Math.PI);
            ctx.fillStyle = fill;
            ctx.fill();

            const isPending = node.kind === "claim" && node.status !== "done";
            if (isPending && !reducedMotion) {
              const t = (Date.now() % 1200) / 1200;
              const pulseR = baseR + 3 + t * 8;
              ctx.beginPath();
              ctx.arc(node.x, node.y, pulseR, 0, 2 * Math.PI);
              ctx.strokeStyle = "#7b61ff";
              ctx.lineWidth = 1.5;
              ctx.globalAlpha = 1 - t;
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }}
        />
      )}
    </div>
  );
}