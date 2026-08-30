import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type Variants,
} from "motion/react";

/**
 * The page's ending.
 *
 * People judge an experience by its peak and its end. This page's peak is the
 * guided tour; its end was a bare heading and a button that did nothing until
 * clicked. The heading now resolves with the same word-stagger as the statement
 * section, and the button answers the pointer before it is pressed — it leans
 * toward the cursor and carries a highlight that tracks it, then springs back.
 *
 * The lean is a spring on two MotionValues, so it never re-renders, and the
 * button's rect is measured on enter rather than on every move.
 */

const ACCENT = "#774CFF";
const EASE = [0.22, 1, 0.36, 1] as const;
/** How far the button is allowed to follow the cursor, as a fraction of offset. */
const PULL = 0.22;
const MAX_PULL = 10;

const HEADING = "Start building your second brain today".split(" ");

const clamp = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value));

export function ClosingCTA() {
  const reduce = useReducedMotion() ?? false;

  const line: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : 0.04 } },
  };

  const word: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 10, filter: "blur(4px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: reduce ? 0 : 0.5, ease: EASE },
    },
  };

  return (
    <section id="cta" className="relative scroll-mt-24 overflow-hidden bg-white px-4 pt-8 pb-28 sm:px-6">
      {/* The ground, carried over from the tour's field. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 100%, rgba(119,76,255,0.14) 0%, rgba(119,76,255,0.04) 45%, transparent 72%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.h2
          className="font-hero mx-auto max-w-[18ch] text-[30px] leading-[1.12] font-bold tracking-tight text-balance text-gray-900 sm:text-[40px]"
          variants={line}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          {HEADING.map((text, index) => (
            <motion.span
              key={`${text}-${index}`}
              className="me-[0.25em] inline-block"
              variants={word}
            >
              {text}
            </motion.span>
          ))}
        </motion.h2>

        <motion.p
          className="mt-5 text-gray-500"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
        >
          Free to start. No credit card required.
        </motion.p>

        <div className="mt-9 flex justify-center">
          <MagneticCTA reduce={reduce} />
        </div>
      </div>
    </section>
  );
}

function MagneticCTA({ reduce }: { reduce: boolean }) {
  const rect = useRef<DOMRect | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 260, damping: 20, mass: 0.4 };
  const springX = useSpring(x, spring);
  const springY = useSpring(y, spring);

  const onEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    rect.current = event.currentTarget.getBoundingClientRect();
  };

  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const box = rect.current;
    if (!box) return;
    x.set(clamp((event.clientX - (box.left + box.width / 2)) * PULL, MAX_PULL));
    y.set(clamp((event.clientY - (box.top + box.height / 2)) * PULL, MAX_PULL));
    event.currentTarget.style.setProperty(
      "--pointer-x",
      `${event.clientX - box.left}px`,
    );
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onPointerEnter={reduce ? undefined : onEnter}
      onPointerMove={reduce ? undefined : onMove}
      onPointerLeave={reduce ? undefined : onLeave}
      style={reduce ? undefined : { x: springX, y: springY }}
      className="group relative inline-flex"
    >
      <Link
        to="/sign-up"
        className="relative inline-flex min-h-[52px] items-center justify-center overflow-hidden rounded-xl px-9 text-sm font-semibold text-white shadow-[0_2px_6px_rgba(16,12,40,0.12),0_18px_36px_-18px_rgba(119,76,255,0.7)] transition-shadow duration-300 group-hover:shadow-[0_2px_8px_rgba(16,12,40,0.16),0_26px_50px_-20px_rgba(119,76,255,0.85)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#774CFF]"
        style={{ backgroundColor: ACCENT }}
      >
        {/* Highlight that rides along with the cursor. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(120px circle at var(--pointer-x, 50%) 50%, rgba(255,255,255,0.28), transparent 70%)",
          }}
        />
        <span className="relative">Start for free</span>
      </Link>
    </motion.div>
  );
}
