# Serbia Map Overworld Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the green test field with a zoomable cartoon vector map of Serbia (incl. Kosovo) where the princess walks to all 60 public prosecutor's offices from `assets/tuzilastva.csv` and wakes each one.

**Architecture:** Two one-time Python scripts turn the CSV and Natural Earth data into committed TypeScript data in `src/data/`. Pure TS modules (`geo`, `officeLayout`, `zoom`, `score`, `progress`) hold all rules and are unit-tested. The Kaplay overworld scene only draws the vector map, reads input, and calls those modules.

**Tech Stack:** Kaplay 3001 (`k.drawPolygon` with precomputed `indices`, `k.drawLines`, `k.drawText`, `k.onScroll`), TypeScript, Vite, Vitest, Playwright; Python 3 + stdlib (no shapely) for data generation.

**Spec:** `docs/superpowers/specs/2026-10-27-serbia-map-design.md`

## Global Constraints

- Serbia **including** Kosovo; Kosovo is walkable; no offices there.
- 60 offices, every office its own stop; first visit only grants points.
- Points: `OJT` 10, `VJT` 20, `AJT` 30, `PJT` 40, `VRHOVNO` 50; max **1060**.
- Start city: **Beograd**.
- Each visit: shout pose + `SHOUT_LINE` first, then the office's reply. Dialog blocks movement.
- E-key shout, facing, walk/shout animations unchanged.
- HUD: `Score <n>/1060  Offices <n>/60`.
- Zoom: mouse wheel and `+`/`-`; from whole Serbia (min) to today's close view (max); camera follows her, clamped to map bounds.
- Movement: feet must stay inside the Serbia+Kosovo outline; blocked diagonals slide along the border.
- No Kaplay imports in `src/data/*`, `src/geo.ts`, `src/officeLayout.ts`, `src/zoom.ts`, `src/score.ts`, `src/progress.ts`.
- No new npm dependencies. Python scripts use only the standard library.
- The game never downloads anything at runtime.
- Unit tests colocated (`foo.ts` → `foo.test.ts`); `npm test` must pass at the end of every task.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- A near-border city (Bačka Palanka on the Danube, Loznica on the Drina, Subotica) falls outside the simplified outline → its offices unreachable. Expect every office position inside the outline (test in Task 3).
- Touching an office while a dialog is open, or standing on it after the dialog closes → must not re-open or double-grant (test in Task 3: `visitToStart`).
- Spawn point outside the outline → stuck at start. Expect spawn inside (test in Task 3).
- Zoomed all the way out, the view is larger than the map → camera must center, not jitter or show void on one side (test in Task 4).
- Serbian letters (č ć š ž đ) in city and office names render as boxes → manual browser check in Task 5 (Niš, Šabac, Požarevac, Čačak visible).

## File map

| File | Responsibility |
|---|---|
| `scripts/make-offices.py` | CSV → `src/data/offices-list.ts` (fixes encoding damage, slugs ids) |
| `src/data/offices-list.ts` | generated rows `{ id, name, level, city }` |
| `src/data/offices.ts` | `OfficeLevel`, `LEVEL_POINTS`, `Office`, `OFFICES`, `OFFICE_IDS`, `getOffice`, `maxScore` |
| `src/data/replies.ts` | `REPLIES: Record<OfficeLevel, readonly string[]>` |
| `src/data/cities.ts` | `LonLat`, `CITIES: Record<string, LonLat>` |
| `scripts/make-map.py` | Natural Earth → `src/data/serbia-geo.ts` |
| `src/data/serbia-geo.ts` | generated `VIEW_BOX`, `SERBIA_RINGS`, `NEIGHBOURS`, `RIVERS` |
| `src/geo.ts` | `Point`, `Bounds`, `project`, `projectRing`, `mapBounds`, `isInside`, `isInsideAny`, `tryMove` |
| `src/officeLayout.ts` | `layoutOffices`, `touchedOffice`, `visitToStart`, `spawnPoint` |
| `src/zoom.ts` | zoom limits/steps and `clampCamera` |
| `src/score.ts` | `visitOffice` over `OFFICES` (replaces `visitLord`) |
| `src/scenes/overworld.ts` | rewritten: vector map, zoom, movement, visits |
| `src/scenes/ending.ts` | uses offices `maxScore` |
| `src/data/story.ts` | wake/ending copy mentions offices |
| `src/assets.ts` | + latin-ext font face |
| `src/data/lords.ts`, `src/data/lords.test.ts` | deleted |

---

### Task 1: Office data from the CSV

**Files:**
- Create: `scripts/make-offices.py`, `src/data/offices-list.ts` (generated), `src/data/offices.ts`, `src/data/replies.ts`, `src/data/cities.ts`
- Test: `src/data/offices.test.ts`

**Interfaces:**
- Consumes: `assets/tuzilastva.csv`
- Produces:
  - `type OfficeLevel = "OJT" | "VJT" | "AJT" | "PJT" | "VRHOVNO"`
  - `LEVEL_POINTS: Record<OfficeLevel, number>`
  - `type Office = { id: string; name: string; level: OfficeLevel; city: string; points: number; lines: readonly string[] }`
  - `OFFICES: readonly Office[]`, `OFFICE_IDS: readonly string[]`, `getOffice(id: string): Office | undefined`, `maxScore(): number`
  - `type LonLat = readonly [number, number]` (lon, lat), `CITIES: Record<string, LonLat>`
  - `REPLIES: Record<OfficeLevel, readonly string[]>`

- [ ] **Step 1: Write the failing test** — `src/data/offices.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { LEVEL_POINTS, OFFICES, OFFICE_IDS, getOffice, maxScore, type OfficeLevel } from "./offices";
import { REPLIES } from "./replies";

describe("OFFICES", () => {
  it("has all 60 offices from the CSV with unique ids", () => {
    expect(OFFICES).toHaveLength(60);
    expect(new Set(OFFICE_IDS).size).toBe(60);
  });

  it("has 27 OJT, 25 VJT, 4 AJT, 3 PJT and 1 VRHOVNO", () => {
    const count = (level: OfficeLevel) => OFFICES.filter((o) => o.level === level).length;
    expect([count("OJT"), count("VJT"), count("AJT"), count("PJT"), count("VRHOVNO")]).toEqual([27, 25, 4, 3, 1]);
  });

  it("gives each office its level's points and a max score of 1060", () => {
    for (const office of OFFICES) {
      expect(office.points).toBe(LEVEL_POINTS[office.level]);
    }
    expect(maxScore()).toBe(1060);
  });

  it("fixes the CSV's broken Š and Ž in city names", () => {
    const cities = new Set(OFFICES.map((o) => o.city));
    expect(cities.has("Šabac")).toBe(true);
    expect(cities.has("Požarevac")).toBe(true);
    expect([...cities].some((c) => c.startsWith("š") || c.includes("Pošar"))).toBe(false);
  });

  it("knows the coordinates of every office's city", () => {
    for (const office of OFFICES) {
      expect(CITIES[office.city], office.city).toBeDefined();
    }
  });

  it("gives every office a reply line that names it", () => {
    for (const office of OFFICES) {
      expect(office.lines.length).toBeGreaterThan(0);
      expect(office.lines[0].startsWith(office.name)).toBe(true);
    }
    for (const level of Object.keys(LEVEL_POINTS) as OfficeLevel[]) {
      expect(REPLIES[level].length).toBeGreaterThan(0);
    }
  });

  it("looks offices up by id", () => {
    expect(getOffice("vrhovno-javno-tuzilastvo")?.level).toBe("VRHOVNO");
    expect(getOffice("nope")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/data/offices.test.ts`
Expected: FAIL — cannot find module `./cities` / `./offices`.

- [ ] **Step 3: Write the CSV converter** — `scripts/make-offices.py`

```python
"""Turn assets/tuzilastva.csv into src/data/offices-list.ts.

Run: python scripts/make-offices.py
Only names, levels and cities are kept; addresses and contacts are not used.
"""
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "tuzilastva.csv"
OUT = ROOT / "src" / "data" / "offices-list.ts"

# The CSV lost capital Š and Ž (saved as a lowercase š).
FIXES = {"šabac": "Šabac", "šapcu": "Šapcu", "Pošarevac": "Požarevac", "Pošarevcu": "Požarevcu"}
LEVELS = {"Vrhovno javno tužilaštvo": "VRHOVNO", "PJT": "PJT", "AJT": "AJT", "VJT": "VJT", "OJT": "OJT"}
ASCII = str.maketrans({"č": "c", "ć": "c", "š": "s", "ž": "z", "đ": "dj",
                       "Č": "c", "Ć": "c", "Š": "s", "Ž": "z", "Đ": "dj"})


def clean(text: str) -> str:
    text = " ".join(text.split())
    for bad, good in FIXES.items():
        text = text.replace(bad, good)
    return text


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.translate(ASCII).lower()).strip("-")


def main() -> None:
    rows = []
    with SOURCE.open(encoding="utf-8", newline="") as file:
        for row in csv.reader(file):
            if not row or not row[0].strip().isdigit():
                continue
            name = clean(row[2])
            rows.append((slug(name), name, LEVELS[row[1].strip()], clean(row[3])))
    ids = [row[0] for row in rows]
    assert len(ids) == len(set(ids)), "duplicate office ids"

    lines = [
        "// Generated by scripts/make-offices.py from assets/tuzilastva.csv. Do not edit.",
        'import type { OfficeLevel } from "./offices";',
        "",
        "export const OFFICE_ROWS: readonly { id: string; name: string; level: OfficeLevel; city: string }[] = [",
    ]
    for office_id, name, level, city in rows:
        lines.append(
            f"  {{ id: {json.dumps(office_id)}, name: {json.dumps(name, ensure_ascii=False)}, "
            f"level: \"{level}\", city: {json.dumps(city, ensure_ascii=False)} }},"
        )
    lines.append("];")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"wrote {len(rows)} offices to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
```

Run: `python scripts/make-offices.py`
Expected: `wrote 60 offices to src\data\offices-list.ts`

- [ ] **Step 4: Write the data modules**

`src/data/offices.ts`:

```typescript
import { OFFICE_ROWS } from "./offices-list";
import { REPLIES } from "./replies";

export type OfficeLevel = "OJT" | "VJT" | "AJT" | "PJT" | "VRHOVNO";

export const LEVEL_POINTS: Record<OfficeLevel, number> = {
  OJT: 10,
  VJT: 20,
  AJT: 30,
  PJT: 40,
  VRHOVNO: 50,
};

export type Office = {
  id: string;
  name: string;
  level: OfficeLevel;
  city: string;
  points: number;
  lines: readonly string[];
};

// Each office answers with one of its level's replies, picked by list order.
export const OFFICES: readonly Office[] = OFFICE_ROWS.map((row, index) => {
  const replies = REPLIES[row.level];
  return {
    ...row,
    points: LEVEL_POINTS[row.level],
    lines: [`${row.name}: ${replies[index % replies.length]}`],
  };
});

export const OFFICE_IDS: readonly string[] = OFFICES.map((office) => office.id);

export function getOffice(id: string): Office | undefined {
  return OFFICES.find((office) => office.id === id);
}

export function maxScore(): number {
  return OFFICES.reduce((sum, office) => sum + office.points, 0);
}
```

`src/data/replies.ts`:

```typescript
import type { OfficeLevel } from "./offices";

// Placeholder copy: what a sleepy office mumbles when the princess shouts.
export const REPLIES: Record<OfficeLevel, readonly string[]> = {
  OJT: ["Samo još pet minuta...", "Ko je upalio svetlo?", "Predmet je u fioci. Negde."],
  VJT: ["Zakazali smo sastanak o buđenju.", "Prvo kafa, pa pravda."],
  AJT: ["Žalba na buđenje je u postupku.", "Rok za buđenje još nije istekao."],
  PJT: ["Posebno smo budni. Posebno retko.", "Tim za buđenje je na godišnjem."],
  VRHOVNO: ["Ovo je moja kancelarija... Dobro, budna sam."],
};
```

`src/data/cities.ts`:

```typescript
// Longitude, latitude (degrees).
export type LonLat = readonly [number, number];

// Every city that has an office in OFFICES.
export const CITIES: Record<string, LonLat> = {
  Beograd: [20.4573, 44.8176],
  "Novi Sad": [19.8335, 45.2671],
  Kragujevac: [20.9114, 44.0128],
  Niš: [21.8958, 43.3209],
  Valjevo: [19.8903, 44.2751],
  Pančevo: [20.6403, 44.8708],
  Smederevo: [20.9301, 44.6628],
  Zrenjanin: [20.3911, 45.3816],
  Sombor: [19.1122, 45.7742],
  "Sremska Mitrovica": [19.6122, 44.9764],
  Subotica: [19.6658, 46.1003],
  Šabac: [19.6908, 44.7489],
  Jagodina: [21.2615, 43.9771],
  Kraljevo: [20.6873, 43.7258],
  Kruševac: [21.3339, 43.58],
  "Novi Pazar": [20.5122, 43.1367],
  Požarevac: [21.1878, 44.6213],
  Užice: [19.8488, 43.8556],
  Čačak: [20.3497, 43.8914],
  Vranje: [21.9003, 42.5514],
  Zaječar: [22.2858, 43.9042],
  Leskovac: [21.9461, 42.9981],
  Negotin: [22.5308, 44.2264],
  Pirot: [22.5861, 43.1531],
  Prokuplje: [21.5881, 43.2342],
  Lazarevac: [20.2572, 44.3853],
  Mladenovac: [20.6967, 44.4378],
  Obrenovac: [20.2008, 44.655],
  Mionica: [20.0528, 44.2511],
  Ub: [20.0739, 44.4561],
  Vršac: [21.3036, 45.1167],
  "Velika Plana": [21.0758, 44.3339],
  "Bačka Palanka": [19.3917, 45.2508],
  Senta: [20.0772, 45.9275],
  Loznica: [19.225, 44.5333],
  Vrbas: [19.6408, 45.5714],
};
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run src/data/offices.test.ts`
Expected: PASS (7 tests). If "knows the coordinates" fails, a city name in the CSV differs from `CITIES` — add that exact name to `CITIES`.

Run: `npm test`
Expected: PASS (all files).

- [ ] **Step 6: Commit**

```bash
git add scripts/make-offices.py src/data/offices-list.ts src/data/offices.ts src/data/replies.ts src/data/cities.ts src/data/offices.test.ts
git commit -m "feat: prosecutor's office data from tuzilastva.csv"
```

---

### Task 2: Serbia map data and geometry

**Files:**
- Create: `scripts/make-map.py`, `src/data/serbia-geo.ts` (generated), `src/geo.ts`
- Modify: `.gitignore` (add `scripts/.cache`)
- Test: `src/geo.test.ts`

Natural Earth has a single "Morava" line (no Velika/Južna/Zapadna split as the spec lists); the plan uses it plus Nišava and Tamiš from the Europe rivers file.

**Interfaces:**
- Consumes: `LonLat`, `CITIES` (Task 1)
- Produces:
  - `VIEW_BOX: { lonMin: number; latMin: number; lonMax: number; latMax: number }`
  - `SERBIA_RINGS: readonly (readonly LonLat[])[]` (Serbia+Kosovo; inside = inside any ring)
  - `NEIGHBOURS: readonly { name: string; label: LonLat; rings: readonly (readonly LonLat[])[] }[]`
  - `RIVERS: readonly { name: string; width: number; path: readonly LonLat[] }[]`
  - `type Point = { x: number; y: number }`, `type Bounds = { x: number; y: number; w: number; h: number }`
  - `UNITS_PER_DEGREE = 370`, `project(lonLat: LonLat): Point`, `projectRing(ring: readonly LonLat[]): Point[]`, `mapBounds(): Bounds`
  - `isInside(p: Point, ring: readonly Point[]): boolean`, `isInsideAny(p: Point, rings: readonly (readonly Point[])[]): boolean`
  - `tryMove(from: Point, delta: Point, canStand: (p: Point) => boolean): Point`

- [ ] **Step 1: Write the map generator** — `scripts/make-map.py`

```python
"""Build src/data/serbia-geo.ts from Natural Earth (public domain).

Run: python scripts/make-map.py
Downloads ~23 MB once into scripts/.cache/ (git-ignored). Output is committed;
the game never downloads anything.
"""
import json
import math
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts" / ".cache"
OUT = ROOT / "src" / "data" / "serbia-geo.ts"
BASE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"

VIEW_BOX = (18.2, 41.6, 23.6, 46.5)  # lon_min, lat_min, lon_max, lat_max
SERBIA = ("SRB", "KOS")  # Serbia including Kosovo
SERBIA_TOLERANCE = 0.004  # degrees (~0.4 km)
NEIGHBOUR_TOLERANCE = 0.02
RIVER_TOLERANCE = 0.008
NEIGHBOURS = {
    "HUN": "Mađarska", "ROU": "Rumunija", "BGR": "Bugarska", "MKD": "Severna Makedonija",
    "ALB": "Albanija", "MNE": "Crna Gora", "BIH": "Bosna i Hercegovina", "HRV": "Hrvatska",
}
# Natural Earth name -> (label, stroke width in game units)
RIVERS = {"Danube": ("Dunav", 7), "Sava": ("Sava", 5), "Tisa": ("Tisa", 5), "Drina": ("Drina", 4), "Morava": ("Morava", 4)}
EU_RIVERS = {"Nišava": ("Nišava", 3), "Timiş": ("Tamiš", 3)}


def fetch(name: str) -> dict:
    path = CACHE / name
    if not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(BASE + name, path)
    return json.loads(path.read_text(encoding="utf-8"))


def polygons(geometry: dict) -> list:
    return geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]


def line_parts(geometry: dict) -> list:
    return geometry["coordinates"] if geometry["type"] == "MultiLineString" else [geometry["coordinates"]]


def in_box(point, margin: float = 0.0) -> bool:
    lon, lat = point[0], point[1]
    return (VIEW_BOX[0] - margin <= lon <= VIEW_BOX[2] + margin
            and VIEW_BOX[1] - margin <= lat <= VIEW_BOX[3] + margin)


def segment_distance(p, a, b) -> float:
    ax, ay, bx, by, px, py = a[0], a[1], b[0], b[1], p[0], p[1]
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def simplify(points: list, tolerance: float) -> list:
    """Douglas-Peucker on an open polyline (iterative, keeps both ends)."""
    if len(points) < 3:
        return list(points)
    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        best, index = 0.0, -1
        for i in range(start + 1, end):
            d = segment_distance(points[i], points[start], points[end])
            if d > best:
                best, index = d, i
        if index != -1 and best > tolerance:
            keep[index] = True
            stack += [(start, index), (index, end)]
    return [p for p, k in zip(points, keep) if k]


def simplify_ring(ring: list, tolerance: float) -> list:
    """Simplify a ring (first point == last point); returns an open ring."""
    ring = ring[:-1] if ring[0] == ring[-1] else ring
    far = max(range(len(ring)), key=lambda i: math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]))
    first = simplify(ring[: far + 1], tolerance)
    second = simplify(ring[far:] + [ring[0]], tolerance)
    return first[:-1] + second[:-1]


def merge_rings(a: list, b: list):
    """Union of two rings that share a border: drop shared edges, walk the rest.

    Returns one closed ring, or None if the rings do not share exact vertices.
    """
    def key(p):
        return (round(p[0], 7), round(p[1], 7))

    counts = {}
    for ring in (a, b):
        for p, q in zip(ring, ring[1:]):
            if key(p) != key(q):
                edge = frozenset((key(p), key(q)))
                counts[edge] = counts.get(edge, 0) + 1
    outer = [tuple(edge) for edge, n in counts.items() if n == 1]
    links = {}
    for p, q in outer:
        links.setdefault(p, []).append(q)
        links.setdefault(q, []).append(p)
    if any(len(v) != 2 for v in links.values()):
        return None
    start = outer[0][0]
    ring, previous, current = [start], None, start
    while True:
        nxt = links[current][0] if links[current][0] != previous else links[current][1]
        previous, current = current, nxt
        if current == start:
            break
        ring.append(current)
        if len(ring) > len(outer):
            return None
    if len(ring) != len(outer):
        return None
    return [list(p) for p in ring] + [list(ring[0])]


def clip_to_box(line: list, margin: float) -> list:
    """Split a polyline into the runs of points inside the (padded) view box."""
    runs, run = [], []
    for point in line:
        if in_box(point, margin):
            run.append(point)
        elif run:
            runs.append(run)
            run = []
    if run:
        runs.append(run)
    return [r for r in runs if len(r) >= 2]


def rounded(points: list) -> list:
    return [[round(p[0], 4), round(p[1], 4)] for p in points]


def main() -> None:
    countries = fetch("ne_10m_admin_0_countries.geojson")["features"]
    by_code = {f["properties"]["ADM0_A3"]: f["geometry"] for f in countries}

    serbia_exteriors = [polygons(by_code[code])[0][0] for code in SERBIA]
    merged = merge_rings(*serbia_exteriors)
    serbia_rings = [merged] if merged else serbia_exteriors
    serbia_rings = [rounded(simplify_ring(r, SERBIA_TOLERANCE)) for r in serbia_rings]

    neighbours = []
    for code, name in NEIGHBOURS.items():
        rings = [poly[0] for poly in polygons(by_code[code]) if any(in_box(p, 1.0) for p in poly[0])]
        inside = [p for ring in rings for p in ring if in_box(p)]
        label = [sum(p[0] for p in inside) / len(inside), sum(p[1] for p in inside) / len(inside)]
        neighbours.append({
            "name": name,
            "label": [round(label[0], 4), round(label[1], 4)],
            "rings": [rounded(simplify_ring(r, NEIGHBOUR_TOLERANCE)) for r in rings],
        })

    rivers = []
    for file, wanted in (("ne_10m_rivers_lake_centerlines.geojson", RIVERS), ("ne_10m_rivers_europe.geojson", EU_RIVERS)):
        for feature in fetch(file)["features"]:
            source = feature["properties"].get("name")
            if source not in wanted or not feature["geometry"]:
                continue
            label, width = wanted[source]
            for part in line_parts(feature["geometry"]):
                for run in clip_to_box(part, 0.3):
                    rivers.append({"name": label, "width": width, "path": rounded(simplify(run, RIVER_TOLERANCE))})

    def ts(value) -> str:
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))

    lon_min, lat_min, lon_max, lat_max = VIEW_BOX
    text = "\n".join([
        "// Generated by scripts/make-map.py from Natural Earth (public domain). Do not edit.",
        'import type { LonLat } from "./cities";',
        "",
        f"export const VIEW_BOX = {{ lonMin: {lon_min}, latMin: {lat_min}, lonMax: {lon_max}, latMax: {lat_max} }} as const;",
        "",
        "// Serbia including Kosovo. A point is on land if it is inside any ring.",
        f"export const SERBIA_RINGS: readonly (readonly LonLat[])[] = {ts(serbia_rings)};",
        "",
        f"export const NEIGHBOURS: readonly {{ name: string; label: LonLat; rings: readonly (readonly LonLat[])[] }}[] = {ts(neighbours)};",
        "",
        f"export const RIVERS: readonly {{ name: string; width: number; path: readonly LonLat[] }}[] = {ts(rivers)};",
        "",
    ])
    OUT.write_text(text, encoding="utf-8", newline="\n")
    points = sum(len(r) for r in serbia_rings)
    print(f"Serbia: {len(serbia_rings)} ring(s), {points} points; neighbours: {len(neighbours)}; river parts: {len(rivers)}")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
```

Add `scripts/.cache` to `.gitignore`.

Run: `python scripts/make-map.py`
Expected: `Serbia: 1 ring(s), <300–700> points; neighbours: 8; river parts: <n>` and a file under ~150 KB. `2 ring(s)` is acceptable (merge fallback); the outline will then show the Serbia/Kosovo line — record a ruling.

- [ ] **Step 2: Write the failing test** — `src/geo.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { CITIES, type LonLat } from "./data/cities";
import { SERBIA_RINGS } from "./data/serbia-geo";
import { isInside, isInsideAny, mapBounds, project, projectRing, tryMove, type Point } from "./geo";

const square: Point[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];
const serbia = SERBIA_RINGS.map(projectRing);
const onLand = (lonLat: LonLat) => isInsideAny(project(lonLat), serbia);

describe("isInside", () => {
  it("is true inside a ring and false outside it", () => {
    expect(isInside({ x: 5, y: 5 }, square)).toBe(true);
    expect(isInside({ x: 15, y: 5 }, square)).toBe(false);
    expect(isInside({ x: 5, y: -1 }, square)).toBe(false);
  });
});

describe("project", () => {
  it("puts north up and east to the right", () => {
    expect(project([20, 46]).y).toBeLessThan(project([20, 44]).y);
    expect(project([22, 44]).x).toBeGreaterThan(project([20, 44]).x);
  });

  it("makes Serbia about 1600 units tall inside positive map bounds", () => {
    expect(project([20, 41.85]).y - project([20, 46.19]).y).toBeCloseTo(1606, -1);
    const bounds = mapBounds();
    expect(bounds.w).toBeGreaterThan(0);
    expect(bounds.h).toBeGreaterThan(0);
  });
});

describe("Serbia outline", () => {
  it("contains Beograd, Niš, Subotica and Priština (Kosovo included)", () => {
    expect(onLand([20.4573, 44.8176])).toBe(true);
    expect(onLand([21.8958, 43.3209])).toBe(true);
    expect(onLand([19.6658, 46.1003])).toBe(true);
    expect(onLand([21.1655, 42.6629])).toBe(true);
  });

  it("does not contain Budapest, Sarajevo or Timișoara", () => {
    expect(onLand([19.0402, 47.4979])).toBe(false);
    expect(onLand([18.4131, 43.8563])).toBe(false);
    expect(onLand([21.2087, 45.7489])).toBe(false);
  });

  it("contains every city that has an office", () => {
    for (const [name, lonLat] of Object.entries(CITIES)) {
      expect(onLand(lonLat), name).toBe(true);
    }
  });
});

describe("tryMove", () => {
  const inSquare = (p: Point) => isInside(p, square);

  it("takes the full move when the target is allowed", () => {
    expect(tryMove({ x: 5, y: 5 }, { x: 1, y: 1 }, inSquare)).toEqual({ x: 6, y: 6 });
  });

  it("slides along the border when a diagonal is blocked", () => {
    expect(tryMove({ x: 9.5, y: 5 }, { x: 1, y: 1 }, inSquare)).toEqual({ x: 9.5, y: 6 });
    expect(tryMove({ x: 5, y: 9.5 }, { x: 1, y: 1 }, inSquare)).toEqual({ x: 6, y: 9.5 });
  });

  it("stays put when every option leaves the land", () => {
    expect(tryMove({ x: 9.5, y: 9.5 }, { x: 1, y: 1 }, inSquare)).toEqual({ x: 9.5, y: 9.5 });
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/geo.test.ts`
Expected: FAIL — cannot find module `./geo`.

- [ ] **Step 4: Implement** — `src/geo.ts`

```typescript
import type { LonLat } from "./data/cities";
import { VIEW_BOX } from "./data/serbia-geo";

export type Point = { x: number; y: number };
export type Bounds = { x: number; y: number; w: number; h: number };

// Game units per degree of latitude: Serbia (~4.34° tall) is ~1600 units.
export const UNITS_PER_DEGREE = 370;
// Equirectangular around Serbia's middle latitude keeps shapes undistorted.
const LON_SCALE = Math.cos((44 * Math.PI) / 180);

export function project([lon, lat]: LonLat): Point {
  return {
    x: (lon - VIEW_BOX.lonMin) * UNITS_PER_DEGREE * LON_SCALE,
    y: (VIEW_BOX.latMax - lat) * UNITS_PER_DEGREE,
  };
}

export function projectRing(ring: readonly LonLat[]): Point[] {
  return ring.map(project);
}

export function mapBounds(): Bounds {
  const topLeft = project([VIEW_BOX.lonMin, VIEW_BOX.latMax]);
  const bottomRight = project([VIEW_BOX.lonMax, VIEW_BOX.latMin]);
  return { x: topLeft.x, y: topLeft.y, w: bottomRight.x - topLeft.x, h: bottomRight.y - topLeft.y };
}

// Ray casting: count edge crossings of a ray going right from p.
export function isInside(p: Point, ring: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

export function isInsideAny(p: Point, rings: readonly (readonly Point[])[]): boolean {
  return rings.some((ring) => isInside(p, ring));
}

// Full move if allowed; otherwise slide along x or y; otherwise stay.
export function tryMove(from: Point, delta: Point, canStand: (p: Point) => boolean): Point {
  const options = [
    { x: from.x + delta.x, y: from.y + delta.y },
    { x: from.x + delta.x, y: from.y },
    { x: from.x, y: from.y + delta.y },
  ];
  for (const option of options) {
    const moves = option.x !== from.x || option.y !== from.y;
    if (moves && canStand(option)) {
      return option;
    }
  }
  return from;
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run src/geo.test.ts`
Expected: PASS (9 tests). If one city in "contains every city" fails, it sits within the simplification error of the border: lower `SERBIA_TOLERANCE` to `0.002`, regenerate, and rerun; if it still fails, move that city's coordinate ≤0.02° inland in `src/data/cities.ts` and record a ruling.

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/make-map.py src/data/serbia-geo.ts src/geo.ts src/geo.test.ts .gitignore
git commit -m "feat: Serbia outline, rivers and neighbours with map geometry"
```

---

### Task 3: Office layout, touch triggers, spawn

**Files:**
- Create: `src/officeLayout.ts`
- Test: `src/officeLayout.test.ts`

**Interfaces:**
- Consumes: `Point`, `project`, `projectRing`, `isInsideAny` (Task 2); `OFFICES`, `CITIES` (Task 1); `SERBIA_RINGS` (Task 2)
- Produces:
  - `MARKER_SIZE = 10`, `MARKER_GAP = 2`, `TOUCH_RADIUS = 9`, `MAX_RING_RADIUS = 40`, `START_CITY = "Beograd"`
  - `ringRadius(count: number): number`
  - `layoutOffices(offices: readonly { id: string; city: string }[], cityPoint: (city: string) => Point): Map<string, Point>`
  - `touchedOffice(feet: Point, positions: ReadonlyMap<string, Point>): string | null`
  - `visitToStart(touched: string | null, lastTouched: string | null, blocked: boolean): string | null`
  - `spawnPoint(): Point`

- [ ] **Step 1: Write the failing test** — `src/officeLayout.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { CITIES } from "./data/cities";
import { OFFICES } from "./data/offices";
import { SERBIA_RINGS } from "./data/serbia-geo";
import { isInsideAny, project, projectRing, type Point } from "./geo";
import {
  MARKER_GAP,
  MARKER_SIZE,
  MAX_RING_RADIUS,
  TOUCH_RADIUS,
  layoutOffices,
  spawnPoint,
  touchedOffice,
  visitToStart,
} from "./officeLayout";

const city: Point = { x: 100, y: 100 };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const serbia = SERBIA_RINGS.map(projectRing);

describe("layoutOffices", () => {
  it("puts a city's only office on the city point", () => {
    const positions = layoutOffices([{ id: "a", city: "X" }], () => city);
    expect(positions.get("a")).toEqual(city);
  });

  it("rings many offices around their city without overlap", () => {
    const offices = Array.from({ length: 9 }, (_, i) => ({ id: `o${i}`, city: "X" }));
    const points = [...layoutOffices(offices, () => city).values()];
    for (const p of points) {
      expect(distance(p, city)).toBeLessThanOrEqual(MAX_RING_RADIUS);
    }
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        expect(distance(points[i], points[j])).toBeGreaterThanOrEqual(MARKER_SIZE + MARKER_GAP);
      }
    }
  });

  it("places every real office on land", () => {
    const positions = layoutOffices(OFFICES, (name) => project(CITIES[name]));
    expect(positions.size).toBe(OFFICES.length);
    for (const [id, p] of positions) {
      expect(isInsideAny(p, serbia), id).toBe(true);
    }
  });
});

describe("touchedOffice", () => {
  const positions = new Map<string, Point>([
    ["near", { x: 0, y: 0 }],
    ["far", { x: 50, y: 0 }],
  ]);

  it("returns the office whose marker the feet touch", () => {
    expect(touchedOffice({ x: TOUCH_RADIUS - 1, y: 0 }, positions)).toBe("near");
  });

  it("returns null when no marker is in reach", () => {
    expect(touchedOffice({ x: 25, y: 0 }, positions)).toBeNull();
  });
});

describe("visitToStart", () => {
  it("starts a visit when stepping onto a new office", () => {
    expect(visitToStart("a", null, false)).toBe("a");
    expect(visitToStart("b", "a", false)).toBe("b");
  });

  it("does not restart while still standing on the same office", () => {
    expect(visitToStart("a", "a", false)).toBeNull();
  });

  it("does not start a visit while a dialog is open", () => {
    expect(visitToStart("b", "a", true)).toBeNull();
  });

  it("does nothing when not touching an office", () => {
    expect(visitToStart(null, "a", false)).toBeNull();
  });
});

describe("spawnPoint", () => {
  it("starts the princess on land near Beograd, not on an office", () => {
    const spawn = spawnPoint();
    expect(isInsideAny(spawn, serbia)).toBe(true);
    expect(distance(spawn, project(CITIES.Beograd))).toBeLessThan(80);
    const positions = layoutOffices(OFFICES, (name) => project(CITIES[name]));
    expect(touchedOffice(spawn, positions)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/officeLayout.test.ts`
Expected: FAIL — cannot find module `./officeLayout`.

- [ ] **Step 3: Implement** — `src/officeLayout.ts`

```typescript
import { CITIES } from "./data/cities";
import { project, type Point } from "./geo";

// Office marker size and spacing, in game units.
export const MARKER_SIZE = 10;
export const MARKER_GAP = 2;
// Feet within this distance of a marker count as touching it.
export const TOUCH_RADIUS = 9;
export const MAX_RING_RADIUS = 40;
export const START_CITY = "Beograd";
// She wakes a little south of Beograd's offices, on land.
const SPAWN_OFFSET: Point = { x: 0, y: 45 };

export function ringRadius(count: number): number {
  if (count <= 1) {
    return 0;
  }
  return Math.max(14, (count * (MARKER_SIZE + 4)) / (2 * Math.PI));
}

// Offices of one city sit evenly on a ring around the city point, first at the top.
export function layoutOffices(
  offices: readonly { id: string; city: string }[],
  cityPoint: (city: string) => Point,
): Map<string, Point> {
  const byCity = new Map<string, string[]>();
  for (const office of offices) {
    byCity.set(office.city, [...(byCity.get(office.city) ?? []), office.id]);
  }
  const positions = new Map<string, Point>();
  for (const [city, ids] of byCity) {
    const center = cityPoint(city);
    const radius = ringRadius(ids.length);
    ids.forEach((id, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / ids.length;
      positions.set(id, { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) });
    });
  }
  return positions;
}

export function touchedOffice(feet: Point, positions: ReadonlyMap<string, Point>): string | null {
  let best: string | null = null;
  let bestDistance = TOUCH_RADIUS;
  for (const [id, p] of positions) {
    const d = Math.hypot(feet.x - p.x, feet.y - p.y);
    if (d < bestDistance) {
      best = id;
      bestDistance = d;
    }
  }
  return best;
}

// A visit starts when the feet reach an office they were not already on.
export function visitToStart(touched: string | null, lastTouched: string | null, blocked: boolean): string | null {
  if (blocked || touched === null || touched === lastTouched) {
    return null;
  }
  return touched;
}

export function spawnPoint(): Point {
  const city = project(CITIES[START_CITY]);
  return { x: city.x + SPAWN_OFFSET.x, y: city.y + SPAWN_OFFSET.y };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/officeLayout.test.ts`
Expected: PASS (10 tests). If "places every real office on land" fails for a border city's ring, move that city ≤0.02° inland in `src/data/cities.ts`, rerun Task 2's tests too, and record a ruling.

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/officeLayout.ts src/officeLayout.test.ts
git commit -m "feat: office ring layout, touch triggers and Beograd spawn"
```

---

### Task 4: Zoom and camera clamping

**Files:**
- Create: `src/zoom.ts`
- Test: `src/zoom.test.ts`

**Interfaces:**
- Consumes: `Point`, `Bounds` (Task 2)
- Produces: `ZOOM_MIN = 0.09`, `ZOOM_MAX = 1`, `ZOOM_START = 0.5`, `ZOOM_STEP = 1.25`, `clampZoom(z: number): number`, `zoomIn(z: number): number`, `zoomOut(z: number): number`, `clampCamera(center: Point, view: { w: number; h: number }, bounds: Bounds): Point`

Zoom 1 is today's close view (320×180 game units on screen); zoom 0.09 shows ~3556×2000 units, all of the ~1440×1813 map.

- [ ] **Step 1: Write the failing test** — `src/zoom.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import type { Bounds } from "./geo";
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, clampCamera, clampZoom, zoomIn, zoomOut } from "./zoom";

const bounds: Bounds = { x: 0, y: 0, w: 1000, h: 800 };

describe("zoom", () => {
  it("steps by a fixed factor", () => {
    expect(zoomIn(0.4)).toBeCloseTo(0.4 * ZOOM_STEP);
    expect(zoomOut(0.4)).toBeCloseTo(0.4 / ZOOM_STEP);
  });

  it("never goes past its limits", () => {
    expect(zoomIn(ZOOM_MAX)).toBe(ZOOM_MAX);
    expect(zoomOut(ZOOM_MIN)).toBe(ZOOM_MIN);
    expect(clampZoom(5)).toBe(ZOOM_MAX);
    expect(clampZoom(0)).toBe(ZOOM_MIN);
  });
});

describe("clampCamera", () => {
  it("follows the target when the view fits inside the map", () => {
    expect(clampCamera({ x: 500, y: 400 }, { w: 200, h: 100 }, bounds)).toEqual({ x: 500, y: 400 });
  });

  it("stops at the map edges", () => {
    expect(clampCamera({ x: 10, y: 790 }, { w: 200, h: 100 }, bounds)).toEqual({ x: 100, y: 750 });
  });

  it("centers on the map when the view is bigger than it", () => {
    expect(clampCamera({ x: 10, y: 10 }, { w: 3000, h: 2000 }, bounds)).toEqual({ x: 500, y: 400 });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/zoom.test.ts`
Expected: FAIL — cannot find module `./zoom`.

- [ ] **Step 3: Implement** — `src/zoom.ts`

```typescript
import type { Bounds, Point } from "./geo";

// 1 = today's close view; ZOOM_MIN shows all of Serbia.
export const ZOOM_MIN = 0.09;
export const ZOOM_MAX = 1;
export const ZOOM_START = 0.5;
export const ZOOM_STEP = 1.25;

export function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

export function zoomIn(zoom: number): number {
  return clampZoom(zoom * ZOOM_STEP);
}

export function zoomOut(zoom: number): number {
  return clampZoom(zoom / ZOOM_STEP);
}

function clampAxis(target: number, half: number, min: number, size: number): number {
  if (size <= half * 2) {
    return min + size / 2;
  }
  return Math.min(Math.max(target, min + half), min + size - half);
}

// Camera center that follows the target but never shows past the map edges.
export function clampCamera(center: Point, view: { w: number; h: number }, bounds: Bounds): Point {
  return {
    x: clampAxis(center.x, view.w / 2, bounds.x, bounds.w),
    y: clampAxis(center.y, view.h / 2, bounds.y, bounds.h),
  };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/zoom.test.ts`
Expected: PASS (5 tests).

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/zoom.ts src/zoom.test.ts
git commit -m "feat: zoom steps and camera clamped to the map"
```

---

### Task 5: Switch the game to the Serbia map

**Files:**
- Modify: `src/score.ts`, `src/score.test.ts`, `src/progress.test.ts`, `src/session.test.ts`, `src/scenes/overworld.ts` (rewrite), `src/scenes/ending.ts`, `src/data/story.ts`, `src/assets.ts`
- Delete: `src/data/lords.ts`, `src/data/lords.test.ts`
- Test: `src/score.test.ts`, `src/progress.test.ts`, `src/session.test.ts`; manual browser check

**Interfaces:**
- Consumes: everything from Tasks 1–4; existing `dialog`, `shout`, `princess`, `session`, `kaplayContext` (`k`, `RENDER_SCALE`, `GAME_WIDTH`, `GAME_HEIGHT`, `FONT`, `addScreenLayer`), `assets` (`SPRITES`, `SPRITE_SCALE`)
- Produces: `visitOffice(state: ScoreState, id: string): { granted: number }` (replaces `visitLord`); scene `"overworld"` on the map.

- [ ] **Step 1: Write the failing tests**

`src/score.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { createScore, visitOffice } from "./score";

describe("visitOffice", () => {
  it("grants the office's level points only on the first visit", () => {
    const state = createScore();
    expect(visitOffice(state, "ojt-u-novom-sadu").granted).toBe(10);
    expect(visitOffice(state, "ojt-u-novom-sadu").granted).toBe(0);
    expect(state.total).toBe(10);
    expect(state.visited).toEqual(["ojt-u-novom-sadu"]);
  });

  it("grants more for higher levels", () => {
    const state = createScore();
    expect(visitOffice(state, "vjt-u-novom-sadu").granted).toBe(20);
    expect(visitOffice(state, "ajt-u-novom-sadu").granted).toBe(30);
    expect(visitOffice(state, "vrhovno-javno-tuzilastvo").granted).toBe(50);
    expect(state.total).toBe(100);
  });

  it("grants nothing for an unknown id and does not throw", () => {
    const state = createScore();
    expect(visitOffice(state, "dragon").granted).toBe(0);
    expect(state.total).toBe(0);
    expect(state.visited).toEqual([]);
  });
});
```

`src/progress.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { OFFICE_IDS } from "./data/offices";
import { isReadyForEnding } from "./progress";

describe("isReadyForEnding", () => {
  it("is false while one office is still asleep", () => {
    expect(isReadyForEnding(OFFICE_IDS.slice(1), OFFICE_IDS)).toBe(false);
  });

  it("is true once every office is visited", () => {
    expect(isReadyForEnding(OFFICE_IDS, OFFICE_IDS)).toBe(true);
  });

  it("ignores extra visited ids", () => {
    expect(isReadyForEnding([...OFFICE_IDS, "dragon"], OFFICE_IDS)).toBe(true);
  });
});
```

`src/session.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { visitOffice } from "./score";
import { getSession, resetSession } from "./session";

describe("session", () => {
  it("keeps score across scene hops until reset", () => {
    resetSession();
    visitOffice(getSession().score, "ojt-u-novom-sadu");
    expect(getSession().score.total).toBe(10);
  });

  it("starts a fresh score of 0 on reset", () => {
    resetSession();
    visitOffice(getSession().score, "vrhovno-javno-tuzilastvo");
    resetSession();
    expect(getSession().score).toEqual({ total: 0, visited: [] });
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test`
Expected: FAIL — `visitOffice` is not exported by `./score`.

- [ ] **Step 3: Switch score to offices; delete lords**

`src/score.ts`:

```typescript
import { getOffice } from "./data/offices";

export type ScoreState = {
  total: number;
  visited: string[];
};

export function createScore(): ScoreState {
  return { total: 0, visited: [] };
}

export function visitOffice(state: ScoreState, id: string): { granted: number } {
  const office = getOffice(id);
  if (!office || state.visited.includes(id)) {
    return { granted: 0 };
  }
  state.visited.push(id);
  state.total += office.points;
  return { granted: office.points };
}
```

Run: `git rm src/data/lords.ts src/data/lords.test.ts`

- [ ] **Step 4: Run unit tests**

Run: `npm test`
Expected: PASS (the old overworld/ending will not type-check yet; fixed in the next steps).

- [ ] **Step 5: Story copy, ending, font** 

`src/data/story.ts` — replace `WAKE_LINES` and `ENDING_LINES` (keep `TITLE` and `SHOUT_LINE`):

```typescript
export const WAKE_LINES: readonly string[] = [
  "The old princess opens one eye.",
  "A voice from the door: The prosecutors are asleep. Visit every office in Serbia and wake them up.",
  "She sighs, puts on her medal, and stands.",
];

export const ENDING_LINES: readonly string[] = [
  "Every prosecutor's office is awake.",
  "Zaga can nap again - after tea.",
];
```

`src/scenes/ending.ts` — change the import `import { maxScore } from "../data/lords";` to `import { maxScore } from "../data/offices";` (nothing else changes).

`src/assets.ts` — add the latin-ext face right after `k.loadFont(...)`:

```typescript
import pixelFontExtUrl from "@fontsource/press-start-2p/files/press-start-2p-latin-ext-400-normal.woff2?url";
```

```typescript
  // č ć š ž đ live in the latin-ext file. Added after loadFont with a limited
  // unicode-range in the same family, so the browser uses it for those letters.
  const latinExt = new FontFace(FONT, `url(${pixelFontExtUrl})`, { unicodeRange: "U+0100-024F" });
  document.fonts.add(latinExt);
  k.load(latinExt.load());
```

- [ ] **Step 6: Rewrite the overworld** — `src/scenes/overworld.ts`

```typescript
import { SPRITE_SCALE, SPRITES } from "../assets";
import { CITIES } from "../data/cities";
import { maxScore, OFFICE_IDS, OFFICES, getOffice, type OfficeLevel } from "../data/offices";
import { NEIGHBOURS, RIVERS, SERBIA_RINGS } from "../data/serbia-geo";
import { SHOUT_LINE } from "../data/story";
import {
  ADVANCE_KEYS,
  advanceDialog,
  createDialog,
  currentLine,
  isMovementBlocked,
  openDialog,
} from "../dialog";
import { isInsideAny, mapBounds, project, projectRing, tryMove, type Point } from "../geo";
import { addScreenLayer, GAME_HEIGHT, GAME_WIDTH, k, RENDER_SCALE } from "../kaplayContext";
import { layoutOffices, MARKER_SIZE, spawnPoint, touchedOffice, visitToStart } from "../officeLayout";
import { faceFromInput, pickAnim, type Facing, type PrincessAnim } from "../princess";
import { isReadyForEnding } from "../progress";
import { visitOffice } from "../score";
import { getSession } from "../session";
import { createShout, isShouting, startShout, tickShout, withShout } from "../shout";
import { clampCamera, ZOOM_START, zoomIn, zoomOut } from "../zoom";

const SPEED = 80;
const SHOUT_KEY = "e";
// Feet sit at the sprite's bottom; the camera looks at her middle.
const BODY_CENTER = 12;
// Show city names from this zoom up; office names only near her when close.
const CITY_LABEL_ZOOM = 0.2;
const OFFICE_LABEL_ZOOM = 0.6;
const OFFICE_LABEL_DISTANCE = 60;

type RGB = [number, number, number];
const PAPER: RGB = [236, 226, 198];
const NEIGHBOUR: RGB = [214, 204, 180];
const NEIGHBOUR_EDGE: RGB = [150, 138, 116];
const LAND: RGB = [248, 212, 136];
const INK: RGB = [58, 38, 28];
const RIVER: RGB = [86, 156, 216];
const ROOF: RGB = [176, 62, 48];
const CHECK: RGB = [40, 150, 70];
const LEVEL_COLORS: Record<OfficeLevel, RGB> = {
  OJT: [156, 156, 166],
  VJT: [72, 120, 204],
  AJT: [62, 162, 92],
  PJT: [142, 82, 192],
  VRHOVNO: [232, 182, 40],
};

const rgb = (c: RGB) => k.rgb(c[0], c[1], c[2]);
const vec = (p: Point) => k.vec2(p.x, p.y);

type Shape = { pts: ReturnType<typeof k.vec2>[]; indices: number[] };

// Triangulate once; drawPolygon then reuses the indices every frame.
function shape(ring: readonly Point[]): Shape {
  const pts = ring.map(vec);
  const indices = k.triangulate(pts).flat().map((p) => pts.indexOf(p));
  return { pts, indices };
}

export function registerOverworldScene(): void {
  k.scene("overworld", () => {
    const session = getSession();
    const dialog = createDialog();
    const shout = createShout();
    const bounds = mapBounds();
    let zoom = ZOOM_START;
    let facing: Facing = "right";
    let anim: PrincessAnim = "idle";
    let lastTouched: string | null = null;

    const serbia = SERBIA_RINGS.map(projectRing);
    const serbiaShapes = serbia.map(shape);
    const neighbours = NEIGHBOURS.map((n) => ({
      name: n.name,
      label: vec(project(n.label)),
      shapes: n.rings.map((ring) => shape(projectRing(ring))),
    }));
    const rivers = RIVERS.map((r) => ({ width: r.width, pts: projectRing(r.path).map(vec) }));
    const cityPoint = (name: string) => project(CITIES[name]);
    const officePos = layoutOffices(OFFICES, cityPoint);
    const cities = [...new Set(OFFICES.map((o) => o.city))].map((name) => ({ name, pos: vec(cityPoint(name)) }));

    // Screen pixels → game units at the current zoom, for outlines and labels.
    const px = (n: number) => n / (zoom * RENDER_SCALE);

    function label(text: string, pos: ReturnType<typeof k.vec2>, sizePx: number, color: RGB): void {
      k.drawText({ text, pos, size: px(sizePx), anchor: "center", color: rgb(color) });
    }

    function drawOffice(id: string, level: OfficeLevel, name: string, feet: Point): void {
      const p = vec(officePos.get(id) as Point);
      const s = MARKER_SIZE;
      k.drawRect({
        pos: p,
        width: s,
        height: s * 0.7,
        anchor: "center",
        color: rgb(LEVEL_COLORS[level]),
        outline: { width: px(1.5), color: rgb(INK) },
      });
      k.drawTriangle({
        p1: p.add(-s * 0.65, -s * 0.35),
        p2: p.add(s * 0.65, -s * 0.35),
        p3: p.add(0, -s * 0.9),
        color: rgb(ROOF),
        outline: { width: px(1.5), color: rgb(INK) },
      });
      if (session.score.visited.includes(id)) {
        k.drawLines({ pts: [p.add(-3, 0), p.add(-1, 2.5), p.add(3.5, -2.5)], width: px(3), color: rgb(CHECK) });
      }
      const near = Math.hypot(feet.x - p.x, feet.y - p.y) < OFFICE_LABEL_DISTANCE;
      if (zoom >= OFFICE_LABEL_ZOOM && near) {
        label(name, p.add(0, s), 8, INK);
      }
    }

    k.add([
      k.z(0),
      {
        draw() {
          const feet = { x: player.pos.x, y: player.pos.y };
          k.drawRect({ pos: k.vec2(bounds.x, bounds.y), width: bounds.w, height: bounds.h, color: rgb(PAPER) });
          for (const n of neighbours) {
            for (const s of n.shapes) {
              k.drawPolygon({ pts: s.pts, indices: s.indices, color: rgb(NEIGHBOUR), outline: { width: px(2), color: rgb(NEIGHBOUR_EDGE) } });
            }
          }
          for (const s of serbiaShapes) {
            k.drawPolygon({ pts: s.pts, indices: s.indices, offset: k.vec2(px(5), px(6)), color: rgb(INK), opacity: 0.25 });
          }
          for (const s of serbiaShapes) {
            k.drawPolygon({ pts: s.pts, indices: s.indices, color: rgb(LAND), outline: { width: px(5), color: rgb(INK) } });
          }
          for (const r of rivers) {
            k.drawLines({ pts: r.pts, width: Math.max(r.width, px(2)), color: rgb(RIVER), join: "round" });
          }
          for (const n of neighbours) {
            label(n.name, n.label, 10, NEIGHBOUR_EDGE);
          }
          for (const c of cities) {
            k.drawCircle({ pos: c.pos, radius: px(4), color: rgb(INK) });
            if (zoom >= CITY_LABEL_ZOOM) {
              label(c.name, c.pos.add(0, px(14)), 8, INK);
            }
          }
          for (const office of OFFICES) {
            drawOffice(office.id, office.level, office.name, feet);
          }
        },
      },
    ]);

    const spawn = spawnPoint();
    const player = k.add([
      k.sprite(SPRITES.princess, { anim: "idle" }),
      k.scale(SPRITE_SCALE),
      k.pos(spawn.x, spawn.y),
      k.anchor("bot"),
      k.z(10),
      "player",
    ]);

    const bubble = k.add([
      k.rect(SHOUT_LINE.length * 4 + 8, 10, { radius: 2 }),
      k.pos(0, 0),
      k.anchor("bot"),
      k.scale(1),
      k.color(250, 246, 230),
      k.outline(0.5, k.rgb(12, 10, 20)),
      k.opacity(0),
      k.z(20),
    ]);
    const bubbleText = bubble.add([
      k.text(SHOUT_LINE, { size: 4 }),
      k.pos(0, -3),
      k.anchor("center"),
      k.color(12, 10, 20),
      k.opacity(0),
    ]);

    const ui = addScreenLayer();
    ui.add([k.rect(GAME_WIDTH, 16), k.pos(0, 0), k.color(12, 10, 20), k.opacity(0.85)]);
    const hud = ui.add([k.text(hudText(), { size: 8 }), k.pos(8, 4)]);
    const dialogBox = ui.add([
      k.rect(300, 48),
      k.pos(10, 122),
      k.color(12, 10, 20),
      k.outline(1, k.rgb(220, 200, 140)),
      k.opacity(0),
    ]);
    const dialogText = ui.add([k.text("", { size: 8, width: 284, lineSpacing: 4 }), k.pos(18, 130)]);

    function hudText(): string {
      return `Score ${session.score.total}/${maxScore()}  Offices ${session.score.visited.length}/${OFFICE_IDS.length}`;
    }

    function refreshDialog(): void {
      const text = currentLine(dialog);
      if (text === null) {
        dialogBox.opacity = 0;
        dialogBox.outline.width = 0;
        dialogText.text = "";
        if (isReadyForEnding(session.score.visited, OFFICE_IDS)) {
          k.go("ending");
        }
        return;
      }
      dialogBox.opacity = 1;
      dialogBox.outline.width = 1;
      dialogText.text = text;
    }

    function startVisit(id: string): void {
      const office = getOffice(id);
      if (!office) {
        return;
      }
      visitOffice(session.score, id);
      hud.text = hudText();
      openDialog(dialog, withShout(office.lines));
      refreshDialog();
    }

    function next(): void {
      if (!isMovementBlocked(dialog)) {
        return;
      }
      advanceDialog(dialog);
      refreshDialog();
    }

    for (const key of ADVANCE_KEYS) {
      k.onKeyPress(key, next);
    }
    k.onClick(next);
    k.onKeyPress(SHOUT_KEY, () => {
      if (!isMovementBlocked(dialog)) {
        startShout(shout);
      }
    });
    k.onScroll((delta) => {
      zoom = delta.y < 0 ? zoomIn(zoom) : zoomOut(zoom);
    });
    for (const key of ["=", "+"] as const) {
      k.onKeyPress(key, () => {
        zoom = zoomIn(zoom);
      });
    }
    k.onKeyPress("-", () => {
      zoom = zoomOut(zoom);
    });

    k.onUpdate(() => {
      tickShout(shout, k.dt());
      let dx = 0;
      let dy = 0;
      if (!isMovementBlocked(dialog) && !isShouting(shout)) {
        dx = Number(k.isKeyDown("right") || k.isKeyDown("d")) - Number(k.isKeyDown("left") || k.isKeyDown("a"));
        dy = Number(k.isKeyDown("down") || k.isKeyDown("s")) - Number(k.isKeyDown("up") || k.isKeyDown("w"));
        if (dx !== 0 || dy !== 0) {
          const step = (SPEED * k.dt()) / Math.hypot(dx, dy);
          const from = { x: player.pos.x, y: player.pos.y };
          const to = tryMove(from, { x: dx * step, y: dy * step }, (p) => isInsideAny(p, serbia));
          player.pos = vec(to);
        }
      }

      facing = faceFromInput(dx, facing);
      player.flipX = facing === "left";
      const shouting = isShouting(shout) || currentLine(dialog) === SHOUT_LINE;
      const nextAnim = pickAnim({ moving: dx !== 0 || dy !== 0, shouting });
      if (nextAnim !== anim) {
        anim = nextAnim;
        player.play(anim);
      }

      const touched = touchedOffice({ x: player.pos.x, y: player.pos.y }, officePos);
      const blocked = isMovementBlocked(dialog);
      const visit = visitToStart(touched, lastTouched, blocked);
      if (!blocked) {
        lastTouched = touched;
      }
      if (visit) {
        startVisit(visit);
      }

      const showBubble = isShouting(shout) ? 1 : 0;
      bubble.opacity = showBubble;
      bubble.outline.width = showBubble * 0.5;
      bubbleText.opacity = showBubble;
      bubble.scale = k.vec2(1 / zoom);
      bubble.pos = player.pos.sub(0, 27);

      k.camScale(RENDER_SCALE * zoom);
      const view = { w: GAME_WIDTH / zoom, h: GAME_HEIGHT / zoom };
      const cam = clampCamera({ x: player.pos.x, y: player.pos.y - BODY_CENTER }, view, bounds);
      k.camPos(cam.x, cam.y);
    });

    refreshDialog();
  });
}
```

The bubble keeps a constant size on screen (`bubble.scale = 1 / zoom`); the princess sprite itself scales with the map.

- [ ] **Step 7: Type-check, unit tests, smoke, build**

Run: `npx tsc --noEmit`
Expected: no errors. If a Kaplay type differs (e.g. `onKeyPress` key union, `drawLines` color), adapt the call to the type in `node_modules/kaplay/dist/doc.d.ts` and record a ruling.

Run: `npm test`
Expected: PASS.

Run: `npm run test:e2e`
Expected: PASS (canvas visible, no pageerror).

Run: `npm run build`
Expected: built.

- [ ] **Step 8: Manual browser check**

Run: `npm run dev`, open the app, Enter → advance wake. Check:
- The map shows Serbia (incl. Kosovo) as one cartoon shape with a thick outline, rivers, neighbours with names.
- She starts south of Beograd; mouse wheel and `+`/`-` zoom from all of Serbia to close; camera stays on the map.
- Walking into the border stops her; walking diagonally into it slides along.
- Walking into an office: shout pose + "Budite se, na posao!", then "<office name>: <reply>"; HUD `Score 50/1060  Offices 1/60` after the Vrhovno office; a check mark appears.
- Standing on the office after the dialog closes does not re-open it.
- Names with č ć š ž đ render (Niš, Šabac, Požarevac, Čačak, Kruševac).

- [ ] **Step 9: Commit**

```bash
git add -A src
git commit -m "feat: walk the Serbia map and wake every prosecutor's office"
```

---

### Task 6: Docs for the new rules

**Files:**
- Modify: `docs/game-design.md`, `docs/testing.md`

**Interfaces:**
- Consumes: the decisions in the spec
- Produces: docs that match the shipped behaviour

- [ ] **Step 1: Rewrite `docs/game-design.md`**

Replace the `## v1 loop`, `## Rules` and `## Content` sections with:

```markdown
## v1 loop
1. Title → start
2. Wake dialog (the prosecutors are asleep; visit every office)
3. Serbia map: walk, touch an office, shout + reply, points once
4. HUD: score / max and offices visited / total
5. When every office is visited → ending scene

## Rules
- One map: a cartoon vector map of Serbia **including Kosovo**, drawn from
  Natural Earth borders. Kosovo is walkable; no offices there.
- She starts in Beograd and can only walk on Serbian land; walking into the
  border slides along it.
- Stops are the 60 public prosecutor's offices in `assets/tuzilastva.csv`,
  each its own marker around its city.
- Each visit opens with the shout ("Budite se, na posao!", hands in the air),
  then the office's reply. Dialog is linear.
- An office can be visited again, but points are granted only the first time.
- Movement is blocked while a dialog box is open or while shouting.
- Advance dialog with Space / Enter / click. Walk with WASD or arrow keys.
- Shout any time with E (cosmetic, ~1.2 s, no points).
- Zoom with the mouse wheel or +/-, from all of Serbia to a close view.

## Content
| Level | Office | Points | Count |
|---|---|---|---|
| OJT | osnovno | 10 | 27 |
| VJT | više | 20 | 25 |
| AJT | apelaciono | 30 | 4 |
| PJT | posebno | 40 | 3 |
| VRHOVNO | Vrhovno javno tužilaštvo | 50 | 1 |

Max score 1060. Replies per level live in `src/data/replies.ts`.
```

In `## Out of scope for v1`, replace "multiple maps" with "indoor office scenes, fast travel, a minimap".

- [ ] **Step 2: Update `docs/testing.md`**

Replace the `**Score:**` and `**Lords:**` bullets with:

```markdown
- **Score:** first visit grants the office's level points (10/20/30/40/50);
  a second visit grants 0; unknown ids grant 0.
- **Offices:** 60 entries, unique ids, level counts 27/25/4/3/1, max 1060,
  every city has coordinates.
- **Geo:** projection keeps north up; known cities inside/outside the
  Serbia+Kosovo outline; every office city inside; blocked diagonals slide.
- **Layout:** offices of one city do not overlap; every office on land;
  a visit starts only when stepping onto a new office with no dialog open.
- **Zoom:** clamped to its limits; camera never shows past the map, centers
  when the map is smaller than the view.
```

Replace the score example's ids with office ids (`"ojt-u-novom-sadu"` → 10, `"vjt-u-novom-sadu"` → 20, total 30).

- [ ] **Step 3: Verify and commit**

Run: `npm test`
Expected: PASS.

```bash
git add docs/game-design.md docs/testing.md
git commit -m "docs: game design and testing rules for the Serbia map"
```
