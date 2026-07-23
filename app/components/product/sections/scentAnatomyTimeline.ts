/**
 * Shared scroll timeline for the scent-anatomy sticky stage
 * (progress 0 → 1 with offset start end → end start).
 *
 *  0.00–PIN            solid cube rotating into view / centering
 *  PIN+…               split halves + bottle → notes, then hold while rotating
 *  STICKY_RELEASE–1    cube sticky panel scrolls up / leaves
 */
export const SECTION_VH = 360;
export const ENTER_VH = 100;
export const PIN = ENTER_VH / (ENTER_VH + SECTION_VH); // ~0.22
/** Section bottom hits viewport bottom — sticky cube starts moving up */
export const STICKY_RELEASE = SECTION_VH / (SECTION_VH + ENTER_VH); // ~0.78
export const DEG_150 = (150 * Math.PI) / 180;
