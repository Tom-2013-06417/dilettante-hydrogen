/**
 * Shared scroll timeline for the scent-anatomy sticky stage
 * (progress 0 → 1 with offset start end → end start).
 *
 *  0.00–PIN            textured halves (stacked) rotating into view / centering
 *  PIN+…               explode halves + bottle → notes, then hold while rotating
 *  STICKY_RELEASE–1    cube sticky panel scrolls up / leaves
 *
 * Cue exit is NOT driven by STICKY_RELEASE — ScentAnatomyPin uses a dedicated
 * useScroll offset (`end end` → `end start`) so it tracks sticky release
 * geometrically. Tune lead with CUE_LEAVE_EARLY_VH only.
 */
export const SECTION_VH = 170;

/**
 * Lower = explode / pin-phase earlier in the stage.
 * Only feeds PIN — does not affect sticky release or cue exit.
 */
export const ENTER_VH = 35;

/**
 * Real viewport share of the useScroll range. Keep ≈ 100 so STICKY_RELEASE
 * matches when the sticky cube panel actually starts moving up.
 */
export const VIEWPORT_VH = 100;

/**
 * Cue leave lead relative to sticky release (section bottom @ viewport bottom).
 *   0  = lift in sync with the cube / next-section transition
 *  >0  = start lifting this many vh of scroll earlier
 *  <0  = start lifting this many vh later
 */
export const CUE_LEAVE_EARLY_VH = 0;

export const PIN = ENTER_VH / (ENTER_VH + SECTION_VH);

/** Section bottom hits viewport bottom — sticky cube starts moving up */
export const STICKY_RELEASE = SECTION_VH / (SECTION_VH + VIEWPORT_VH);

export const DEG_150 = (150 * Math.PI) / 180;
