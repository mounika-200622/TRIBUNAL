"use client";

import type { Source } from "@/lib/types";

export function SourceChip({ source }: { source: Source }) {
  const favicon = "https://www.google.com/s2/favicons?domain=" + source.domain;
  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded border border-line px-2 py-1 font-mono text-xs text-dim hover:border-accent hover:text-paper">
      <img src={favicon} alt="" className="h-3 w-3" />
      {source.domain}
    </a>
  );
}