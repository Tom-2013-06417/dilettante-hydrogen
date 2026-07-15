# Product page animation plan

## Section 1 — Hero (`ProductHero`)
- Full viewport (`100dvh`), product image as textured background
- Content inset via `PageContainer` (32px horizontal padding)
- `HeaderBar`, scent number + title, subtitle, price, add-to-cart

## Section 2 — Scent anatomy (`ScentNotesExplorer`)
- Square image with `PageContainer` padding
- 3×3 dashed white grid overlay
- Tap: `grid` → `rows` (top / heart / base) → `exploded` with annotation lines
- Scent data: `scent-data.placeholder.txt` + `scentProfile.ts` (random 3 notes per tier; wire to metafields later)

## Section 3 — Vessel (`BottleBoxReveal`)
- **Three.js** via **React Three Fiber** (`@react-three/fiber`)
- Scroll-linked ~60° Y rotation
- Client-only canvas (SSR-safe)

## Section 4 — Exposition
- Skipped for now

## Layout
- `.page-container` — 32px left/right padding for content; backgrounds stay full-bleed
