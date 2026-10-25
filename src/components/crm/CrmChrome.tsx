"use client";
import { useEffect } from "react";

/** Hides the shop's nav, bag, footer, chat and pop-ups while the CRM is open. */
export default function CrmChrome() {
  useEffect(() => { document.documentElement.classList.add("is-crm"); return () => document.documentElement.classList.remove("is-crm"); }, []);
  return null;
}
