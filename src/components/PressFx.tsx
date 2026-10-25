"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** The feel of a press, everywhere: things squish under the finger and spring back with a little overshoot, and a choice pops when it is picked.
 *  And a thin bar at the top (with the tapped card dimmed) while another page is opening, so a slow page never feels like nothing happened. */
export const PRESS = ".pill, .df-cta, .df-pill, .pp-add, .dd-choose, .dcard, .pcard, .df-sim a, .sp-row > *, .rp-sw, .rp-shapes button, .rp-metals button, .rp-colors button, .mk-seg button, .po-vals button, .ih-thumbs button, .df-dots button, .df-arr, .cd-co, .cd-qty button, .pc-way";

export const CHOICE = ".sp-row > *, .rp-sw, .rp-shapes button, .rp-metals button, .rp-colors button, .mk-seg button, .po-vals button, .ih-thumbs button, .df-dots button, .pc-way";

export default function PressFx() {
  const path = usePathname();
  const bar = useRef<HTMLDivElement>(null), veil = useRef<HTMLDivElement>(null), loading = useRef<Element | null>(null), timer = useRef(0), veilTimer = useRef(0);

  const finish = () => {
    const b = bar.current; window.clearTimeout(timer.current); window.clearTimeout(veilTimer.current); veil.current?.classList.remove("on");
    if (loading.current) { loading.current.classList.remove("fx-loading"); loading.current = null; }
    if (!b || !b.classList.contains("go")) return;
    b.classList.add("done"); window.setTimeout(() => { b.classList.remove("go", "done"); }, 700);
  };
  useEffect(() => { finish(); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const downEls = new Set<Element>();
    const pop = (t: Element) => { t.classList.remove("fx-pop"); void (t as HTMLElement).offsetWidth; t.classList.add("fx-pop"); window.setTimeout(() => t.classList.remove("fx-pop"), 560); };
    const down = (e: PointerEvent) => {
      const t = (e.target as Element | null)?.closest?.(PRESS); if (!t || (t as HTMLButtonElement).disabled) return;
      t.classList.add("fx-down"); downEls.add(t);
    };
    const up = () => { downEls.forEach(t => t.classList.remove("fx-down")); downEls.clear(); };
    const click = (e: MouseEvent) => {
      const ch = (e.target as Element | null)?.closest?.(CHOICE); if (ch) pop(ch); // a choice springs when it is picked
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // a control inside a link (metal dots, photo flip, swap buttons) that handled the click itself: no page is opening, so no loading bar or pink veil
      if (e.defaultPrevented || (e.target as Element | null)?.closest?.(".pc-metals, .pcard-flip, [data-no-nav]")) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null; if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      let u: URL; try { u = new URL(a.href, location.href); } catch { return; }
      if (u.origin !== location.origin || u.pathname === location.pathname) return; // another page, not a filter or an anchor on this one
      const b = bar.current; if (!b) return;
      finish(); b.classList.remove("go", "done"); void b.offsetWidth; b.classList.add("go");
      const card = a.closest(PRESS) || a; card.classList.add("fx-loading"); loading.current = card;
      // a page that takes a moment: the mark breathes on pink. Never from a product page: there, moving between pieces, colours and photographs must not look like a page loading.
      if (!location.pathname.startsWith("/products/")) veilTimer.current = window.setTimeout(() => veil.current?.classList.add("on"), 700);
      timer.current = window.setTimeout(finish, 9000); // never leave it hanging
    };
    window.addEventListener("pointerdown", down, true); window.addEventListener("pointerup", up, true); window.addEventListener("pointercancel", up, true); document.addEventListener("click", click);
    return () => { window.removeEventListener("pointerdown", down, true); window.removeEventListener("pointerup", up, true); window.removeEventListener("pointercancel", up, true); document.removeEventListener("click", click); };
  }, []);

  return <><div className="fx-bar" ref={bar} aria-hidden="true"><i /></div><div className="nav-load" ref={veil} aria-hidden="true"><i className="mkm" /></div></>;
}
