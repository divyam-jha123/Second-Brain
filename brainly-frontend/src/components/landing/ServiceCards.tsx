import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import {
  LuInbox,
  LuMail,
  LuPuzzle,
  LuSearch,
  LuShare2,
} from "react-icons/lu";
import {
  FaFileLines,
  FaLink,
  FaLinkedin,
  FaVideo,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

/**
 * The five tools, as five distinguishable things.
 *
 * Previously every card carried the same Brain Expo mark, which is the fastest
 * way to make five items unmemorable — five identical icons encode nothing. Each
 * card now has its own icon at one stroke weight, and a surface that answers the
 * pointer: a soft brand-tinted pool follows the cursor across the card.
 *
 * The pool is driven by two CSS custom properties written straight to the node,
 * so tracking the cursor costs no React render and stays on the compositor. The
 * card's rect is measured once on enter rather than on every move, so the effect
 * never forces a layout during a pointer stream.
 */

const ACCENT = "#2563EB";
const ACCENT_SOFT = "#EFF6FF";
const EASE = [0.22, 1, 0.36, 1] as const;

interface Service {
  title: string;
  text: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  /** The lead card runs full width and carries the source row. */
  wide?: boolean;
}

const SERVICES: Service[] = [
  {
    title: "Capture Anything",
    text: "Links, tweets, YouTube videos, PDFs and notes — one shortcut saves it all to your second brain, from anywhere on the web.",
    Icon: LuInbox,
    wide: true,
  },
  {
    title: "Smart Tags & Search",
    text: "Every item is auto-tagged and full-text indexed, so the thing you saved six months ago is one search away.",
    Icon: LuSearch,
  },
  {
    title: "Browser Extension",
    text: "Clip pages without breaking flow. The Brain Expo extension drops what you're reading straight into your library.",
    Icon: LuPuzzle,
  },
  {
    title: "Share Collections",
    text: "Publish a curated set as a public link. Perfect for research handoffs, reading lists and team knowledge.",
    Icon: LuShare2,
  },
  {
    title: "Email Sync & Digest",
    text: "Forward newsletters and notes to your inbox address and get a weekly digest of what you've been collecting.",
    Icon: LuMail,
  },
];

/** The sources the lead card actually accepts, in their own brand colours. */
const SOURCES = [
  { name: "YouTube", Icon: FaYoutube, color: "#FF0000" },
  { name: "Twitter / X", Icon: FaXTwitter, color: "#000000" },
  { name: "LinkedIn", Icon: FaLinkedin, color: "#0A66C2" },
  { name: "Documents", Icon: FaFileLines, color: "#E8590C" },
  { name: "Links", Icon: FaLink, color: "#0EA5E9" },
  { name: "Video", Icon: FaVideo, color: "#7C3AED" },
];

export function ServiceCards() {
  const reduce = useReducedMotion() ?? false;

  const grid: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : 0.07 } },
  };

  const card: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 16, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: reduce ? 0 : 0.55, ease: EASE },
    },
  };

  return (
    <section className="border-y border-[#CBD5E1] bg-[#F8FAFC]">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-hero text-3xl font-bold tracking-tight text-balance text-[#0F172A] sm:text-4xl">
            Everything your second brain needs
          </h2>
          <p className="mt-4 text-[#475569]">
            Five tools that turn saving into remembering.
          </p>
        </div>

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={grid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {SERVICES.map((service) => (
            <ServiceCard key={service.title} service={service} variants={card} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ServiceCard({
  service,
  variants,
}: {
  service: Service;
  variants: Variants;
}) {
  const { Icon } = service;
  const rect = useRef<DOMRect | null>(null);

  // Measure once per hover, then only write custom properties while moving.
  const onEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    rect.current = event.currentTarget.getBoundingClientRect();
  };

  const onMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const box = rect.current;
    if (!box) return;
    const node = event.currentTarget;
    node.style.setProperty("--pointer-x", `${event.clientX - box.left}px`);
    node.style.setProperty("--pointer-y", `${event.clientY - box.top}px`);
  };

  return (
    <motion.div
      variants={variants}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      className={`group relative overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white p-7 transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-24px_rgba(37,99,235,0.28)] ${
        service.wide ? "lg:col-span-2" : ""
      }`}
    >
      {/* The pool that follows the cursor. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(340px circle at var(--pointer-x, 50%) var(--pointer-y, 50%), rgba(37,99,235,0.11), transparent 68%)",
        }}
      />

      <div className="relative">
        <div
          className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-translate-y-0.5"
          style={{ backgroundColor: ACCENT_SOFT, color: ACCENT }}
        >
          <Icon size={20} strokeWidth={1.9} />
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-[#0F172A]">{service.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#475569]">{service.text}</p>

        {service.wide && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {SOURCES.map((source) => (
              <li
                key={source.name}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white transition-transform duration-300 group-hover:-translate-y-0.5"
                style={{ color: source.color }}
                title={source.name}
              >
                <source.Icon className="h-4 w-4" />
                <span className="sr-only">{source.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
