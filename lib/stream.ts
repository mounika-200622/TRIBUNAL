import type { StreamEvent } from "./types";

/**
 * The live engine, shaped exactly like `mockTribunal` so switching between them
 * is a one-line change in the UI:
 *
 *   mockTribunal((e) => dispatch(e))          // scripted
 *   streamTribunal(text, (e) => dispatch(e))  // real
 *
 * Returns a cancel function.
 */
export function streamTribunal(
  text: string,
  onEvent: (e: StreamEvent) => void,
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch("/api/tribunal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const msg = await res
          .json()
          .then((j) => j.error)
          .catch(() => null);
        onEvent({ type: "error", message: msg ?? "The tribunal could not be convened." });
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });

        // SSE frames are separated by a blank line; keep any partial tail.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          try {
            onEvent(JSON.parse(line.slice(6)) as StreamEvent);
          } catch {
            // A malformed frame costs one event, not the trial.
          }
        }
      }
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") {
        onEvent({ type: "error", message: "Connection to the tribunal was lost." });
      }
    }
  })();

  return () => controller.abort();
}
