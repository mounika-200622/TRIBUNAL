"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * The opening screen.
 *
 * A field of characters sampled from a video loop, drawn twice: once dim
 * across the whole frame, and once at full strength clipped to the letters of
 * TRIBUNAL, so the wordmark reads as a window onto the motion behind it.
 *
 * The word is painted into the canvas rather than laid out in the DOM,
 * because the mask has to register with it exactly. A visually hidden heading
 * carries the text for anyone not looking at pixels.
 *
 * The section is held on screen by a taller wrapper and position:sticky, so
 * the reveal cannot be scrolled past. Nothing here moves the page: scrolling
 * stays on the compositor where the browser can keep it smooth, and the field
 * is free to drop frames without dragging the scroll down with it.
 *
 * Costs were measured rather than assumed. At this cell size the field takes
 * roughly 13ms to draw and the video readback roughly 8ms, against a 16.7ms
 * frame, so the two are deliberately kept off the same frame as each other.
 */

const RAMP = " .,-+=*TRIBUNAL2025";
const CELL = 18;
const INK = "196,190,178";
const WORD = "TRIBUNAL";
const FACE = '"Bootzy Condensed TM", Haettenschweiler, Impact, sans-serif';
const BUCKETS = 7;

// fluid
const M_RADIUS = 0.25;
const PRESSURE = 0.985;
const CURL = 0.3;
const FORCE = 11;
const PUSH = 0.3;
const DT = 0.42;
const VISC = 3;
const VMAX = 0.34;

export function AsciiHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tagRef = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!cv || !wrap) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const src = document.createElement("canvas");
    const s = src.getContext("2d", { willReadFrequently: true })!;
    const asc = document.createElement("canvas");
    const msk = document.createElement("canvas");
    const atlas = document.createElement("canvas");
    let a: CanvasRenderingContext2D | null = null;
    let m: CanvasRenderingContext2D | null = null;

    let W = 0, H = 0, cols = 0, rows = 0, dpr = 1, wordPx = 10;
    let lum!: Float32Array, curl!: Float32Array;
    let vx!: Float32Array, vy!: Float32Array, nx!: Float32Array, ny!: Float32Array;
    let mcx = -999, mcy = -999, pmx = 0, pmy = 0, haveM = false;
    let lastGrab = 0, lastDraw = 0, reveal = 0, tagOn = false;
    let fade = 1, inHero = true;
    let lockTop = 0, lockPx = 1, lockEnd = 0;
    let raf = 0;

    const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const ease = (t: number) => t * t * (3 - 2 * t);

    // Baked once. Per-cell fillText was costing thousands of shaping calls.
    function bakeAtlas() {
      atlas.width = RAMP.length * CELL;
      atlas.height = CELL;
      const at = atlas.getContext("2d")!;
      at.clearRect(0, 0, atlas.width, atlas.height);
      at.font = `${CELL + 1}px arial, sans-serif`;
      at.textAlign = "center";
      at.textBaseline = "middle";
      at.fillStyle = `rgb(${INK})`;
      for (let i = 0; i < RAMP.length; i++) {
        const ch = RAMP.charAt(i);
        if (ch === " ") continue;
        at.fillText(ch, i * CELL + CELL / 2, CELL / 2);
      }
    }

    function fitWord() {
      ctx!.font = `100px ${FACE}`;
      const w100 = ctx!.measureText(WORD).width || 100;
      wordPx = Math.min((100 * (W * 0.82)) / w100, H * 0.74);
    }

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv!.clientWidth;
      H = cv!.clientHeight;
      if (W < 4 || H < 4) return;
      cv!.width = Math.round(W * dpr);
      cv!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // The field renders at 1x and is scaled on composite. At this cell size
      // the extra device pixels buy nothing and cost four times the fill.
      asc.width = msk.width = Math.round(W);
      asc.height = msk.height = Math.round(H);
      a = asc.getContext("2d");
      m = msk.getContext("2d");
      cols = Math.max(1, Math.ceil(W / CELL));
      rows = Math.max(1, Math.ceil(H / CELL));
      src.width = cols;
      src.height = rows;
      const n = cols * rows;
      lum = new Float32Array(n);
      curl = new Float32Array(n);
      vx = new Float32Array(n);
      vy = new Float32Array(n);
      nx = new Float32Array(n);
      ny = new Float32Array(n);
      fitWord();
    }

    // Cached here so the loop never touches layout.
    function measure() {
      lockTop = wrap!.offsetTop;
      lockPx = Math.max(1, wrap!.offsetHeight - window.innerHeight);
      lockEnd = lockTop + lockPx;
    }

    function grab() {
      const v = videoRef.current;
      if (!v || v.readyState < 2 || !v.videoWidth) return;
      const sc = Math.max(cols / v.videoWidth, rows / v.videoHeight);
      const dw = v.videoWidth * sc, dh = v.videoHeight * sc;
      s.fillStyle = "#000";
      s.fillRect(0, 0, cols, rows);
      s.drawImage(v, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
      const d = s.getImageData(0, 0, cols, rows).data;
      // The raw frame sits in a narrow mid band, which renders as flat noise.
      // Stretching black and white apart is what lets form appear.
      const BLK = 0.16, span = 0.8 - 0.16;
      for (let i = 0, p = 0; i < lum.length; i++, p += 4) {
        let L = (d[p] * 0.299 + d[p + 1] * 0.587 + d[p + 2] * 0.114) / 255;
        L = (L - BLK) / span;
        lum[i] = L < 0 ? 0 : L > 1 ? 1 : L;
      }
    }

    function sampleF(f: Float32Array, x: number, y: number) {
      if (x < 0) x = 0;
      if (y < 0) y = 0;
      if (x > cols - 1) x = cols - 1;
      if (y > rows - 1) y = rows - 1;
      const x0 = x | 0, y0 = y | 0;
      const x1 = x0 + 1 < cols ? x0 + 1 : cols - 1;
      const y1 = y0 + 1 < rows ? y0 + 1 : rows - 1;
      const fx = x - x0, fy = y - y0;
      return (
        f[y0 * cols + x0] * (1 - fx) * (1 - fy) + f[y0 * cols + x1] * fx * (1 - fy) +
        f[y1 * cols + x0] * (1 - fx) * fy + f[y1 * cols + x1] * fx * fy
      );
    }
    function sdLine(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
      const pax = px - ax, pay = py - ay, bax = bx - ax, bay = by - ay;
      const dd = bax * bax + bay * bay;
      const h = dd > 1e-9 ? clamp01((pax * bax + pay * bay) / dd) : 0;
      const dx = pax - bax * h, dy = pay - bay * h;
      return Math.sqrt(dx * dx + dy * dy);
    }
    const ss = (e0: number, e1: number, v: number) => {
      const t = clamp01((v - e0) / (e1 - e0));
      return t * t * (3 - 2 * t);
    };
    function blur(f: Float32Array, tmp: Float32Array) {
      for (let y = 1; y < rows - 1; y++)
        for (let x = 1; x < cols - 1; x++) {
          const k = y * cols + x;
          tmp[k] =
            (f[k] * 2 + f[k - 1] + f[k + 1] + f[k - cols] + f[k + cols] +
              (f[k - cols - 1] + f[k - cols + 1] + f[k + cols - 1] + f[k + cols + 1]) * 0.5) * 0.125;
        }
      f.set(tmp);
    }

    function fluid() {
      if (haveM) {
        const au = pmx / cols, av = pmy / rows, bu = mcx / cols, bv = mcy / rows;
        const fx = ((mcx - pmx) / cols) * FORCE, fy = ((mcy - pmy) / rows) * FORCE;
        pmx = mcx;
        pmy = mcy;
        if (Math.abs(fx) > 1e-5 || Math.abs(fy) > 1e-5) {
          for (let y = 0; y < rows; y++)
            for (let x = 0; x < cols; x++) {
              let d = sdLine(x / cols, y / rows, au, av, bu, bv);
              if (d > 1) d = 1;
              const mag = ss(1 - M_RADIUS, 1, 1 - d);
              if (mag <= 0) continue;
              const k = y * cols + x;
              vx[k] += fx * mag;
              vy[k] += fy * mag;
            }
        }
      }

      for (let y = 1; y < rows - 1; y++)
        for (let x = 1; x < cols - 1; x++) {
          const k = y * cols + x;
          curl[k] = vy[k + 1] - vy[k - 1] - (vx[k + cols] - vx[k - cols]);
        }
      for (let y = 1; y < rows - 1; y++)
        for (let x = 1; x < cols - 1; x++) {
          const k = y * cols + x;
          const gx = Math.abs(curl[k + cols]) - Math.abs(curl[k - cols]);
          const gy = Math.abs(curl[k + 1]) - Math.abs(curl[k - 1]);
          const len = Math.sqrt(gx * gx + gy * gy) + 1e-4;
          const c = curl[k] * CURL;
          vx[k] += (gx / len) * c;
          vy[k] += -(gy / len) * c;
        }
      // Curl adds energy every frame. Without a ceiling it compounds and the
      // field tears itself apart after a few seconds.
      for (let i = 0; i < vx.length; i++) {
        if (vx[i] > VMAX) vx[i] = VMAX; else if (vx[i] < -VMAX) vx[i] = -VMAX;
        if (vy[i] > VMAX) vy[i] = VMAX; else if (vy[i] < -VMAX) vy[i] = -VMAX;
      }

      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const k = y * cols + x;
          nx[k] = sampleF(vx, x - vx[k] * cols * DT, y - vy[k] * rows * DT) * PRESSURE;
          ny[k] = sampleF(vy, x - vx[k] * cols * DT, y - vy[k] * rows * DT) * PRESSURE;
        }
      let t = vx; vx = nx; nx = t;
      t = vy; vy = ny; ny = t;

      // Viscosity. Without it the field holds sharp gradients, neighbouring
      // cells read from wildly different places, and it streaks into columns
      // instead of flowing.
      for (let p = 0; p < VISC; p++) {
        blur(vx, nx);
        blur(vy, ny);
      }
    }

    function renderAscii() {
      if (!a) return;
      a.clearRect(0, 0, W, H);
      const N = RAMP.length - 1;
      let curB = -1;
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const k = y * cols + x;
          // Pure displacement: read from where the flow came from, so the
          // characters already there are dragged along rather than new ones
          // being lit on top of them.
          const g = sampleF(lum, x - vx[k] * cols * PUSH, y - vy[k] * rows * PUSH);
          if (g < 0.055) continue;
          let idx = (N * g) | 0;
          if (idx > N) idx = N;
          if (idx === 0) continue;
          let al = 0.14 + g * 0.9;
          if (al > 1) al = 1;
          let b = (al * BUCKETS) | 0;
          if (b >= BUCKETS) b = BUCKETS - 1;
          if (b !== curB) { curB = b; a.globalAlpha = (b + 1) / BUCKETS; }
          a.drawImage(atlas, idx * CELL, 0, CELL, CELL, x * CELL, y * CELL, CELL, CELL);
        }
      a.globalAlpha = 1;
    }

    function composite() {
      if (!a || !m) return;
      ctx!.clearRect(0, 0, W, H);
      ctx!.globalAlpha = 0.9 - 0.72 * reveal;
      ctx!.drawImage(asc, 0, 0, W, H);
      ctx!.globalAlpha = 1;
      if (reveal <= 0.002 || !inHero) return;

      const fpx = wordPx * (1 + 0.06 * (1 - reveal));
      m.clearRect(0, 0, W, H);
      m.drawImage(asc, 0, 0, W, H);
      m.globalCompositeOperation = "destination-in";
      m.font = `${fpx}px ${FACE}`;
      m.textAlign = "center";
      m.textBaseline = "middle";
      m.fillStyle = "#fff";
      m.fillText(WORD, W / 2, H * 0.47);
      m.globalCompositeOperation = "source-atop";
      m.fillStyle = "rgba(255,90,95,.62)";
      m.fillRect(0, 0, W, H);
      m.globalCompositeOperation = "source-over";

      ctx!.globalAlpha = reveal;
      ctx!.drawImage(msk, 0, 0, W, H);
      // A hairline keeps the word legible where the field behind it is dark.
      ctx!.font = `${fpx}px ${FACE}`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.lineWidth = Math.max(1, fpx * 0.006);
      ctx!.strokeStyle = `rgba(255,90,95,${(0.55 * reveal).toFixed(3)})`;
      ctx!.strokeText(WORD, W / 2, H * 0.47);
      ctx!.globalAlpha = 1;
    }

    // Reads position only. The page is moved by the browser, not by this.
    function scrollStep() {
      const y = window.pageYOffset;
      const p = clamp01((y - lockTop) / lockPx);
      const target = ease(clamp01(p * 1.7));
      reveal += (target - reveal) * 0.22;

      // past the lock the field recedes to a texture and stays there, so the
      // rest of the page has a ground instead of flat black
      const past = clamp01((y - lockEnd) / (window.innerHeight * 0.7));
      const wantFade = 1 - 0.87 * ease(past);
      if (Math.abs(wantFade - fade) > 0.002) {
        fade = wantFade;
        cv!.style.opacity = fade.toFixed(3);
      }
      inHero = past < 0.999;
      const want = target > 0.5;
      if (want !== tagOn) {
        tagOn = want;
        tagRef.current?.classList.toggle("is-on", want);
      }
    }

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      scrollStep();
      // Kept off the same frame as each other, so the worst single frame is
      // one of them rather than the sum.
      if (now - lastGrab >= 96) { lastGrab = now; grab(); fluid(); return; }
      if (now - lastDraw >= 48) { lastDraw = now; renderAscii(); composite(); }
    }

    const onPointer = (ev: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const ncx = ((ev.clientX - r.left) / r.width) * cols;
      const ncy = ((ev.clientY - r.top) / r.height) * rows;
      if (!haveM) { pmx = ncx; pmy = ncy; haveM = true; }
      mcx = ncx;
      mcy = ncy;
    };

    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => { build(); measure(); }, 160);
    };

    bakeAtlas();
    build();
    measure();
    if (document.fonts?.ready) document.fonts.ready.then(() => { fitWord(); measure(); });

    const ro = new ResizeObserver(() => {
      if (cv.clientWidth > 2 && (Math.abs(cv.clientWidth - W) > 1 || Math.abs(cv.clientHeight - H) > 1)) {
        build(); measure(); grab(); renderAscii(); composite();
      }
    });
    ro.observe(cv);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", measure);

    if (reduce) {
      reveal = 1;
      const t = setTimeout(() => { grab(); renderAscii(); composite(); }, 500);
      return () => {
        clearTimeout(t);
        ro.disconnect();
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("load", measure);
      };
    }

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(rt);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", measure);
    };
  }, [reduce]);

  return (
    <div ref={wrapRef} className="tb-lock">
      <section className="tb-open">
        <canvas ref={canvasRef} className="tb-open-canvas" aria-hidden />
        <video
          ref={videoRef}
          className="tb-open-src"
          src="/hero/eye-loop.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden
        />

        <div className="tb-open-rail">
          <span className="tb-mono">[TRIBUNAL_25]</span>
          <span className="tb-open-mark">Tribunal&reg;</span>
          <span className="tb-mono">[4P] [1D] [1J]</span>
        </div>

        <div className="tb-open-stack">
          <h1 className="sr-only">Tribunal</h1>
          <p ref={tagRef} className="tb-open-tagline">
            Every claim gets <em>cross&#8209;examined.</em>
          </p>
        </div>

        <div className="tb-open-foot">
          <span className="tb-mono">[PUT A CLAIM ON TRIAL]</span>
          <div className="tb-open-foot-r">
            <span className="tb-mono">[SCROLL]</span>
            <p>Keep going &darr;<br />To put one on trial.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
