import { useId } from "react";
import type { CSSProperties } from "react";

/**
 * The Brain Expo loading mark.
 *
 * The brain is drawn as one outline plus five sulci, and a signal travels those
 * same strokes while the app loads — the mark is legible from the first painted
 * frame rather than assembling itself, which matters because this is often the
 * very first thing a visitor sees.
 *
 * Deliberately free of `motion/react`: this renders before the app does, and
 * the animation is six `stroke-dashoffset` walks that CSS drives on the
 * compositor for nothing. Keyframes live in index.css alongside the rest of the
 * app's motion.
 */

type BrainLoaderProps = {
  size?: number | string;
  className?: string;
  /**
   * The colour behind the mark. Junction rings are filled with it so the folds
   * that terminate inside them stay hidden, which means an unthemed surface —
   * the white card on the unsubscribe page — has to say so.
   */
  ground?: string;
};

/** The signal enters at the frontal lobe and works back to the stem; these are
 *  phase offsets into the shared 2.2s cycle, in that order. */
type Stroke = { d: string; delay: string; outline?: boolean };

const strokes: Stroke[] = [
  {
    outline: true,
    delay: "0s",
    d: "M44 131 C28 124 18 110 20 92 C22 74 28 58 42 48 C48 36 64 30 78 38 C88 28 108 24 120 36 C132 26 152 32 160 48 C174 54 180 70 174 84 C180 94 178 110 166 120 C158 126 152 132 148 140 C152 156 144 170 132 170 C121 170 115 161 118 151 C120 143 120 137 118 131 C104 137 84 141 66 137 C54 135 46 136 44 131 Z",
  },
  { d: "M20 88 C34 82 46 92 60 88 C70 85 75 83 78 80", delay: "-0.15s" },
  { d: "M42 48 C60 52 74 64 78 80 C82 94 70 104 60 116", delay: "-0.5s" },
  { d: "M60 116 C82 108 104 110 116 118 C126 128 134 142 132 156", delay: "-0.85s" },
  { d: "M120 36 C114 56 122 70 138 82 C148 90 150 104 148 116", delay: "-1.25s" },
  { d: "M138 82 C152 76 164 76 172 86", delay: "-1.6s" },
];

/** Junctions, in the order the signal reaches them. */
const nodes = [
  { cx: 20, cy: 88, delay: "-0.2s" },
  { cx: 42, cy: 48, delay: "-0.45s" },
  { cx: 78, cy: 80, delay: "-0.7s" },
  { cx: 120, cy: 36, delay: "-0.95s" },
  { cx: 60, cy: 116, delay: "-1.2s" },
  { cx: 138, cy: 82, delay: "-1.45s" },
  { cx: 172, cy: 86, delay: "-1.7s" },
  { cx: 132, cy: 156, delay: "-1.95s" },
];

export const BrainLoader = ({
  size = 128,
  className = "",
  ground,
}: BrainLoaderProps) => {
  const gradientId = `brain-loader-${useId().replace(/:/g, "")}`;
  const dimension = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      className={`inline-flex ${className}`}
      style={ground ? ({ "--loader-ground": ground } as CSSProperties) : undefined}
    >
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 200 180"
        role="img"
        aria-label="Loading"
        className="block"
      >
        <defs>
          {/* Lit from the top, the way the mark is drawn everywhere else. */}
          <linearGradient id={gradientId} x1="0.15" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="var(--loader-top)" />
            <stop offset="100%" stopColor="var(--loader-bottom)" />
          </linearGradient>
        </defs>

        <g
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* The mark at rest — always present, so there is never a blank frame. */}
          <g className="brain-rest">
            {strokes.map((stroke) => (
              <path key={stroke.d} d={stroke.d} />
            ))}
          </g>

          {/* The signal, walking the same geometry. */}
          {strokes.map((stroke) => (
            <path
              key={`${stroke.d}-signal`}
              d={stroke.d}
              pathLength={1}
              className={`brain-signal${stroke.outline ? " brain-signal-outline" : ""}`}
              style={{ animationDelay: stroke.delay }}
            />
          ))}

          {nodes.map((node) => (
            <circle
              key={`${node.cx}-${node.cy}`}
              cx={node.cx}
              cy={node.cy}
              r="4.4"
              className="brain-node"
              style={{ animationDelay: node.delay }}
            />
          ))}
        </g>

        {/* The one fold that ends in open tissue rather than a junction. */}
        <circle
          cx="148"
          cy="116"
          r="2.8"
          className="brain-dot"
          style={{ animationDelay: "-1.35s" }}
        />
      </svg>

    </div>
  );
};

export const Loader = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <BrainLoader size="clamp(112px, 24vw, 144px)" />
    </div>
  );
};
