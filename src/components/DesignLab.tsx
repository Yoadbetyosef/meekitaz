"use client";
import { useEffect, useState } from "react";

/** Private design lab, live on the real site (open any page with ?lab=1, close with ?lab=0). Lets you try logos and their size, a whole
 *  typography language, and button looks. The choice lives in this browser's session only; nobody else sees anything. */
type Opt = { n: string; bg: string; fg: string; bd?: string; blur?: number; wipe?: string; wfg?: string };
const HERO: Opt[] = [
  { n: "Ink (current)", bg: "#1C1A1B", fg: "#fff" }, { n: "Pale blue", bg: "#C4DEEE", fg: "#1C1A1B" }, { n: "Butter", bg: "#F7E9A8", fg: "#1C1A1B" },
  { n: "Blush pink", bg: "#F7D3DA", fg: "#1C1A1B" }, { n: "Footer rose", bg: "#EFC5CA", fg: "#1C1A1B" }, { n: "Cream", bg: "#FBF7F1", fg: "#1C1A1B" },
  { n: "Frosted glass", bg: "rgba(255,255,255,.38)", fg: "#1C1A1B", bd: "rgba(255,255,255,.8)", blur: 12 }, { n: "Red", bg: "#7E0508", fg: "#fff" },
];
const CTA: Opt[] = [
  { n: "Ink (current)", bg: "#1C1A1B", fg: "#fff", wipe: "#7E0508", wfg: "#fff" },
  { n: "Red", bg: "#7E0508", fg: "#fff", wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Red glass", bg: "rgba(126,5,8,.72)", fg: "#fff", bd: "rgba(255,255,255,.28)", blur: 12, wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Cherry", bg: "#B3141F", fg: "#fff", wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Rosewood", bg: "#9B2C3A", fg: "#fff", wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Raspberry", bg: "#C2354F", fg: "#fff", wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Coral pop", bg: "#F2545B", fg: "#1C1A1B", wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Rose", bg: "#E9A1B0", fg: "#1C1A1B", wipe: "#7E0508", wfg: "#fff" },
  { n: "Blush glass", bg: "rgba(247,211,218,.68)", fg: "#1C1A1B", bd: "rgba(255,255,255,.8)", blur: 12, wipe: "#7E0508", wfg: "#fff" },
  { n: "Red → pink", bg: "linear-gradient(110deg,#7E0508,#C2354F 70%,#E9A1B0)", fg: "#fff", wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Outline", bg: "transparent", fg: "#1C1A1B", bd: "#1C1A1B", wipe: "#1C1A1B", wfg: "#fff" },
  { n: "Tinted glass", bg: "rgba(190,30,45,.55)", fg: "#fff", bd: "rgba(255,255,255,.4)", blur: 14, wipe: "#7E0508", wfg: "#fff" },
];
const HOVER = [["arrow", "Arrow slides in (current)"], ["wipe", "Fill wipe"], ["off", "None"]] as const;
const BTN = [".pill", ".mkfilm-txt .pill", ".pc-form button", ".pc-next", ".cd-empty a", ".cd-co", ".pp-add", ".dcard-cta", ".dd-choose", ".nf-cta", ".sl-all", ".sq-all", ".lr-go", ".hush-cta"];
const HERO_SEL = ".heroc .pill";
const blur = (o: Opt) => (o.blur ? `backdrop-filter:blur(${o.blur}px);-webkit-backdrop-filter:blur(${o.blur}px);` : "");
const look = (o: Opt) => `background:${o.bg} !important;color:${o.fg} !important;border:1px solid ${o.bd || "transparent"} !important;${blur(o)}`;
const pre = (s: string, x: string) => s.split(",").map(t => t + x).join(",");

/* ---------- logos ---------- */
const VINTAGE = "/lab/meekitaz-vintage.svg", VINTAGE_AR = 4.2229;
const LOGOS = [["a", "Handwritten (current)"], ["b", "Vintage serif (new)"]] as const;

/* ---------- fonts ---------- */
type Font = { n: string; fam?: string; q?: string; track?: string };
const DISPLAY: Font[] = [
  { n: "Prata (current)" }, { n: "Caprasimo", fam: "Caprasimo", q: "Caprasimo" }, { n: "Fraunces", fam: "Fraunces", q: "Fraunces:ital,wght@0,600;1,400" },
  { n: "Gloock", fam: "Gloock", q: "Gloock" }, { n: "DM Serif Display", fam: "DM Serif Display", q: "DM+Serif+Display:ital@0;1" },
  { n: "Instrument Serif", fam: "Instrument Serif", q: "Instrument+Serif:ital@0;1" }, { n: "Playfair Display", fam: "Playfair Display", q: "Playfair+Display:ital,wght@0,600;1,400" },
  { n: "Young Serif", fam: "Young Serif", q: "Young+Serif" }, { n: "Bodoni Moda", fam: "Bodoni Moda", q: "Bodoni+Moda:ital,wght@0,500;1,400" },
  { n: "Bricolage Grotesque", fam: "Bricolage Grotesque", q: "Bricolage+Grotesque:wght@800" }, { n: "Inter Tight Black", fam: "Inter Tight", q: "Inter+Tight:wght@800" },
  { n: "Anton", fam: "Anton", q: "Anton" }, { n: "Unbounded", fam: "Unbounded", q: "Unbounded:wght@700" }, { n: "Syne", fam: "Syne", q: "Syne:wght@800" },
  { n: "Space Grotesk", fam: "Space Grotesk", q: "Space+Grotesk:wght@700" },
];
const SUB: Font[] = [
  { n: "Cormorant (current)" }, { n: "Instrument Serif", fam: "Instrument Serif", q: "Instrument+Serif:ital@0;1" }, { n: "Fraunces", fam: "Fraunces", q: "Fraunces:ital,wght@0,400;1,400" },
  { n: "Playfair Display", fam: "Playfair Display", q: "Playfair+Display:ital,wght@0,400;1,400" }, { n: "Newsreader", fam: "Newsreader", q: "Newsreader:ital,wght@0,400;1,400" },
  { n: "Libre Baskerville", fam: "Libre Baskerville", q: "Libre+Baskerville:ital@0;1" },
];
const BODY: Font[] = [
  { n: "Archivo (current)" }, { n: "Inter Tight", fam: "Inter Tight", q: "Inter+Tight:wght@300..800" }, { n: "DM Sans", fam: "DM Sans", q: "DM+Sans:wght@300..800" },
  { n: "Manrope", fam: "Manrope", q: "Manrope:wght@300..800" }, { n: "Hanken Grotesk", fam: "Hanken Grotesk", q: "Hanken+Grotesk:wght@300..800" },
  { n: "Space Grotesk", fam: "Space Grotesk", q: "Space+Grotesk:wght@300..700" }, { n: "Work Sans", fam: "Work Sans", q: "Work+Sans:wght@300..800" },
];
const LABEL: Font[] = [
  { n: "Body font (current)" }, { n: "Condensed caps (Anton)", fam: "Anton", q: "Anton", track: ".06em" }, { n: "Grotesk bold (Inter Tight)", fam: "Inter Tight", q: "Inter+Tight:wght@700", track: ".05em" },
  { n: "Space Grotesk", fam: "Space Grotesk", q: "Space+Grotesk:wght@600", track: ".1em" }, { n: "Bricolage", fam: "Bricolage Grotesque", q: "Bricolage+Grotesque:wght@800", track: ".05em" },
];
const CASES = [["as", "As designed"], ["caps", "ALL CAPS"], ["lower", "lowercase"]] as const;
const TRACKS = [["tight", "Tight"], ["as", "As designed"], ["loose", "Loose"]] as const;
const SIZES = [0.9, 1, 1.15, 1.3];
const HEAD = "h1,h2,h3,.h2,.lr-big,.lr-cap b,.hush h2";
const LABELS = ".eyebrow,.pill,.mkfilm-txt .pill,.pp-add,.cd-co,.hush-cta,.lr-go,.lr-cap small,.sl-all,.dcard-cta,.dd-choose,.nf-cta,.pc-next,.mkf-under a,.mkf-base,.rsteps a,.rsteps span,.rsteps button";

type State = { ln: string; lf: string; sn: number; sf: number; d: number; u: number; b: number; l: number; cs: string; tr: string; sz: number; h: number; c: number; hv: string };
const START: State = { ln: "a", lf: "a", sn: 100, sf: 100, d: 0, u: 0, b: 0, l: 0, cs: "as", tr: "as", sz: 1, h: 0, c: 0, hv: "arrow" };
const idx = (list: Font[], n: string) => Math.max(0, list.findIndex(f => f.n === n));
/* whole "type languages": display / tagline / body / labels / case / tracking / size */
const LANGS: { n: string; note: string; p: Partial<State> }[] = [
  { n: "Today", note: "Prata + Cormorant + Archivo", p: { d: 0, u: 0, b: 0, l: 0, cs: "as", tr: "as", sz: 1 } },
  { n: "Cooper soft", note: "goes with the vintage logo", p: { d: idx(DISPLAY, "Caprasimo"), u: idx(SUB, "Fraunces"), b: idx(BODY, "DM Sans"), l: 0, cs: "as", tr: "tight", sz: 1 } },
  { n: "Boutique", note: "high-contrast serif, quiet body", p: { d: idx(DISPLAY, "Gloock"), u: idx(SUB, "Instrument Serif"), b: idx(BODY, "Hanken Grotesk"), l: 0, cs: "as", tr: "as", sz: 1 } },
  { n: "Editorial", note: "big, thin, magazine", p: { d: idx(DISPLAY, "Instrument Serif"), u: idx(SUB, "Instrument Serif"), b: idx(BODY, "Inter Tight"), l: 0, cs: "as", tr: "tight", sz: 1.15 } },
  { n: "Fashion Didone", note: "Bodoni, caps", p: { d: idx(DISPLAY, "Bodoni Moda"), u: idx(SUB, "Playfair Display"), b: idx(BODY, "Manrope"), l: 0, cs: "caps", tr: "as", sz: 1 } },
  { n: "TinyWins loud", note: "heavy tight grotesk, all caps (their giant wordmark)", p: { d: idx(DISPLAY, "Inter Tight Black"), u: idx(SUB, "Instrument Serif"), b: idx(BODY, "Inter Tight"), l: idx(LABEL, "Grotesk bold (Inter Tight)"), cs: "caps", tr: "tight", sz: 1.1 } },
  { n: "TinyWins condensed", note: "Anton caps for labels and headlines (their SHIPYARD tag)", p: { d: idx(DISPLAY, "Anton"), u: idx(SUB, "Cormorant (current)"), b: 0, l: idx(LABEL, "Condensed caps (Anton)"), cs: "caps", tr: "as", sz: 1.05 } },
  { n: "Playful", note: "round, wide, friendly", p: { d: idx(DISPLAY, "Unbounded"), u: idx(SUB, "Fraunces"), b: idx(BODY, "DM Sans"), l: 0, cs: "as", tr: "as", sz: 0.9 } },
  { n: "Quirky", note: "Syne, mono-ish labels", p: { d: idx(DISPLAY, "Syne"), u: idx(SUB, "Instrument Serif"), b: idx(BODY, "Space Grotesk"), l: idx(LABEL, "Space Grotesk"), cs: "as", tr: "as", sz: 1 } },
  { n: "Soft story", note: "Young Serif, warm body", p: { d: idx(DISPLAY, "Young Serif"), u: idx(SUB, "Newsreader"), b: idx(BODY, "Work Sans"), l: 0, cs: "as", tr: "as", sz: 1 } },
];

const fcache: Record<string, string> = {};
async function fontCss(q: string) {
  if (fcache[q]) return fcache[q];
  const r = await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`);
  if (!r.ok) throw new Error(String(r.status));
  return (fcache[q] = await r.text());
}
const rename = (css: string, fam: string, alias: string, range: boolean) =>
  css.split(`'${fam}'`).join(`'${alias}'`).replace(/font-weight:\s*[^;]+;/g, range ? "font-weight:100 900;" : "$&");
function el(id: string) { let e = document.getElementById(id) as HTMLStyleElement | null; if (!e) { e = document.createElement("style"); e.id = id; document.head.appendChild(e); } return e; }

function build(s: State) {
  let out = "";
  /* logos */
  const A = VINTAGE_AR, n = s.sn / 100, f = s.sf / 100;
  if (s.ln === "b") out += `.brand-logo{display:none !important}.nav .brand::after{content:"";display:block;aspect-ratio:${A};height:calc(34px*${n});background:currentColor;-webkit-mask:url(${VINTAGE}) no-repeat center/contain;mask:url(${VINTAGE}) no-repeat center/contain}@media(max-width:767px){.nav .brand::after{height:calc(28px*${n})}}`;
  else if (s.sn !== 100) out += `.brand-logo{height:calc(34px*${n}) !important}@media(max-width:767px){.brand-logo{height:calc(28px*${n}) !important}}`;
  if (s.lf === "b") out += `.foot-logo{display:none !important}.foot-giant::after{content:"";display:block;aspect-ratio:${A};height:calc(clamp(120px,44vh,560px)*${f});max-width:100%;background:currentColor;-webkit-mask:url(${VINTAGE}) no-repeat center/contain;mask:url(${VINTAGE}) no-repeat center/contain}@media(max-width:767px){.foot-giant::after{width:calc(100%*${Math.min(f, 1)});height:auto}}`;
  else if (s.sf !== 100) out += `.foot-logo{height:calc(clamp(120px,44vh,560px)*${f}) !important}@media(max-width:767px){.foot-logo{width:calc(100%*${Math.min(f, 1)}) !important;height:auto !important}}`;
  /* fonts */
  if (s.d > 0) out += `html{--display:'LabDisplay',Georgia,serif !important}`;
  if (s.u > 0) out += `html{--sub:'LabSub',Georgia,serif !important}`;
  if (s.b > 0) out += `html{--body:'LabBody',Helvetica,Arial,sans-serif !important}`;
  if (s.l > 0) out += `${LABELS}{font-family:'LabLabel',sans-serif !important;letter-spacing:${LABEL[s.l].track} !important}`;
  const hd: string[] = [];
  if (s.cs === "caps") hd.push("text-transform:uppercase !important");
  if (s.cs === "lower") hd.push("text-transform:lowercase !important");
  if (s.tr === "tight") hd.push("letter-spacing:-.03em !important");
  if (s.tr === "loose") hd.push("letter-spacing:.04em !important");
  if (s.sz !== 1) hd.push(`zoom:${s.sz}`);
  if (hd.length) out += `${HEAD}{${hd.join(";")}}`;
  /* buttons */
  const grp = BTN.join(","), all = `${grp},${HERO_SEL}`;
  if (s.c > 0) out += `${grp}{${look(CTA[s.c])}}`;
  if (s.c > 0 || s.h > 0) out += `@media(min-width:768px){${HERO_SEL}{${look(HERO[s.h])}}}`;
  const o = CTA[s.c], w = o.wipe || "#7E0508", wf = o.wfg || "#fff";
  if (s.hv === "wipe") out += `${pre(all, "::after")}{display:none !important}${all}{position:relative;overflow:hidden;isolation:isolate}${pre(all, "::before")}{content:"";position:absolute;inset:-1px;background:${w};transform:translateY(102%);transition:transform .45s cubic-bezier(.6,0,.2,1);z-index:-1;pointer-events:none}${pre(all, ":hover::before")}{transform:none}${pre(all, ":hover")}{color:${wf} !important;filter:none !important;transform:none !important}`;
  if (s.hv === "off") out += `${pre(all, "::after")}{display:none !important}`;
  return out;
}

export default function DesignLab({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<State>(START);
  const [tab, setTab] = useState<"logo" | "fonts" | "buttons">("logo");
  const [open, setOpen] = useState(true);
  const [right, setRight] = useState(false);
  const [err, setErr] = useState("");
  const set = (p: Partial<State>) => setS(prev => ({ ...prev, ...p }));
  useEffect(() => { try { const v = sessionStorage.getItem("designlab-s"); if (v) setS({ ...START, ...JSON.parse(v) }); } catch { /* ignore */ } }, []);
  useEffect(() => { el("dl-css").textContent = build(s); try { sessionStorage.setItem("designlab-s", JSON.stringify(s)); } catch { /* ignore */ } }, [s]);
  useEffect(() => {
    let dead = false;
    (async () => {
      const parts: string[] = []; const bad: string[] = [];
      const roles: [string, Font, boolean][] = [["LabDisplay", DISPLAY[s.d], true], ["LabSub", SUB[s.u], true], ["LabBody", BODY[s.b], false], ["LabLabel", LABEL[s.l], true]];
      for (const [alias, f, range] of roles) { if (!f.q) continue; try { parts.push(rename(await fontCss(f.q), f.fam!, alias, range)); } catch { bad.push(f.n); } }
      if (!dead) { el("dl-fonts").textContent = parts.join("\n"); setErr(bad.length ? `Could not load: ${bad.join(", ")}` : ""); }
    })();
    return () => { dead = true; };
  }, [s.d, s.u, s.b, s.l]);
  const close = () => { try { sessionStorage.removeItem("designlab"); sessionStorage.removeItem("designlab-s"); } catch { /* ignore */ } el("dl-css").remove(); el("dl-fonts").remove(); onClose(); };
  const Chip = ({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) => <button type="button" className={`dl-b${on ? " on" : ""}`} onClick={onClick}>{children}</button>;
  const Dot = ({ o }: { o: Opt }) => <i className="dl-dot" style={{ background: o.bg, borderColor: o.bd || "rgba(0,0,0,.25)" }} />;
  return (
    <div className="dl" style={right ? { right: 12, left: "auto" } : { left: 12 }}>
      <style>{`.dl{position:fixed;bottom:12px;z-index:99999;font:600 12px Archivo,system-ui,sans-serif;color:#fff}.dl *{box-sizing:border-box;font-family:Archivo,system-ui,sans-serif !important;text-transform:none !important;letter-spacing:0 !important;zoom:1 !important}
.dl-bar{display:flex;gap:6px}.dl-t{background:#1d1d20;color:#fff;border:1px solid #444;border-radius:999px;padding:10px 16px;font-weight:700;font-size:11px;letter-spacing:.14em !important;text-transform:uppercase !important;cursor:pointer}
.dl-p{margin-bottom:8px;background:rgba(29,29,32,.97);border:1px solid #444;border-radius:18px;padding:12px 14px 14px;width:min(460px,calc(100vw - 24px));max-height:64vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.dl-tabs{display:flex;gap:6px;margin-bottom:10px;position:sticky;top:-12px;background:rgba(29,29,32,.97);padding:6px 0;z-index:2}.dl-tabs button{flex:1;background:#2b2b30;color:#fff;border:1px solid #444;border-radius:10px;padding:9px;font-weight:700;font-size:11px;cursor:pointer}.dl-tabs button.on{background:#fff;color:#1d1d20;border-color:#fff}
.dl-p h5{margin:12px 0 6px;font-weight:700;font-size:10px;color:#aaa;letter-spacing:.16em !important;text-transform:uppercase !important}
.dl-g{display:flex;flex-wrap:wrap;gap:6px}.dl-b{display:inline-flex;align-items:center;gap:7px;background:#2b2b30;color:#fff;border:1px solid #444;border-radius:999px;padding:7px 11px;font-weight:600;font-size:11px;cursor:pointer;text-align:left}.dl-b.on{background:#7E0508;border-color:#7E0508}.dl-b small{opacity:.6;font-weight:500;margin-left:2px}
.dl-dot{width:12px;height:12px;border-radius:50%;border:1px solid;display:inline-block;flex:none}.dl-r{display:flex;align-items:center;gap:10px}.dl-r input{flex:1}.dl-r b{min-width:42px;text-align:right}
.dl-s{margin-top:12px;padding-top:10px;border-top:1px solid #333;font-weight:500;font-size:11px;line-height:1.55;color:#ccc}.dl-x{color:#aaa;background:none;border:0;text-decoration:underline;cursor:pointer;font-weight:600;font-size:11px;padding:0}.dl-e{color:#ffb4b4}`}</style>
      {open && (
        <div className="dl-p">
          <div className="dl-tabs">{(["logo", "fonts", "buttons"] as const).map(t => <button key={t} type="button" className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t === "logo" ? "Logo" : t === "fonts" ? "Fonts" : "Buttons"}</button>)}</div>
          {tab === "logo" && (<>
            <h5>Header logo</h5><div className="dl-g">{LOGOS.map(([k, n]) => <Chip key={k} on={s.ln === k} onClick={() => set({ ln: k })}>{n}</Chip>)}</div>
            <h5>Header size</h5><div className="dl-r"><input type="range" min={50} max={220} step={5} value={s.sn} onChange={e => set({ sn: +e.target.value })} /><b>{s.sn}%</b></div>
            <h5>Footer logo (the big one)</h5><div className="dl-g">{LOGOS.map(([k, n]) => <Chip key={k} on={s.lf === k} onClick={() => set({ lf: k })}>{n}</Chip>)}</div>
            <h5>Footer size</h5><div className="dl-r"><input type="range" min={50} max={130} step={5} value={s.sf} onChange={e => set({ sf: +e.target.value })} /><b>{s.sf}%</b></div>
            <h5>Quick</h5><div className="dl-g"><Chip on={false} onClick={() => set({ ln: "b", lf: "b" })}>New logo in both</Chip><Chip on={false} onClick={() => set({ ln: "a", lf: "a", sn: 100, sf: 100 })}>Back to current</Chip></div>
          </>)}
          {tab === "fonts" && (<>
            <h5>Type languages (a whole set at once)</h5>
            <div className="dl-g">{LANGS.map(l => <Chip key={l.n} on={false} onClick={() => set(l.p)}>{l.n}<small>{l.note}</small></Chip>)}</div>
            <h5>Headlines</h5><div className="dl-g">{DISPLAY.map((f, i) => <Chip key={f.n} on={s.d === i} onClick={() => set({ d: i })}>{f.n}</Chip>)}</div>
            <h5>Taglines (the italic lines)</h5><div className="dl-g">{SUB.map((f, i) => <Chip key={f.n} on={s.u === i} onClick={() => set({ u: i })}>{f.n}</Chip>)}</div>
            <h5>Body text</h5><div className="dl-g">{BODY.map((f, i) => <Chip key={f.n} on={s.b === i} onClick={() => set({ b: i })}>{f.n}</Chip>)}</div>
            <h5>Small labels and buttons</h5><div className="dl-g">{LABEL.map((f, i) => <Chip key={f.n} on={s.l === i} onClick={() => set({ l: i })}>{f.n}</Chip>)}</div>
            <h5>Headline case</h5><div className="dl-g">{CASES.map(([k, n]) => <Chip key={k} on={s.cs === k} onClick={() => set({ cs: k })}>{n}</Chip>)}</div>
            <h5>Headline spacing</h5><div className="dl-g">{TRACKS.map(([k, n]) => <Chip key={k} on={s.tr === k} onClick={() => set({ tr: k })}>{n}</Chip>)}</div>
            <h5>Headline size</h5><div className="dl-g">{SIZES.map(z => <Chip key={z} on={s.sz === z} onClick={() => set({ sz: z })}>{Math.round(z * 100)}%</Chip>)}</div>
            {err && <p className="dl-e">{err}</p>}
          </>)}
          {tab === "buttons" && (<>
            <h5>Hero button (home, desktop)</h5><div className="dl-g">{HERO.map((o, i) => <Chip key={o.n} on={s.h === i} onClick={() => set({ h: i })}><Dot o={o} />{o.n}</Chip>)}</div>
            <h5>All the other buttons</h5><div className="dl-g">{CTA.map((o, i) => <Chip key={o.n} on={s.c === i} onClick={() => set({ c: i })}><Dot o={o} />{o.n}</Chip>)}</div>
            <h5>Hover effect</h5><div className="dl-g">{HOVER.map(([k, n]) => <Chip key={k} on={s.hv === k} onClick={() => set({ hv: k })}>{n}</Chip>)}</div>
          </>)}
          <div className="dl-s">
            Logo: <b>{LOGOS.find(l => l[0] === s.ln)![1]}</b> {s.sn}% / <b>{LOGOS.find(l => l[0] === s.lf)![1]}</b> {s.sf}%<br />
            Fonts: <b>{DISPLAY[s.d].n}</b> · {SUB[s.u].n} · {BODY[s.b].n} · labels {LABEL[s.l].n} · {CASES.find(c => c[0] === s.cs)![1]} · {TRACKS.find(t => t[0] === s.tr)![1]} · {Math.round(s.sz * 100)}%<br />
            Buttons: <b>{CTA[s.c].n}</b> · hero {HERO[s.h].n} · {HOVER.find(h => h[0] === s.hv)![1]}<br />
            <button type="button" className="dl-x" onClick={() => setS(START)}>Reset all</button> · <button type="button" className="dl-x" onClick={close}>Close the lab</button>
          </div>
        </div>
      )}
      <div className="dl-bar"><button type="button" className="dl-t" onClick={() => setOpen(!open)}>{open ? "Hide" : "Design lab"}</button><button type="button" className="dl-t" aria-label="Move the panel to the other side" onClick={() => setRight(!right)}>&#8646;</button></div>
    </div>
  );
}
