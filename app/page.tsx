"use client";

import { useTribunal } from "./hooks/useTribunal";
import { Landing } from "./components/Landing";
import { TribunalView } from "./components/TribunalView";
import { ErrorState } from "./components/ErrorState";

export default function Home() {
  const { state, started, start } = useTribunal();

  return (
    <main className="relative min-h-screen bg-void text-paper">
      {!started && <Landing onStart={start} />}
      {started && state.error && (
        <ErrorState message={state.error} onRetry={() => window.location.reload()} />
      )}
      {started && !state.error && <TribunalView state={state} />}
    </main>
  );
}