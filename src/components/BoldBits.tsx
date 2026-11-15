"use client";
import { useEffect, useRef } from "react";

/* Three home sections of the "Bold" trial (2026-11-14). All are display:none unless the private switch adds html.mi.
   1 · the four promises as blocks of colour · 2 · our line, enormous, sliding across a photograph behind two bands of colour ·
   3 · 120 days: a lime number counts up while 120 squares fill, the last one pink. */
const on = () => typeof document !== "undefined" && document.documentElement.classList.contains("mi");

export function BoldPromises() {
  return (
    <section className="bd bd1" aria-label="What we don’t do">
      <span className="bd-k">Meekitaz Daily</span>
      <h2>What we <em>don’t</em> do.</h2>
      <div className="bd1-g">
        <div><b><s>Loans</s> &amp; <s>interest</s></b><p>You pay the price of the piece. Nothing on top.</p></div>
        <div><b><s>Credit checks</s></b><p>We never look at your score.</p></div>
        <div><b><s>Rentals</s></b><p>It’s yours, not borrowed.</p></div>
        <div><b>Everyone’s approved</b><p>From $1 a day, up to 4 months.</p></div>
      </div>
    </section>
  );
}

export function BoldStatement() {
  const box = useRef<HTMLElement>(null), a = useRef<HTMLSpanElement>(null), b = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => { raf = 0; if (!on() || !box.current) return; const r = box.current.getBoundingClientRect(), p = (window.innerHeight - r.top) / (window.innerHeight + r.height); if (p < 0 || p > 1) return; if (a.current) a.current.style.transform = `translateX(${-p * 26}%)`; if (b.current) b.current.style.transform = `translateX(${-22 + p * 26}%)`; };
    const sc = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick(); window.addEventListener("scroll", sc, { passive: true }); return () => { window.removeEventListener("scroll", sc); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <section className="bd bd2" ref={box} aria-label="Serious diamonds, worn lightly.">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/media/home/story-1.jpg" alt="" loading="lazy" />
      <div className="bd2-b b1" aria-hidden="true"><span ref={a}>Serious diamonds</span></div>
      <div className="bd2-b b2" aria-hidden="true"><span ref={b}>worn lightly.</span></div>
      <a className="bd-btn" href="#shop">Shop by category</a>
    </section>
  );
}

export function BoldDays() {
  const sq = useRef<HTMLDivElement>(null), n = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sq.current; if (!el) return; let ran = false, id = 0;
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting || ran || !on()) return; ran = true; const cells = Array.from(el.children); let k = 0;
      id = window.setInterval(() => { k++; cells[k - 1]?.classList.add(k === 120 ? "last" : "on"); if (n.current) n.current.textContent = String(k); if (k >= 120) clearInterval(id); }, 16);
    }, { threshold: .35 });
    io.observe(el); return () => { io.disconnect(); clearInterval(id); };
  }, []);
  return (
    <section className="bd bd3" aria-label="Up to four months">
      <div className="bd3-w">
        <div><span className="bd-k">Up to 4 months</span><div className="bd3-n" ref={n} aria-hidden="true">0</div><p>small days. One real diamond, <em>worn from the first.</em></p><a className="bd-btn" href="#shop">Find yours at your price</a></div>
        <div><div className="bd3-sq" ref={sq} aria-hidden="true">{Array.from({ length: 120 }, (_, i) => <i key={i} />)}</div><div className="bd3-mo" aria-hidden="true"><span>Month 1</span><span>Month 2</span><span>Month 3</span><span>Month 4</span></div></div>
      </div>
    </section>
  );
}
