import { motion, useReducedMotion, type Variants } from "motion/react";

/**
 * The page's one statement beat: the argument for Brain Expo in a single
 * sentence, between the hero and the guided tour.
 *
 * The sentence resolves word by word as it comes into view. That is not
 * decoration: the phrase this product exists to defeat, "forgotten tabs", is the
 * one part that never resolves to full strength, and the payoff, "knowledge you
 * actually use", is the only part that arrives in brand colour. Reading order
 * and argument are the same gesture.
 *
 * The reveal is a parent-orchestrated stagger rather than a scroll-scrubbed one,
 * which is what the rest of this landing page already does (see
 * landingAnimations.ts) and the right call for a short section — a
 * scroll-scrubbed sentence reads as sticky when someone scrolls past quickly.
 */

const ACCENT = "#774CFF";
/** The ground, continued from the hero so the top of the page reads as one field. */
const GROUND = "#FAFAFB";
const EASE = [0.22, 1, 0.36, 1] as const;

type Tone = "base" | "muted" | "payoff";

/** The sentence, in segments. Word splitting and timing are derived from this. */
const SEGMENTS: { text: string; tone: Tone }[] = [
  { text: "Instead of living as", tone: "base" },
  { text: "forgotten tabs,", tone: "muted" },
  // Non-breaking space: the product name must never split across lines. Words
  // are split on ordinary spaces, so this stays one unit through the reveal too.
  { text: "Brain\u00A0Expo turns everything you save into", tone: "base" },
  { text: "knowledge you actually use.", tone: "payoff" },
];

/**
 * Resolved colours, all checked against GROUND at large-text sizes:
 * base 18.1:1, muted 4.6:1, payoff 4.7:1. "Muted" recedes by hue, never by
 * opacity — a half-transparent grey would have read as the same design and
 * failed the contrast floor.
 */
const TONE_COLOR: Record<Tone, string> = {
  base: "#12110F",
  muted: "#78716C",
  payoff: ACCENT,
};

const words = SEGMENTS.flatMap((segment) =>
  segment.text.split(" ").map((text) => ({ text, tone: segment.tone })),
);

export function ProductStatement() {
  const reduce = useReducedMotion() ?? false;

  const sentence: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduce ? 0 : 0.045, delayChildren: 0.05 },
    },
  };

  const word: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0.12, y: 8, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: reduce ? 0 : 0.5, ease: EASE },
    },
  };

  return (
    <section
      id="products"
      className="scroll-mt-24 px-4 py-28 sm:px-6 sm:py-36 lg:py-44"
      style={{ background: GROUND }}
    >
      <motion.h2
        className="font-hero mx-auto max-w-[19ch] text-center text-[32px] leading-[1.14] font-bold tracking-[-0.03em] text-balance sm:text-[44px] lg:text-[56px]"
        variants={sentence}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.45 }}
      >
        {words.map((entry, index) => (
          <motion.span
            key={`${entry.text}-${index}`}
            className="me-[0.26em] inline-block"
            style={{ color: TONE_COLOR[entry.tone] }}
            variants={word}
          >
            {entry.text}
          </motion.span>
        ))}
      </motion.h2>
    </section>
  );
}
