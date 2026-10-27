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
