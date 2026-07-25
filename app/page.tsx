"use client";

import { useTribunal } from "./hooks/useTribunal";
import { Landing } from "./components/Landing";

export default function Home() {
  const { state, started, start, counts } = useTribunal();

  return (
    <main className="min-h-screen">
      {!started && <Landing onStart={start} />}
      {started && (
        <p className="p-6 font-mono text-sm text-dim">
          {counts.settled}/{counts.total} settled — tribunal screen coming in Step 3
        </p>
      )}
    </main>
  );
}