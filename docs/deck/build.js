const pptxgen = require("pptxgenjs");

/* Palette lifted from the product itself, so the deck and the thing it is
   describing are recognisably the same object. Warm near-black rather than
   blue-black, bone rather than white, and one signal red that means exactly
   what it means in the app: refuted. */
const VOID = "0A0A09";
const PANEL = "161513";
const BONE = "E9E6DF";
const MUTED = "8D8A83";
const RED = "E8232F";
const GREEN = "38B98A";
const LINE = "2A2825";

const TITLE_FONT = "Arial";
const BODY_FONT = "Calibri";
const MONO = "Courier New";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "Tribunal";
pres.title = "Tribunal";

const dark = (s) => s.background = { color: VOID };

/* The repeated motif: a bracketed mono tag, the same device the interface
   uses for every label. Not a stripe, not a rule. */
function tag(s, text, x, y, color) {
  s.addText(text, {
    x, y, w: 6, h: 0.28, margin: 0,
    fontFace: MONO, fontSize: 11, color: color || RED, charSpacing: 2,
  });
}

function title(s, text, y) {
  s.addText(text, {
    x: 0.7, y: y || 1.0, w: 11.9, h: 1.1, margin: 0,
    fontFace: TITLE_FONT, fontSize: 40, bold: true, color: BONE,
  });
}

// ── 1 · title ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide(); dark(s);
  tag(s, "[ TRIBUNAL_25 ]", 0.7, 0.55, MUTED);
  s.addText("TRIBUNAL", {
    x: 0.7, y: 1.9, w: 12, h: 1.9, margin: 0,
    fontFace: TITLE_FONT, fontSize: 115, bold: true, color: RED, charSpacing: 3,
  });
  s.addText("Every claim gets cross-examined.", {
    x: 0.75, y: 3.75, w: 11, h: 0.6, margin: 0,
    fontFace: BODY_FONT, fontSize: 26, italic: true, color: BONE,
  });
  s.addText("Adversarial multi-agent verification for AI-generated answers.", {
    x: 0.75, y: 4.45, w: 11, h: 0.5, margin: 0,
    fontFace: BODY_FONT, fontSize: 16, color: MUTED,
  });
  s.addShape(pres.ShapeType.line, {
    x: 0.7, y: 5.5, w: 11.9, h: 0, line: { color: LINE, width: 1 },
  });
  s.addText("InnovaHack Chapter 1   ·   Domain 3, Gen AI PS1   ·   tribunal-pink.vercel.app", {
    x: 0.7, y: 5.7, w: 11.9, h: 0.4, margin: 0,
    fontFace: MONO, fontSize: 11, color: MUTED, charSpacing: 1,
  });
  s.addNotes("Say the line, then move. Do not explain anything yet.");
}

// ── 2 · the problem ──────────────────────────────────────────────────────
{
  const s = pres.addSlide(); dark(s);
  tag(s, "[ 01 · THE PROBLEM ]", 0.7, 0.5);
  title(s, "Confidence is not\ncorrelated with accuracy.", 0.95);

  s.addShape(pres.ShapeType.rect, {
    x: 0.7, y: 3.0, w: 12, h: 1.5, fill: { color: PANEL },
    line: { color: LINE, width: 1 },
  });
  s.addText('"A 2019 Stanford study found that remote workers are 43% more productive."', {
    x: 1.0, y: 3.25, w: 11.4, h: 0.6, margin: 0,
    fontFace: BODY_FONT, fontSize: 19, italic: true, color: BONE,
  });
  s.addText("There is no such study. The year is invented. The 43% belongs to a different experiment that measured 13%.", {
    x: 1.0, y: 3.85, w: 11.4, h: 0.5, margin: 0,
    fontFace: BODY_FONT, fontSize: 14, color: RED,
  });

  const cols = [
    ["An institution", "Borrowed authority the model never earned"],
    ["A precise year", "Specific enough to feel checked"],
    ["A hard number", "The part people quote downstream"],
  ];
  cols.forEach(([h, b], i) => {
    const x = 0.7 + i * 4.05;
    s.addText(h, { x, y: 4.9, w: 3.7, h: 0.35, margin: 0,
      fontFace: TITLE_FONT, fontSize: 16, bold: true, color: BONE });
    s.addText(b, { x, y: 5.28, w: 3.7, h: 0.8, margin: 0,
      fontFace: BODY_FONT, fontSize: 13, color: MUTED });
  });
  s.addText("Nothing in the sentence tells a reader which parts are wrong.", {
    x: 0.7, y: 6.35, w: 12, h: 0.4, margin: 0,
    fontFace: BODY_FONT, fontSize: 15, italic: true, color: BONE,
  });
  s.addNotes("The audience has felt this. Do not oversell it.");
}

// ── 3 · the insight ──────────────────────────────────────────────────────
{
  const s = pres.addSlide(); dark(s);
  tag(s, "[ 02 · THE INSIGHT ]", 0.7, 0.5);
  title(s, "Don't ask a model if it's true.\nMake a panel argue about it.", 0.95);

  s.addText("Asking a second model to grade the first inherits the same blind spots. A single judgement has no internal friction.", {
    x: 0.7, y: 2.95, w: 7.2, h: 0.9, margin: 0,
    fontFace: BODY_FONT, fontSize: 16, color: MUTED,
  });

  const rows = [
    ["4", "PROSECUTORS", "Each locked to one lens, so they cannot all fail the same way", RED],
    ["1", "DEFENSE", "Required to make the strongest honest case for the claim", GREEN],
    ["1", "JUDGE", "Rules on evidence only, never on the volume of attacks", BONE],
  ];
  rows.forEach(([n, label, desc, c], i) => {
    const y = 4.05 + i * 0.95;
    s.addText(n, { x: 0.7, y, w: 0.75, h: 0.7, margin: 0,
      fontFace: TITLE_FONT, fontSize: 40, bold: true, color: c });
    s.addText(label, { x: 1.55, y: y + 0.05, w: 2.4, h: 0.35, margin: 0,
      fontFace: MONO, fontSize: 12, color: c, charSpacing: 1.5 });
    s.addText(desc, { x: 1.55, y: y + 0.36, w: 6.4, h: 0.45, margin: 0,
      fontFace: BODY_FONT, fontSize: 13, color: MUTED });
  });

  s.addShape(pres.ShapeType.rect, {
    x: 8.5, y: 2.95, w: 4.1, h: 3.9, fill: { color: PANEL },
    line: { color: LINE, width: 1 },
  });
  s.addText("The disagreement is\nthe signal.", {
    x: 8.85, y: 3.3, w: 3.4, h: 0.9, margin: 0,
    fontFace: TITLE_FONT, fontSize: 21, bold: true, color: BONE,
  });
  s.addText("When the four lenses diverge, that is measurable uncertainty. We surface it instead of hiding it behind one number.", {
    x: 8.85, y: 4.35, w: 3.4, h: 1.5, margin: 0,
    fontFace: BODY_FONT, fontSize: 13.5, color: MUTED,
  });
  s.addText("No other system reports it.", {
    x: 8.85, y: 6.1, w: 3.4, h: 0.4, margin: 0,
    fontFace: BODY_FONT, fontSize: 13, italic: true, color: RED,
  });
}

// ── 4 · how it works ─────────────────────────────────────────────────────
{
  const s = pres.addSlide(); dark(s);
  tag(s, "[ 03 · HOW IT WORKS ]", 0.7, 0.5);
  title(s, "Six agents per claim,\nrun in parallel.", 0.95);

  const steps = ["Passage in", "Claims extracted", "Retrieval", "Panel argues", "Judge rules"];
  steps.forEach((t, i) => {
    const x = 0.7 + i * 2.46;
    s.addShape(pres.ShapeType.rect, {
      x, y: 2.95, w: 2.2, h: 0.62, fill: { color: PANEL },
      line: { color: i === 3 ? RED : LINE, width: 1 },
    });
    s.addText(t, { x, y: 2.95, w: 2.2, h: 0.62, margin: 0, align: "center",
      fontFace: BODY_FONT, fontSize: 13, color: BONE, valign: "middle" });
  });

  const lenses = [
    ["Source quality", "Can the citation be located at all"],
    ["Temporal staleness", "True once, superseded since"],
    ["Entity conflation", "Two studies collapsed into one"],
    ["Logical leap", "Correlation presented as cause"],
  ];
  s.addText("THE FOUR LENSES", { x: 0.7, y: 4.0, w: 6, h: 0.3, margin: 0,
    fontFace: MONO, fontSize: 11, color: RED, charSpacing: 1.5 });
  lenses.forEach(([h, b], i) => {
    const y = 4.42 + i * 0.62;
    s.addText(h, { x: 0.7, y, w: 2.6, h: 0.3, margin: 0,
      fontFace: TITLE_FONT, fontSize: 14, bold: true, color: BONE });
    s.addText(b, { x: 3.35, y, w: 4.2, h: 0.3, margin: 0,
      fontFace: BODY_FONT, fontSize: 13, color: MUTED });
  });

  s.addShape(pres.ShapeType.rect, {
    x: 8.2, y: 4.0, w: 4.4, h: 2.85, fill: { color: PANEL },
    line: { color: LINE, width: 1 },
  });
  s.addText("Every ruling names the\nfailure, not just the verdict.", {
    x: 8.5, y: 4.3, w: 3.8, h: 0.75, margin: 0,
    fontFace: TITLE_FONT, fontSize: 16, bold: true, color: BONE });
  s.addText("Fabricated citation · Misattribution · Stale fact · Conflated entity · Overgeneralization · Unsupported causal · Common misconception · None", {
    x: 8.5, y: 5.15, w: 3.8, h: 1.2, margin: 0,
    fontFace: BODY_FONT, fontSize: 12.5, color: MUTED });
  s.addText("4.1s median to a full ruling", {
    x: 8.5, y: 6.35, w: 3.8, h: 0.35, margin: 0,
    fontFace: MONO, fontSize: 12, color: RED, charSpacing: 1 });
}

// ── 5 · the proof ────────────────────────────────────────────────────────
{
  const s = pres.addSlide(); dark(s);
  tag(s, "[ 04 · DOES THE PANEL EARN ITS COST? ]", 0.7, 0.5);
  title(s, "We ablated it.", 0.95);
  s.addText("28 gold claims — 8 true, 20 false — across the full failure taxonomy. Same retrieval, same model. Only the reasoning architecture changes.", {
    x: 0.7, y: 2.1, w: 12, h: 0.6, margin: 0,
    fontFace: BODY_FONT, fontSize: 15, color: MUTED,
  });

  s.addChart(pres.ChartType.bar, [{
    name: "Correct",
    labels: ["Full panel", "Single agent", "No retrieval"],
    values: [96.4, 42.9, 32.1],
  }], {
    x: 0.7, y: 2.85, w: 7.3, h: 3.6,
    barDir: "col",
    chartColors: [RED],
    showValue: true, dataLabelPosition: "outEnd",
    dataLabelColor: BONE, dataLabelFontFace: TITLE_FONT,
    dataLabelFontSize: 15, dataLabelFormatCode: '0.0"%"',
    catAxisLabelColor: BONE, catAxisLabelFontFace: BODY_FONT, catAxisLabelFontSize: 13,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 11,
    valAxisMaxVal: 110, valAxisMinVal: 0,
    valGridLine: { color: LINE, size: 1 },
    catGridLine: { style: "none" },
    showLegend: false,
    plotArea: { fill: { color: VOID } },
    chartArea: { fill: { color: VOID } },
  });

  const stats = [
    ["100%", "of false claims caught\nvs 15–25% ablated", RED],
    ["8/8", "prompt injections held\ncontrol vs treatment", BONE],
  ];
  stats.forEach(([n, l, c], i) => {
    const y = 2.95 + i * 1.85;
    s.addText(n, { x: 8.5, y, w: 4.1, h: 0.85, margin: 0,
      fontFace: TITLE_FONT, fontSize: 54, bold: true, color: c });
    s.addText(l, { x: 8.55, y: y + 0.9, w: 4.1, h: 0.7, margin: 0,
      fontFace: BODY_FONT, fontSize: 13, color: MUTED });
  });
  s.addText("Reproduce: npm run eval", {
    x: 8.5, y: 6.5, w: 4.1, h: 0.35, margin: 0,
    fontFace: MONO, fontSize: 11.5, color: MUTED, charSpacing: 1 });

  s.addNotes("This is the slide that wins it. Slow down here.");
}

// ── 6 · the bug ──────────────────────────────────────────────────────────
{
  const s = pres.addSlide(); dark(s);
  tag(s, "[ 05 · WHAT WENT WRONG ]", 0.7, 0.5);
  title(s, "Early on, it refuted\neverything.", 0.95);

  s.addShape(pres.ShapeType.rect, {
    x: 0.7, y: 3.0, w: 5.9, h: 1.25, fill: { color: PANEL },
    line: { color: RED, width: 1 },
  });
  s.addText('"Honey never spoils"', {
    x: 1.0, y: 3.2, w: 5.3, h: 0.4, margin: 0,
    fontFace: BODY_FONT, fontSize: 17, italic: true, color: BONE });
  s.addText("REFUTED · 90% confidence · trust score 3/100", {
    x: 1.0, y: 3.68, w: 5.3, h: 0.4, margin: 0,
    fontFace: MONO, fontSize: 12, color: RED, charSpacing: 1 });

  s.addText("The judge was reading volume as evidence. Four prosecution arguments against one defense looked like a 4–1 verdict.", {
    x: 0.7, y: 4.5, w: 5.9, h: 1.0, margin: 0,
    fontFace: BODY_FONT, fontSize: 14.5, color: MUTED });
  s.addText("But four attacks is the designed output of the system. It is not a signal.", {
    x: 0.7, y: 5.5, w: 5.9, h: 0.8, margin: 0,
    fontFace: BODY_FONT, fontSize: 14.5, color: BONE });

  s.addShape(pres.ShapeType.rect, {
    x: 7.0, y: 3.0, w: 5.6, h: 2.35, fill: { color: PANEL },
    line: { color: LINE, width: 1 },
  });
  s.addText("THE FIX — one paragraph", { x: 7.3, y: 3.2, w: 5.0, h: 0.3, margin: 0,
    fontFace: MONO, fontSize: 11, color: RED, charSpacing: 1.5 });
  s.addText("The prosecutors are REQUIRED to attack. The volume of prosecution arguments is NOT evidence of guilt. Ask only: does the EVIDENCE contradict the claim?", {
    x: 7.3, y: 3.6, w: 5.0, h: 1.6, margin: 0,
    fontFace: MONO, fontSize: 12.5, color: BONE });

  s.addText("True claims now come back supported at 94–99%.", {
    x: 7.0, y: 5.55, w: 5.6, h: 0.4, margin: 0,
    fontFace: BODY_FONT, fontSize: 15, bold: true, color: GREEN });
  s.addText("We corrected our own measurement too: the first injection test counted any non-refutation as a breach. We redesigned it control-vs-treatment and reran.", {
    x: 7.0, y: 6.0, w: 5.6, h: 0.8, margin: 0,
    fontFace: BODY_FONT, fontSize: 12.5, italic: true, color: MUTED });

  s.addNotes("Judges remember teams who debug in public. This is the credibility slide.");
}

// ── 7 · scale ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide(); dark(s);
  tag(s, "[ 06 · COST, SCALE, IMPACT ]", 0.7, 0.5);
  title(s, "What it costs, and\nwhat breaks first.", 0.95);

  const nums = [
    ["6", "model calls\nper claim"],
    ["1", "retrieval call,\nshared by all six"],
    ["4.1s", "median ruling,\nin parallel"],
    ["$0.005", "panel cost per claim,\nbefore the judge"],
  ];
  nums.forEach(([n, l], i) => {
    const x = 0.7 + i * 3.06;
    s.addText(n, { x, y: 2.95, w: 2.8, h: 0.8, margin: 0,
      fontFace: TITLE_FONT, fontSize: 44, bold: true, color: RED });
    s.addText(l, { x: x + 0.04, y: 3.8, w: 2.8, h: 0.7, margin: 0,
      fontFace: BODY_FONT, fontSize: 13, color: MUTED });
  });

  s.addShape(pres.ShapeType.rect, {
    x: 0.7, y: 4.8, w: 6.0, h: 2.0, fill: { color: PANEL },
    line: { color: LINE, width: 1 },
  });
  s.addText("The bottleneck is not inference.", {
    x: 1.0, y: 5.0, w: 5.4, h: 0.35, margin: 0,
    fontFace: TITLE_FONT, fontSize: 16, bold: true, color: BONE });
  s.addText("It is provider rate limits, which are per key AND per model. We know because one evaluation sweep exhausted a 100k token-per-day allowance. The failover chain in lib/config.ts exists because of it.", {
    x: 1.0, y: 5.4, w: 5.4, h: 1.3, margin: 0,
    fontFace: BODY_FONT, fontSize: 13, color: MUTED });

  s.addText("WHO USES IT TODAY", { x: 7.1, y: 4.8, w: 5.5, h: 0.3, margin: 0,
    fontFace: MONO, fontSize: 11, color: RED, charSpacing: 1.5 });
  const who = [
    "Students and researchers, before citing an AI answer",
    "Journalists and editors, running a draft past a panel",
    "Educators, marking work that may be model-written",
    "Anyone shipping an LLM feature, as an eval harness",
  ];
  who.forEach((t, i) => {
    s.addText(t, { x: 7.1, y: 5.22 + i * 0.4, w: 5.5, h: 0.35, margin: 0,
      fontFace: BODY_FONT, fontSize: 13, color: BONE });
  });
  s.addText("A score says don't trust this. A named failure mode says what to do about it.", {
    x: 7.1, y: 6.85, w: 5.5, h: 0.4, margin: 0,
    fontFace: BODY_FONT, fontSize: 12.5, italic: true, color: MUTED });
}

// ── 8 · close ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide(); dark(s);
  tag(s, "[ 07 · TRY IT ]", 0.7, 0.5);
  s.addText("tribunal-pink.vercel.app", {
    x: 0.7, y: 1.5, w: 12, h: 1.2, margin: 0,
    fontFace: TITLE_FONT, fontSize: 52, bold: true, color: RED,
  });
  s.addText("Three cases pre-loaded on the docket. Every one replays a real proceeding.", {
    x: 0.7, y: 2.75, w: 12, h: 0.45, margin: 0,
    fontFace: BODY_FONT, fontSize: 16, color: MUTED,
  });

  const cases = [
    ["I", "An answer from a chatbot", "Cites a study that was never published", RED],
    ["II", "A mixed passage", "True, stale and mythical claims together", RED],
    ["III", "Three that sound wrong", "Bananas are radioactive. All three upheld.", GREEN],
  ];
  cases.forEach(([n, h, b, c], i) => {
    const y = 3.5 + i * 0.82;
    s.addText(n, { x: 0.7, y, w: 0.6, h: 0.5, margin: 0,
      fontFace: MONO, fontSize: 15, color: MUTED });
    s.addText(h, { x: 1.5, y, w: 4.4, h: 0.35, margin: 0,
      fontFace: TITLE_FONT, fontSize: 15, bold: true, color: BONE });
    s.addText(b, { x: 6.1, y, w: 6.5, h: 0.35, margin: 0,
      fontFace: BODY_FONT, fontSize: 13.5, color: c });
    s.addShape(pres.ShapeType.line, {
      x: 0.7, y: y + 0.58, w: 11.9, h: 0, line: { color: LINE, width: 1 },
    });
  });

  s.addText("github.com/mounika-200622/TRIBUNAL", {
    x: 0.7, y: 6.35, w: 7, h: 0.4, margin: 0,
    fontFace: MONO, fontSize: 13, color: BONE, charSpacing: 1 });
  s.addText("Every claim gets cross-examined.", {
    x: 7.7, y: 6.35, w: 4.9, h: 0.4, margin: 0, align: "right",
    fontFace: BODY_FONT, fontSize: 15, italic: true, color: RED });
}

pres.writeFile({ fileName: "Tribunal.pptx" }).then((f) => console.log("wrote", f));
