import { useEffect, useState } from "react";
import { useReducedMotion, type Variants } from "motion/react";

/**
 * Centralized entrance-animation system for the Brain Expo landing page.
 *
 * One master timeline (delays are absolute, in seconds, from page load) drives a
 * "blur -> focus + directional travel + stagger" reveal. The badge, description
 * and CTA slide in from the right (right -> left); the hero visual and cards rise
 * vertically; the headline reveals line-by-line (see <HeroHeading> in
 * BrainExpoLanding — its per-line timing is owned there, not here).
 * Everything else is tuned from this file. Respects prefers-reduced-motion and
 * reduces travel/blur on mobile.
 *
 * Master timeline:
 *   0.05  navbar
 *   0.20  badge
 *   0.25  headline line 1   (per-line reveal in <HeroHeading>)
 *   0.40  headline line 2
 *   0.70  description        (only after the headline has established itself)
 *   0.85  CTA
 *   0.70  main hero visual
 *   0.82+ secondary visual elements (staggered)
 *   0.88+ hero cards (staggered)
 */

// Premium ease-out (matches Framer's default expressive curve).
const EASE = [0.22, 1, 0.36, 1] as const;

export interface LandingVariants {
  root: Variants;
  navbar: Variants;
  badge: Variants;
  description: Variants;
  cta: Variants;
  visual: Variants;
  cardsContainer: Variants;
  card: Variants;
  /** Per-element factory for the small decorative nodes/orb (delay is absolute). */
  secondary: (delay: number) => Variants;
}

interface BuildOpts {
  reduce: boolean;
  mobile: boolean;
}

export function buildLandingVariants({ reduce, mobile }: BuildOpts): LandingVariants {
  // Dampen travel + blur on mobile; zero them out for reduced motion.
  const travel = (d: number) => (reduce ? 0 : mobile ? Math.round(d * 0.6) : d);
  const blur = (b: number) => (reduce ? 0 : mobile ? Math.max(0, b - 2) : b);
  const transition = (duration: number, delay: number) => ({
    duration: reduce ? 0.01 : duration,
    delay: reduce ? 0 : delay,
    ease: EASE,
  });

  /**
   * blur + fade + directional travel (and optional subtle scale).
   * Pass `x` for a horizontal slide (positive = start right, move left) or
   * `y` for a vertical rise; both are damped on mobile / zeroed for reduced motion.
   */
  const fadeBlur = (
    init: { x?: number; y?: number; blur?: number; scale?: number },
    duration: number,
    delay: number,
  ): Variants => {
    const useScale = init.scale !== undefined;
    return {
      hidden: {
        opacity: 0,
        x: travel(init.x ?? 0),
        y: travel(init.y ?? 0),
        ...(useScale ? { scale: reduce ? 1 : (init.scale as number) } : {}),
        filter: `blur(${blur(init.blur ?? 0)}px)`,
      },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        ...(useScale ? { scale: 1 } : {}),
        filter: "blur(0px)",
        transition: transition(duration, delay),
      },
    };
  };

  return {
    // Root only establishes the hidden/visible context; it has no visuals of its own.
    root: {
      hidden: {},
      visible: {},
    },

    navbar: {
      hidden: { opacity: 0, y: reduce ? 0 : -10, filter: `blur(${blur(6)}px)` },
      visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: transition(0.6, 0.05),
      },
    },

    // Badge, description and CTA slide in from the right (right -> left).
    // The headline is revealed line-by-line by <HeroHeading> (delays 0.25 / 0.40),
    // so description/CTA wait until it has substantially established itself.
    badge: fadeBlur({ x: 40, blur: 8 }, 0.55, 0.2),
    description: fadeBlur({ x: 40, blur: 8 }, 0.65, 0.7),
    cta: fadeBlur({ x: 34, blur: 6, scale: 0.98 }, 0.55, 0.85),
    // Hero visual keeps its vertical rise.
    visual: fadeBlur({ y: 30, blur: 10, scale: 0.97 }, 1.0, 0.7),

    // Hero cards: parent orchestrates a small uniform stagger.
    cardsContainer: {
      hidden: {},
      visible: {
        transition: {
          delayChildren: reduce ? 0 : 0.88,
          staggerChildren: reduce ? 0 : 0.08,
        },
      },
    },
    card: fadeBlur({ y: 12, blur: 6 }, 0.55, 0),

    secondary: (delay: number) => fadeBlur({ y: 10, blur: 5 }, 0.6, delay),
  };
}

/** SSR-safe media-query hook (this app is client-only, so window is available). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** Computes the full variant set for the current viewport + motion preference. */
export function useLandingVariants(): LandingVariants {
  const reduce = useReducedMotion() ?? false;
  const mobile = useMediaQuery("(max-width: 640px)");
  return buildLandingVariants({ reduce, mobile });
}
