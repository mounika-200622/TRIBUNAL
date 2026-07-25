"use client";

import { useTribunal } from "./hooks/useTribunal";
import { Landing } from "./components/Landing";
import { TribunalView } from "./components/TribunalView";
import { ErrorState } from "./components/ErrorState";
import { TribunalBackground } from "./components/TribunalBackground";

export default function Home() {
  const { state, started, start } = useTribunal();

  return (
    <main className="relative min-h-screen bg-[#080b14] text-[#dfe6f5]">
      <TribunalBackground />
      {!started && <Landing onStart={start} />}
      {started && state.error && (
        <ErrorState message={state.error} onRetry={() => window.location.reload()} />
      )}
      {started && !state.error && <TribunalView state={state} />}
    </main>
  );
}