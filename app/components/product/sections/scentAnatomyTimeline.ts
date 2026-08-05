/**
 * Shared scroll timeline for the scent-anatomy sticky stage.
 *
 * Section height is SECTION_VH + EXIT_VH:
 *  - scrub (0 → SCRUB_END): rotate / explode / annotations while sticky
 *  - exit  (SCRUB_END → end): ease-in-out lift + fade to inkwell (still sticky)
 * After exit, VHS begins on solid inkwell — no gradient scroll handoff.
 *
 * Scrub progress uses offset start end → SCRUB_END start (PIN / explode).
 * Leave progress uses SCRUB_END end → SCRUB_END start (transform exit).
 */
export const SECTION_VH = 170;

/** Extra sticky runway for the transform exit (≈ one viewport of travel). */
export const EXIT_VH = 100;

export const TOTAL_VH = SECTION_VH + EXIT_VH;

/** Fraction of the section where scrub ends / exit begins. */
export const SCRUB_END = SECTION_VH / TOTAL_VH;

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

/**
 * Cue / cube leave lead relative to SCRUB_END (vh of section height).
 *   0  = lift when scrub ends
 *  >0  = start lifting this many vh of scroll earlier
 *  <0  = start lifting this many vh later
 */
export const CUE_LEAVE_EARLY_VH = 0;

/**
 * Exit ease-in-out strength (cube / cue lift + late inkwell fade).
 * 1 = linear; higher = softer ease at both ends (≈2–2.5 feels natural).
 */
export const EXIT_EASE_POWER = 2.25;

/**
 * Leave-progress (0–1) before the vellum→inkwell fade begins.
 * Cube lifts on vellum until this point; fade runs from here to 1.
 */
export const EXIT_FADE_START = 0.62;

export const PIN = ENTER_VH / (ENTER_VH + SECTION_VH);

/** @deprecated Prefer SCRUB_END — kept for any remaining references */
export const STICKY_RELEASE = SECTION_VH / (SECTION_VH + VIEWPORT_VH);

export const DEG_150 = (150 * Math.PI) / 180;

/** Section mark (0–1) where leave progress starts. */
export function leaveMark(earlyVh = CUE_LEAVE_EARLY_VH) {
  return SCRUB_END - earlyVh / TOTAL_VH;
}

/** Ease-in-out 0–1 for exit travel (slow start + soft landing into VHS). */
export function easeExit(t: number, power = EXIT_EASE_POWER) {
  const x = Math.min(1, Math.max(0, t));
  if (x < 0.5) return 2 ** (power - 1) * x ** power;
  return 1 - (-2 * x + 2) ** power / 2;
}
