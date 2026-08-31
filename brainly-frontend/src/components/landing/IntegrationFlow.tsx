import { motion, useReducedMotion } from "motion/react";
import {
  FaFileLines,
  FaLink,
  FaLinkedin,
  FaVideo,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { BrainExpoLogo } from "../../assets/brand/BrainExpoLogo";

/**
 * Integrations, drawn as one flow instead of two ticker rows.
 *
 * The previous version scrolled two marquees past a fixed SVG thread network,
 * so the threads pointed at whichever logo happened to be sliding by — the one
 * thing the picture is meant to say (this app connects to that hub) was the one
 * thing it couldn't say. Here the geometry is honest: every card sits at a fixed
 * position, and every thread starts at that card's centre and ends on the hub.
 *
 * Cards are positioned as a % of the stage and the SVG is stretched over the
 * same box (`preserveAspectRatio="none"`), so a card at column x lines up with
 * its thread's endpoint at every viewport size — the stage can be short and wide
 * on mobile or tall and wide on desktop and the anchors still meet.
 *
 * Flow direction: sources at the bottom are pulled up into the hub, and the hub
 * pushes back out to the apps along the top. Travelling dashes carry that
 * direction; under prefers-reduced-motion the threads simply appear, static.
 */

const ACCENT = "#2563EB";
const EASE = [0.22, 1, 0.36, 1] as const;

const VIEW = { w: 1200, h: 520 } as const;
/** Column centres, evenly spread across the stage. */
const COLS = [100, 300, 500, 700, 900, 1100] as const;
const TOP_Y = 62;
const BOTTOM_Y = 458;
/** Hub box edges the threads terminate on. */
const HUB_TOP = 214;
const HUB_BOTTOM = 306;
/** Fan the endpoints across the hub edge so they don't pile into one pixel. */
const hubAttach = (i: number) => 540 + i * 24;

const pct = (n: number, total: number) => `${(n / total) * 100}%`;

type Source = {
  name: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  /** Brand colour, used for the light "pulling" row and the hover glow. */
  color: string;
};

const SOURCES: Source[] = [
  { name: "YouTube", Icon: FaYoutube, color: "#FF0000" },
  { name: "LinkedIn", Icon: FaLinkedin, color: "#0A66C2" },
  { name: "Documents", Icon: FaFileLines, color: "#E8590C" },
  { name: "Twitter / X", Icon: FaXTwitter, color: "#0F172A" },
  { name: "Links", Icon: FaLink, color: "#0EA5E9" },
  { name: "Video", Icon: FaVideo, color: "#7C3AED" },
];

/**
 * Top row -> hub. Paths are written in flow order (the travelling dash runs from
 * the path's start to its end), so the pushing side is where a pulse begins.
 */
const TOP_PATHS = COLS.map((x, i) => ({
  d: `M ${x} ${TOP_Y} C ${x} ${TOP_Y + 88}, ${hubAttach(i)} ${HUB_TOP - 46}, ${hubAttach(i)} ${HUB_TOP}`,
  delay: 0.15 + i * 0.06,
}));

/** hub -> bottom row: the second half of the same journey. */
const BOTTOM_PATHS = COLS.map((x, i) => ({
  d: `M ${hubAttach(i)} ${HUB_BOTTOM} C ${hubAttach(i)} ${HUB_BOTTOM + 46}, ${x} ${BOTTOM_Y - 88}, ${x} ${BOTTOM_Y}`,
  delay: 0.55 + i * 0.06,
}));

/** One pulse cycle: leg 0 (top -> hub) hands off to leg 1 (hub -> bottom). */
const PULSE_DURATION = 3.2;
const PULSE_GAP = 1.4;

export function IntegrationFlow() {
  const reduce = useReducedMotion() ?? false;

  return (
    <section id="integrations" className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#2563EB]">
          Integrations
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
          Everything flows through one brain
        </h2>
        <p className="mt-4 text-[#475569]">
          Pull your reading in from anywhere, and push what you save back out to
          the apps where you already work.
        </p>
      </div>

      <div
        className="relative mx-auto w-full"
        style={{ height: "clamp(320px, 44vw, 520px)" }}
      >
        <Threads reduce={reduce} />

        {/* Pushing row — dark cards along the top. */}
        <RowLabel className="top-0 -translate-y-full pb-3">Pushing to your apps</RowLabel>
        {SOURCES.map((s, i) => (
          <Node key={`push-${s.name}`} source={s} variant="dark" x={COLS[i]} y={TOP_Y} delay={0.15 + i * 0.06} />
        ))}

        <Hub reduce={reduce} />

        {/* Pulling row — light cards along the bottom. */}
        {SOURCES.map((s, i) => (
          <Node key={`pull-${s.name}`} source={s} variant="light" x={COLS[i]} y={BOTTOM_Y} delay={0.75 + i * 0.06} />
        ))}
        <RowLabel className="bottom-0 translate-y-full pt-3">Pulling from your sources</RowLabel>
      </div>
    </section>
  );
}

function RowLabel({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <p
      className={`absolute inset-x-0 z-[3] text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748B] ${className}`}
    >
      {children}
    </p>
  );
}

/**
 * One integration tile, centred on its (x, y) anchor in stage coordinates so the
 * thread endpoint lands under the card rather than beside it.
 */
function Node({
  source,
  variant,
  x,
  y,
  delay,
}: {
  source: Source;
  variant: "dark" | "light";
  x: number;
  y: number;
  delay: number;
}) {
  const dark = variant === "dark";
  const { Icon, name, color } = source;

  return (
    <motion.div
      className="absolute z-[2] -translate-x-1/2 -translate-y-1/2"
      style={{ left: pct(x, VIEW.w), top: pct(y, VIEW.h) }}
      initial={{ opacity: 0, y: dark ? 14 : -14, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      <div
        title={name}
        aria-label={name}
        role="img"
        className="group grid place-items-center transition-transform duration-300 hover:-translate-y-1"
        style={{
          width: "clamp(44px, 6.4vw, 84px)",
          height: "clamp(44px, 6.4vw, 84px)",
          borderRadius: "clamp(12px, 1.6vw, 22px)",
          border: dark ? "1px solid rgba(248,250,252,0.14)" : "1px solid #E2E8F0",
          background: dark
            ? "linear-gradient(180deg, #1E293B 0%, #0F172A 100%)"
            : "#FFFFFF",
          boxShadow: dark
            ? "0 18px 34px -14px rgba(15,23,42,0.55)"
            : "0 18px 34px -18px rgba(15,23,42,0.28)",
        }}
      >
        <Icon
          className="transition-transform duration-300 group-hover:scale-110"
          style={{
            width: "clamp(18px, 2.6vw, 34px)",
            height: "clamp(18px, 2.6vw, 34px)",
            color: dark ? "#FFFFFF" : color,
          }}
        />
      </div>
    </motion.div>
  );
}

/** The centre node: where pulling ends and pushing begins. */
function Hub({ reduce }: { reduce: boolean }) {
  return (
    <div
      className="absolute z-[2] -translate-x-1/2 -translate-y-1/2"
      style={{ left: "50%", top: "50%" }}
    >
      {/* Soft halo, so the threads read as terminating in light rather than in an edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, rgba(37,99,235,0) 68%)" }}
      />
      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#93C5FD]"
          style={{ width: 150, height: 150 }}
          animate={{ scale: [1, 1.35], opacity: [0.35, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      <motion.div
        className="relative flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 sm:px-5 sm:py-4"
        style={{ boxShadow: "0 30px 60px -24px rgba(15,23,42,0.35)" }}
        initial={{ opacity: 0, scale: 0.88 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
      >
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white sm:h-11 sm:w-11"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)" }}
        >
          <BrainExpoLogo size="lg" />
        </span>
        <span className="text-left">
          <span className="block text-sm font-bold leading-tight text-[#0F172A]">Brain Expo</span>
          <span className="block text-[11px] font-medium leading-tight text-[#64748B]">
            One synced library
          </span>
        </span>
      </motion.div>
    </div>
  );
}

/**
 * The threads. Two passes over the same paths: a static hairline that draws
 * itself in on scroll, and — motion permitting — a travelling dash that repeats,
 * giving each thread a direction.
 */
function Threads({ reduce }: { reduce: boolean }) {
  const paths = [...TOP_PATHS, ...BOTTOM_PATHS];

  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id="ifThread" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.15" />
          <stop offset="50%" stopColor={ACCENT} stopOpacity="0.4" />
          <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.15" />
        </linearGradient>
        <filter id="ifGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={ACCENT} floodOpacity="0.35" />
        </filter>
      </defs>

      {paths.map((p) => (
        <motion.path
          key={p.d}
          d={p.d}
          fill="none"
          stroke="url(#ifThread)"
          strokeWidth="1.4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            pathLength: { duration: reduce ? 0.01 : 1.1, ease: EASE, delay: reduce ? 0 : p.delay },
            opacity: { duration: reduce ? 0.01 : 0.3, delay: reduce ? 0 : p.delay },
          }}
        />
      ))}

      {!reduce &&
        [...TOP_PATHS, ...BOTTOM_PATHS].map((p, i) => {
          const col = i % COLS.length;
          // The hub-side leg starts as its top-side partner arrives, so one dash
          // appears to travel push -> hub -> pull without a seam.
          const leg = i < COLS.length ? 0 : 1;
          return (
            <motion.path
              key={`flow-${p.d}`}
              d={p.d}
              fill="none"
              stroke={ACCENT}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="14 420"
              vectorEffect="non-scaling-stroke"
              filter="url(#ifGlow)"
              initial={{ strokeDashoffset: 434, opacity: 0 }}
              whileInView={{ strokeDashoffset: -434, opacity: [0, 0.9, 0.9, 0] }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: PULSE_DURATION,
                ease: "linear",
                repeat: Infinity,
                repeatDelay: PULSE_GAP,
                delay: 1.5 + col * 0.34 + leg * PULSE_DURATION,
              }}
            />
          );
        })}

    </svg>
  );
}
