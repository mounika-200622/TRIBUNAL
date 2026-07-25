"use client";

import { useCallback, useReducer, useRef, useState } from "react";
import { mockTribunal } from "@/lib/mock";
import { initialState, reduce, counts } from "@/lib/reducer";
import type { StreamEvent } from "@/lib/types";

export function useTribunal() {
  const [state, dispatch] = useReducer(reduce, initialState);
  const [started, setStarted] = useState(false);
  const cancelRef = useRef<() => void>(() => {});

  const start = useCallback((events?: StreamEvent[]) => {
    setStarted(true);
    // TODAY: mock data. LATER: streamTribunal(text, dispatch) — one line change.
    cancelRef.current = mockTribunal((e) => dispatch(e), events);
  }, []);

  return { state, started, start, counts: counts(state) };
}