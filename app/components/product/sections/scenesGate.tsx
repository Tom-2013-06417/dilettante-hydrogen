import {useMotionValue, type MotionValue} from 'motion/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';

/**
 * Overscroll past the document bottom, in px, needed to fill the scenes cue.
 * Deliberately long, and deliberately asymmetric with the exit below:
 * committing to the scenes panel should cost more than turning around and
 * heading back up to the hero.
 */
const FILL_DISTANCE_PX = 700;

/** Scrolling up empties the cue this many times faster than filling it. */
const DRAIN_MULTIPLIER = 2.5;

/**
 * Upward travel while the panel is open that closes it. Far shorter than
 * FILL_DISTANCE_PX — leaving is the easy direction. Without this, only a
 * velocity-gated flick could dismiss, and gentle trackpad coasts were
 * swallowed forever (page frozen on the scenes panel).
 */
const CLOSE_DISTANCE_PX = 140;

/**
 * An upward flick snaps the cue empty (and closes the panel) once it covers
 * this much distance at this speed. Both thresholds matter: distance alone
 * would fire on a slow drag, speed alone on a single stray wheel tick.
 * The gradual CLOSE_DISTANCE_PX path above covers the slow case.
 */
const RESET_MIN_TRAVEL_PX = 32;
const RESET_VELOCITY_PX_PER_MS = 0.8;

/**
 * Hard cap on how long a dismissal may keep eating a gesture. Trackpad
 * momentum fires for well over a second with no gap between events, and
 * without this the page stays frozen for the whole coast.
 */
const SWALLOW_MAX_MS = 320;

/** Slack for "the document is scrolled to the bottom". */
const BOTTOM_EPSILON_PX = 6;

/** Idle gap that ends an upward gesture, so travel can't pool across flicks. */
const GESTURE_GAP_MS = 160;

/**
 * Zero-area `clip-path: inset(...)` pinned to the cue's centre, measured when
 * the panel opens. The overlay animates out of this and back into it, so it
 * bursts from the button and — unlike collapsing to the button's *rectangle* —
 * leaves nothing parked on top of it.
 */
export type CueOrigin = string;

type ScenesGate = {
  /** 0 → 1 wash across the cue button. */
  fill: MotionValue<number>;
  open: boolean;
  /** Where the overlay expands from; null until the cue has been measured. */
  origin: CueOrigin | null;
  cueRef: RefObject<HTMLButtonElement>;
  openScenes: () => void;
  closeScenes: () => void;
};

const ScenesGateContext = createContext<ScenesGate | null>(null);

export function useScenesGate(): ScenesGate {
  const gate = useContext(ScenesGateContext);
  if (!gate) {
    throw new Error('useScenesGate must be used within a ScenesGateProvider');
  }
  return gate;
}

/**
 * Turns overscroll at the bottom of the product page into a hold-to-open
 * gesture for the scenes panel.
 *
 * The page deliberately has nowhere left to scroll at that point, so the
 * gesture that would have rubber-banded is captured instead: downward travel
 * fills the cue, a quick flick back up empties it, and filling it all the way
 * — or just pressing the button — opens the panel.
 */
export function ScenesGateProvider({children}: {children: ReactNode}) {
  const fill = useMotionValue(0);
  const cueRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState<CueOrigin | null>(null);
  /** Mirrors `open` for the gesture listeners, which never re-subscribe. */
  const openRef = useRef(false);

  const openScenes = useCallback(() => {
    if (openRef.current) return;
    const rect = cueRef.current?.getBoundingClientRect();
    if (rect) {
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      setOrigin(
        `inset(${y}px ${window.innerWidth - x}px ${
          window.innerHeight - y
        }px ${x}px)`,
      );
    }
    openRef.current = true;
    fill.set(1);
    setOpen(true);
  }, [fill]);

  const closeScenes = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    fill.set(0);
    setOpen(false);
    cueRef.current?.focus({preventScroll: true});
  }, [fill]);

  useEffect(() => {
    let upTravel = 0;
    let upStartedAt = 0;
    let lastEventAt = 0;
    let touchY: number | null = null;
    /**
     * Set when a flick dismisses the panel. The rest of that flick has to be
     * eaten too, or the page carries on scrolling and drops the reader most of
     * a viewport above the cue they just came from.
     */
    let swallowRestOfGesture = false;
    let swallowStartedAt = 0;

    const atBottom = () =>
      document.documentElement.scrollHeight -
        window.scrollY -
        window.innerHeight <=
      BOTTOM_EPSILON_PX;

    /**
     * @param dy positive = scrolling down.
     * @returns true when the gesture was consumed and must not scroll the page.
     */
    const drive = (dy: number, now: number): boolean => {
      const continuing = now - lastEventAt <= GESTURE_GAP_MS;
      if (swallowRestOfGesture) {
        if (continuing && now - swallowStartedAt < SWALLOW_MAX_MS) {
          lastEventAt = now;
          return true;
        }
        swallowRestOfGesture = false;
      }
      lastEventAt = now;

      if (dy < 0) {
        if (!continuing) {
          upTravel = 0;
          upStartedAt = now;
        }
        upTravel += -dy;

        const speed = upTravel / Math.max(1, now - upStartedAt);
        if (
          upTravel >= RESET_MIN_TRAVEL_PX &&
          speed >= RESET_VELOCITY_PX_PER_MS
        ) {
          const wasOpen = openRef.current;
          closeScenes();
          fill.set(0);
          // Eat the flick that dismissed the panel, so the reader is left
          // looking at the cue. A flick that only emptied the cue is let
          // through — scrolling back up the page is what they asked for.
          swallowRestOfGesture = wasOpen;
          swallowStartedAt = now;
          return wasOpen;
        }

        // While open: drain toward close on any upward travel. A gentle
        // trackpad coast never hits the flick velocity above, but ~140px
        // of upward delta is enough to leave. Keep eating the gesture so
        // the page can't creep behind the panel.
        if (openRef.current) {
          const next = Math.max(0, fill.get() + dy / CLOSE_DISTANCE_PX);
          fill.set(next);
          if (next <= 0) {
            closeScenes();
            swallowRestOfGesture = true;
            swallowStartedAt = now;
          }
          return true;
        }

        fill.set(
          Math.max(0, fill.get() + (dy * DRAIN_MULTIPLIER) / FILL_DISTANCE_PX),
        );
        return false;
      }

      upTravel = 0;
      if (openRef.current) return true;
      if (!atBottom()) return false;

      const next = Math.min(1, fill.get() + dy / FILL_DISTANCE_PX);
      fill.set(next);
      if (next >= 1) openScenes();
      return true;
    };

    /**
     * The cart aside can be opened from the scenes panel itself. It scrolls on
     * its own, so gestures inside it are none of this gate's business.
     */
    const inModal = (target: EventTarget | null) =>
      target instanceof Node &&
      Boolean(
        (target instanceof Element ? target : target.parentElement)?.closest(
          '[role="dialog"]',
        ),
      );

    /**
     * Once the browser has committed to a scroll, its touchmoves stop being
     * cancelable and calling preventDefault only logs a warning.
     */
    const consume = (event: Event, consumed: boolean) => {
      if (consumed && event.cancelable) event.preventDefault();
    };

    const onWheel = (event: WheelEvent) => {
      if (inModal(event.target)) return;
      consume(event, drive(event.deltaY, event.timeStamp));
    };

    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
      swallowRestOfGesture = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (y == null || touchY == null) return;
      // Finger travelling up = scrolling down.
      const dy = touchY - y;
      touchY = y;
      if (inModal(event.target)) return;
      consume(event, drive(dy, event.timeStamp));
    };

    const onTouchEnd = () => {
      touchY = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openRef.current) closeScenes();
    };

    // Any other route away from the bottom (keyboard, scrollbar, anchor)
    // empties the cue — nothing is being held any more.
    const onScroll = () => {
      if (!openRef.current && !atBottom() && fill.get() > 0) fill.set(0);
    };

    window.addEventListener('wheel', onWheel, {passive: false});
    window.addEventListener('touchstart', onTouchStart, {passive: true});
    window.addEventListener('touchmove', onTouchMove, {passive: false});
    window.addEventListener('touchend', onTouchEnd, {passive: true});
    window.addEventListener('touchcancel', onTouchEnd, {passive: true});
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, {passive: true});

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
    };
  }, [closeScenes, fill, openScenes]);

  const value = useMemo(
    () => ({fill, open, origin, cueRef, openScenes, closeScenes}),
    [closeScenes, fill, open, openScenes, origin],
  );

  return (
    <ScenesGateContext.Provider value={value}>
      {children}
    </ScenesGateContext.Provider>
  );
}
