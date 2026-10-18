import { brandify } from "./text";

/** The SEO slug for a product: its title, lower-case, words joined by hyphens, "&" read as "and". Same as its H1. */
export function titleSlug(title: string): string {
  return brandify(title)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // pavé → pave, café → cafe
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200)
    .replace(/-+$/, "");
}
/** Tag kept on a renamed product so its old link still resolves. */
export const OLD_HANDLE_TAG = "oldhandle-";
