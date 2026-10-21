import * as esbuild from "esbuild"; import fs from "fs"; import path from "path";
const brandKey = process.argv[2] || "tg";
const mockPlugin = { name: "next-mocks", setup(b) {
  b.onResolve({ filter: /^next\/image$/ }, () => ({ path: path.resolve("preview/mocks.tsx"), namespace: "file", pluginData: "image" }));
  b.onResolve({ filter: /^next\/link$/ }, () => ({ path: path.resolve("preview/link.tsx") }));
  b.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: path.resolve("preview/mocks.tsx") }));
  b.onResolve({ filter: /^@\// }, a => { const base = path.resolve("src", a.path.slice(2)); for (const c of [base + ".tsx", base + ".ts", base + "/index.tsx", base + "/index.ts"]) if (fs.existsSync(c)) return { path: c }; return { path: base }; });
}};
fs.writeFileSync("preview/link.tsx", 'import {Link} from "./mocks"; export default Link;');
fs.writeFileSync("preview/image.tsx", 'import {Image,getImageProps} from "./mocks"; export default Image; export {getImageProps};');
const r = await esbuild.build({
  entryPoints: ["preview/entry.tsx"], bundle: true, write: false, format: "iife", jsx: "automatic", minify: true, target: "es2020",
  define: { "process.env.NEXT_PUBLIC_BRAND": JSON.stringify(brandKey), "process.env.NODE_ENV": '"production"' },
  plugins: [{ name: "img", setup(b){ b.onResolve({ filter: /^next\/image$/ }, () => ({ path: path.resolve("preview/image.tsx") })); } }, mockPlugin],
});
const js = r.outputFiles[0].text;
const css = fs.readFileSync("src/app/globals.css", "utf8");
const b64 = f => fs.readFileSync(f).toString("base64");
const assets = { "/brands/tg/logo.png": "data:image/png;base64," + b64("public/brands/tg/logo.png"),
  "/media/meekitaz-film-poster.jpg": "data:image/jpeg;base64," + b64("public/media/meekitaz-film-poster.jpg") };
const pressMap = {}; for (const f of fs.readdirSync("public/press")) { const d = "data:image/png;base64," + b64("public/press/" + f); assets["/press/" + f] = d; pressMap[f.replace(/\.png$/, "")] = d; }
let js2 = js; for (const [k, v] of Object.entries(assets)) js2 = js2.split(JSON.stringify(k)).join(JSON.stringify(v)).split(k).join(v);
const fonts = brandKey === "tg"
  ? "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Jost:wght@300;400;500;600;700&display=swap"
  : "https://fonts.googleapis.com/css2?family=Prata&family=Cormorant+Garamond:ital,wght@1,500&family=Archivo:wght@300;400;600;700&display=swap";
const fontVars = brandKey === "tg" ? ":root{--f-display-tg:'Cormorant Garamond';--f-body-tg:'Jost'}" : ":root{--f-display:Prata;--f-sub:'Cormorant Garamond';--f-body:Archivo}";
const html = `<!DOCTYPE html><html lang="en" data-brand="${brandKey}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${brandKey === "tg" ? "TG Jewellers — home preview" : "Meekitaz — home preview"}</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${fonts}" rel="stylesheet">
<style>${fontVars}\n${css}</style></head><body><div id="root"></div><script>${js2}</script><script>${fs.readFileSync("preview/press-fix.js","utf8").replace("__MAP__", JSON.stringify(pressMap))}</script></body></html>`;
fs.mkdirSync("/mnt/user-data/outputs", { recursive: true });
const out = `/mnt/user-data/outputs/${brandKey === "tg" ? "TG-home-preview" : "meekitaz-home-preview"}.html`;
fs.writeFileSync(out, html); console.log(out, (html.length/1024|0) + "KB");
