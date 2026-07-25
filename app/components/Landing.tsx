"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { FIXTURES, type Fixture } from "@/lib/fixtures";
import { AsciiHero } from "./AsciiHero";

/**
 * The intake.
 *
 * Left-weighted rather than centred, so the eye lands on the claim you are
 * about to submit instead of drifting down a column of centred blocks. The
 * scale runs off one viewport-relative unit, so the proportions hold at any
 * zoom level rather than only at 100%.
 *
 * The three worked examples are a docket, not a card grid: they are an ordered
 * set of exhibits, and a list says that where three equal boxes do not.
 */

const EXHIBITS = [
  {
    id: "fabrication",
    ref: "I",
    title: "An answer from a chatbot",
    note: "Cites a study that was never published",
  },
  {
    id: "mixed",
    ref: "II",
    title: "A mixed passage",
    note: "True, stale and mythical claims together",
  },
  {
    id: "clean",
    ref: "III",
    title: "A sound passage",
    note: "Holds up, and the panel says so",
  },
];

export function Landing({
  onStart,
}: {
  onStart: (text: string, fixture?: Fixture) => void;
}) {
  const [text, setText] = useState("");
  const [fixtureId, setFixtureId] = useState<string | null>(null);
  const reduce = useReducedMotion();

  // The button leans toward the cursor. Motion values rather than state, so
  // this never re-renders the tree on pointer move.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 240, damping: 26 });
  const y = useSpring(my, { stiffness: 240, damping: 26 });
  const ctaRef = useRef<HTMLButtonElement>(null);

  const lean = (e: React.PointerEvent) => {
    if (reduce || !ctaRef.current) return;
    const r = ctaRef.current.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.14);
    my.set((e.clientY - (r.top + r.height / 2)) * 0.14);
  };
  const settle = () => {
    mx.set(0);
    my.set(0);
  };

  const pick = (id: string) => {
    const fixture = FIXTURES.find((f) => f.id === id);
    if (!fixture) return;
    setText(fixture.text);
    setFixtureId(id);
  };

  const handleStart = () => {
    if (!text.trim()) return;
    // A preset stays a preset only while its text is untouched. Edit it and the
    // trial should go to the real engine, not replay a recording of something
    // you no longer typed.
    const fixture = FIXTURES.find((f) => f.id === fixtureId && f.text === text);
    onStart(text, fixture);
  };

  return (
    <>
      <AsciiHero />

      <div className="tb-page relative z-10">
        <div aria-hidden className="tb-grain" />

      <div
        className="mx-auto w-full"
        style={{ maxWidth: "calc(var(--u) * 82)", padding: "0 var(--gut)" }}
      >
        {/* the spine: what is sitting, and what it is made of */}
        <header
          className="flex items-baseline justify-between"
          style={{ paddingTop: "calc(var(--u) * 2)", paddingBottom: "calc(var(--u) * 1.2)" }}
        >
          <span
            className="font-body uppercase text-paper"
            style={{ fontSize: "calc(var(--u) * 0.78)", letterSpacing: "0.34em" }}
          >
            Tribunal
          </span>
          <span
            className="font-body uppercase text-dim"
            style={{ fontSize: "calc(var(--u) * 0.7)", letterSpacing: "0.2em" }}
          >
            4 prosecutors · 1 defense · 1 judge
          </span>
        </header>
        <div className="tb-rule" />

        {/* the thesis */}
        <div
          className="tb-hero grid items-end gap-x-[var(--gut)]"
          style={{
            gridTemplateColumns: "minmax(0,7fr) minmax(0,4fr)",
            paddingTop: "calc(var(--u) * 5.5)",
            paddingBottom: "calc(var(--u) * 3.2)",
          }}
        >
          <h1
            className="tb-mask font-display text-paper"
            style={{
              fontSize: "calc(var(--u) * 4.5)",
              lineHeight: 1.02,
              letterSpacing: "-0.018em",
              textWrap: "balance",
              paddingBottom: "0.12em",
            }}
          >
            Every claim gets{" "}
            <em className="italic" style={{ color: "var(--color-refuted)" }}>
              cross&#8209;examined.
            </em>
          </h1>

          <p
            className="tb-mask font-body text-dim"
            style={{
              ["--mask-delay" as string]: "0.14s",
              fontSize: "calc(var(--u) * 0.95)",
              lineHeight: 1.68,
              maxWidth: "34ch",
            }}
          >
            Four prosecutors and a defense argue every claim in parallel. A judge
            rules. Sources attached.
          </p>
        </div>

        {/* the submission */}
        <div
          className="tb-mask"
          style={{ ["--mask-delay" as string]: "0.24s" }}
        >
          <label
            htmlFor="claim"
            className="block font-body uppercase text-dim"
            style={{ fontSize: "calc(var(--u) * 0.7)", letterSpacing: "0.22em" }}
          >
            Submission
          </label>
          <textarea
            id="claim"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setFixtureId(null);
            }}
            placeholder="Paste a claim, or any answer you want checked"
            rows={4}
            className="w-full resize-y bg-transparent font-serif text-paper outline-none placeholder:text-dim/70"
            style={{
              marginTop: "calc(var(--u) * 0.7)",
              fontSize: "calc(var(--u) * 1.32)",
              lineHeight: 1.5,
              borderBottom: "1px solid var(--color-line)",
              paddingBottom: "calc(var(--u) * 0.9)",
            }}
          />

          <div
            className="flex flex-wrap items-center"
            style={{ gap: "calc(var(--u) * 1.6)", marginTop: "calc(var(--u) * 1.8)" }}
          >
            <motion.button
              ref={ctaRef}
              onClick={handleStart}
              onPointerMove={lean}
              onPointerLeave={settle}
              disabled={!text.trim()}
              className="tb-convene font-body uppercase"
              style={{
                x,
                y,
                fontSize: "calc(var(--u) * 0.78)",
                letterSpacing: "0.2em",
              }}
            >
              Convene the panel
              <span className="well" aria-hidden>
                <svg
                  width="calc(var(--u) * 0.8)"
                  height="calc(var(--u) * 0.8)"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M4 12L12 4M12 4H6M12 4v6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                </svg>
              </span>
            </motion.button>
          </div>
        </div>

        {/* the docket */}
        <section
          className="tb-mask"
          style={{
            ["--mask-delay" as string]: "0.34s",
            marginTop: "calc(var(--u) * 5)",
          }}
        >
          <h2
            className="font-body uppercase text-dim"
            style={{ fontSize: "calc(var(--u) * 0.7)", letterSpacing: "0.22em" }}
          >
            Or take one from the docket
          </h2>
          <div style={{ marginTop: "calc(var(--u) * 0.6)" }}>
            {EXHIBITS.map((x) => (
              <div key={x.id} className="tb-rule-trigger">
                <div className="tb-rule">
                  <i />
                </div>
                <button
                  onClick={() => pick(x.id)}
                  data-picked={fixtureId === x.id}
                  className="tb-docket-row"
                >
                  <span
                    className="tb-docket-label font-body"
                    style={{ fontSize: "calc(var(--u) * 0.72)", letterSpacing: "0.16em" }}
                  >
                    {x.ref}
                  </span>
                  <span
                    className="tb-docket-label font-serif"
                    style={{ fontSize: "calc(var(--u) * 1.18)" }}
                  >
                    {x.title}
                  </span>
                  <span
                    className="font-body text-dim"
                    style={{ fontSize: "calc(var(--u) * 0.76)" }}
                  >
                    {x.note}
                  </span>
                </button>
              </div>
            ))}
            <div className="tb-rule" />
          </div>
        </section>

        <div style={{ height: "calc(var(--u) * 6)" }} />
      </div>
    </div>
    </>
  );
}
