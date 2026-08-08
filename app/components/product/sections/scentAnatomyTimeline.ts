/**
 * Shared scroll timeline for the scent-anatomy sticky stage.
 *
 * The section is the last thing in the document: it scrubs rotate / explode /
 * annotations while pinned. There is no exit runway — the scenes panel is a
 * gesture-gated overlay (see scenesGate), so the page ends with the cube and
 * the scenes cue still on screen. Cube Y-spin is split across scrub + cue fill
 * so the turn continues while the "???" wash loads.
 */
export const SECTION_VH = 200;

export const TOTAL_VH = SECTION_VH;

/**
 * Fraction of the section where the scrub ends. The whole section is scrub
 * now; kept as a named constant because the useScroll offsets read better
 * with it and it leaves room to re-introduce a runway.
 */
export const SCRUB_END = 1;

/**
 * Lower = explode / pin-phase earlier in the scrub.
 * Only feeds PIN — does not affect sticky release or cue exit.
 */
export const ENTER_VH = 35;

/**
 * Real viewport share of the scrub useScroll range. Keep ≈ 100 so timing
 * math stays aligned with a full viewport of enter travel.
 */
export const VIEWPORT_VH = 100;

export const PIN = ENTER_VH / (ENTER_VH + SECTION_VH);

/** Full assembled turn once scrub + scenes-cue fill have both completed. */
export const DEG_150 = (150 * Math.PI) / 180;

/**
 * Extra Y-spin driven by scenesGate `fill` (bottom overscroll). Keeps the
 * cube turning for the whole "???" wash rather than parking at scrub end.
 * Kept modest — the scene lerps this portion so wheel ticks stay smooth.
 */
export const FILL_SPIN = (36 * Math.PI) / 180;

/** Scroll-scrub share of DEG_150; FILL_SPIN finishes the turn. */
export const SCRUB_SPIN = DEG_150 - FILL_SPIN;
