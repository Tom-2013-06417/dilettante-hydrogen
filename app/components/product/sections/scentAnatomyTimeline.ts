/**
 * Shared scroll timeline for the scent-anatomy sticky stage.
 *
 * The section is the last thing in the document: it scrubs rotate / explode /
 * annotations while pinned, and simply stops. There is no exit runway any more
 * — the scenes panel is a gesture-gated overlay (see scenesGate), not a block
 * below, so the page ends with the cube and the scenes cue still on screen.
 */
export const SECTION_VH = 170;

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

export const DEG_150 = (150 * Math.PI) / 180;
