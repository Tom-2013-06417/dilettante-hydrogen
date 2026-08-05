/** Ease-out cubic — soft landing into the target. */
function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

let activeRaf = 0;

/**
 * Programmatic window scroll with controllable duration + ease-out.
 * Native `behavior: 'smooth'` is browser-fixed and usually too snappy.
 */
export function smoothScrollTo(
  target: HTMLElement,
  {duration = 1800, offset = 0}: {duration?: number; offset?: number} = {},
) {
  const startY = window.scrollY;
  const endY = target.getBoundingClientRect().top + window.scrollY + offset;
  const distance = endY - startY;
  if (Math.abs(distance) < 1) return;

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || duration <= 0) {
    window.scrollTo(0, endY);
    return;
  }

  cancelAnimationFrame(activeRaf);
  let startTime: number | null = null;

  // Hand control back the moment the user scrolls — competing with their
  // gesture reads as jitter.
  const stop = () => {
    cancelAnimationFrame(activeRaf);
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
  };
  window.addEventListener('wheel', stop, {passive: true, once: true});
  window.addEventListener('touchstart', stop, {passive: true, once: true});
  window.addEventListener('keydown', stop, {once: true});

  const step = (now: number) => {
    if (startTime == null) startTime = now;
    const t = Math.min(1, (now - startTime) / duration);
    window.scrollTo(0, startY + distance * easeOutCubic(t));
    if (t < 1) {
      activeRaf = requestAnimationFrame(step);
      return;
    }
    stop();
  };

  activeRaf = requestAnimationFrame(step);
}
