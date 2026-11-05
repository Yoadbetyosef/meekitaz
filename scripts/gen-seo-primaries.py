#!/usr/bin/env python3
"""Builds src/lib/seoPrimary.json: for every group of products that differ only in metal, the one handle that Google should index.
Usage: python3 scripts/gen-seo-primaries.py products_export_1.csv [products_export_2.csv ...]   (Shopify product exports)
Preference when a group has several metals: yellow gold (the card opens on it), then white gold, rose gold, platinum, silver."""
import csv, json, re, sys
METALS = ["yellow-gold", "white-gold", "rose-gold", "platinum", "silver"]
RX = re.compile(r"(?<![a-z])(white-gold|yellow-gold|rose-gold|platinum|silver)(?![a-z])")
HIDE = {"Configured", "Karat variant", "Diamond", "care-package", "FIFA World Cup 2026", "fifa world cup 2026"}  # helper products the site never shows
groups = {}
for path in sys.argv[1:]:
    for row in csv.DictReader(open(path, encoding="utf-8")):
        h, t = row["Handle"], row["Title"]
        if not t: continue
        if row.get("Status", "active").lower() != "active" or HIDE & set(x.strip() for x in row["Tags"].split(",")): continue
        m = RX.search(h); key = RX.sub("{m}", h, 1) if m else h
        metal = m.group(1) if m else ""
        cur = groups.get(key)
        rank = METALS.index(metal) if metal in METALS else 99
        if cur is None or rank < cur[0]: groups[key] = (rank, h)
out = sorted({h for _, h in groups.values()})
json.dump(out, open("src/lib/seoPrimary.json", "w"), separators=(",", ":"))
print(len(out), "primary pages from", sum(1 for _ in groups), "groups")
