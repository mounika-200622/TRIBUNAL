"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { replayFixture, type Fixture } from "@/lib/fixtures";
import { streamTribunal } from "@/lib/stream";
import { initialState, reduce, counts } from "@/lib/reducer";

/**
 * Two ways a trial can run, one reducer.
 *
 * A preset replays a recorded fixture — a real trial captured from the live
 * pipeline, so it is instant and identical every time. That is what the demo
 * runs on: no rate limit or slow retrieval can spoil it.
 *
 * Anything the user types goes to the real engine over SSE. Both paths emit the
 * same events into the same fold, so every component is oblivious to which one
 * is playing.
 */
export function useTribunal() {
  const [state, dispatch] = useReducer(reduce, initialState);
  const [started, setStarted] = useState(false);
  const [live, setLive] = useState(false);
  const cancelRef = useRef<() => void>(() => {});

  const start = useCallback((text: string, fixture?: Fixture) => {
    cancelRef.current();
    setStarted(true);

    if (fixture) {
      setLive(false);
      cancelRef.current = replayFixture(fixture, dispatch);
      return;
    }

    setLive(true);
    cancelRef.current = streamTribunal(text, dispatch);
  }, []);

  // Never leave a stream running behind a closed page.
  useEffect(() => () => cancelRef.current(), []);

  return { state, started, live, start, counts: counts(state) };
}
