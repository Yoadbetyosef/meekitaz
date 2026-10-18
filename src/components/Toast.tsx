"use client";
import { useEffect, useState } from "react";

/** A short message at the bottom of the screen: toast("text") from anywhere in the browser. */
export const toast = (msg: string) => { try { window.dispatchEvent(new CustomEvent("mk-toast", { detail: msg })); } catch { /* ignore */ } };

export default function Toast() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = (e: Event) => { setMsg(String((e as CustomEvent).detail || "")); clearTimeout(t); t = setTimeout(() => setMsg(""), 5200); };
    window.addEventListener("mk-toast", on); return () => { window.removeEventListener("mk-toast", on); clearTimeout(t); };
  }, []);
  return <div className={`mk-toast${msg ? " on" : ""}`} role="status" aria-live="polite">{msg}</div>;
}
