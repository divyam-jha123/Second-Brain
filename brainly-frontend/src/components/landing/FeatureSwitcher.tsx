import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * "Everything you save" — the one place on this page a visitor can actually
 * touch something.
 *
 * The chips are the real dashboard's own filter row, and picking one does what
 * the product does: the library stays put and the items that don't match recede.
 * Nothing here is invented UI — the cards are the items already visible in
 * `public/landing/brainexpo-dashboard.png`, in the product's own card language.
 *
 * It auto-advances until the first interaction and then stops for good. A
 * control that keeps moving after someone has taken hold of it is fighting them
 * for it.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
/** Long enough to read a card, short enough to notice it is alive. */
const CYCLE_MS = 2600;
const PRIMARY_GRADIENT = "linear-gradient(90deg, #2563EB 0%, #3B82F6 55%, #60A5FA 100%)";

type TypeId =
  | "articles"
  | "videos"
  | "podcasts"
  | "documents"
  | "tweets"
  | "notes"
  | "links";

/**
 * Type colours ride on the dot only, never on the label: several of these
 * (amber, emerald) cannot reach 4.5:1 against white as small text. Colour to
 * identify, near-black to read — which is what the digest email already does.
 */
const TYPES: { id: TypeId; label: string; dot: string }[] = [
  { id: "articles", label: "Articles", dot: "#0EA5E9" },
  { id: "videos", label: "Videos", dot: "#EF4444" },
  { id: "podcasts", label: "Podcasts", dot: "#7C3AED" },
  { id: "documents", label: "Documents", dot: "#F59E0B" },
  { id: "tweets", label: "Tweets", dot: "#18181B" },
  { id: "notes", label: "Notes", dot: "#10B981" },
  { id: "links", label: "Links", dot: "#6366F1" },
];

const TYPE_BY_ID = Object.fromEntries(TYPES.map((t) => [t.id, t])) as Record<
  TypeId,
  (typeof TYPES)[number]
>;

interface Item {
  type: TypeId;
  title: string;
  body: string;
  meta: string;
  tag?: string;
}

/** The items from the product's own dashboard, in its own card language. */
const ITEMS: Item[] = [
  {
    type: "articles",
    title: "Building a personal AI workflow that saves hours",
    body: "Practical guide to putting AI tools together so they actually make you more productive.",
    meta: "example.com · 2h ago",
    tag: "productivity",
  },
  {
    type: "videos",
    title: "Rust Crash Course for Beginners",
    body: "A friendly, hands-on intro to Rust programming.",
    meta: "YouTube · 1d ago",
    tag: "development",
  },
  {
    type: "podcasts",
    title: "How indie founders ship consistently",
    body: "Great insights on focus, shipping, and sustainable growth.",
    meta: "Indie Hackers Journal · 2d ago",
    tag: "growth",
  },
  {
    type: "documents",
    title: "Design systems that scale",
    body: "A practical guide for building and evolving design systems in large teams.",
    meta: "design-systems.io · 3d ago",
    tag: "design",
  },
  {
    type: "tweets",
    title: "@alexchen_dev",
    body: "The best products solve a real problem so well that the solution feels obvious in hindsight.",
    meta: "May 12, 2024",
  },
  {
    type: "notes",
    title: "Startup idea notes",
    body: "AI copilot for product managers · Pain points & user research · MVP scope",
    meta: "Note · 5d ago",
    tag: "ideas",
  },
  {
    type: "links",
    title: "Cube — Next-gen analytics",
    body: "Real-time product analytics built for speed and clarity.",
    meta: "cube.dev · 6d ago",
    tag: "product",
  },
  {
    type: "articles",
    title: "The future of clean energy innovation",
    body: "Exploring emerging technologies shaping a sustainable tomorrow.",
    meta: "cleanenergy.org · 1w ago",
    tag: "research",
  },
];

export function FeatureSwitcher() {
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState<TypeId>("articles");
  /** Once someone picks a type, the carousel is theirs, not ours. */
  const [taken, setTaken] = useState(false);
  const inView = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (taken || reduce) return;
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting;
      },
      { threshold: 0.35 },
    );
    observer.observe(section);

    // Only advance while the section is actually on screen — a timer ticking
    // through a section nobody is looking at just burns battery.
    const timer = window.setInterval(() => {
      if (!inView.current) return;
      setActive((current) => {
        const index = TYPES.findIndex((type) => type.id === current);
        return TYPES[(index + 1) % TYPES.length].id;
      });
    }, CYCLE_MS);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [taken, reduce]);

  const pick = (id: TypeId) => {
    setTaken(true);
    setActive(id);
  };

  return (
    <section
      id="features"
      ref={sectionRef}
      className="scroll-mt-24 bg-white px-4 py-24 sm:px-6"
    >
      <div className="mx-auto max-w-6xl">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-hero text-3xl font-bold tracking-tight text-balance text-[#0F172A] sm:text-4xl">
          Everything you save, in one library
        </h2>
        <p className="mt-4 leading-relaxed text-pretty text-[#475569]">
          Articles, videos, podcasts, PDFs, tweets, notes and links all land in
          the same place. Pick a type to see what that looks like.
        </p>
      </div>

      {/* Filter chips — the dashboard's own row. */}
      <div
        role="group"
        aria-label="Filter saved items by type"
        className="mt-10 flex flex-wrap items-center justify-center gap-2"
      >
        {TYPES.map((type) => {
          const isActive = type.id === active;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => pick(type.id)}
              aria-pressed={isActive}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
                isActive
                  ? "border-transparent text-white shadow-[0_10px_22px_-14px_rgba(37,99,235,0.65)]"
                  : "border-[#CBD5E1] bg-white text-[#64748B] hover:border-[#94A3B8] hover:text-[#475569]"
              }`}
              style={isActive ? { background: PRIMARY_GRADIENT } : undefined}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: isActive ? "#FFFFFF" : type.dot }}
              />
              {type.label}
            </button>
          );
        })}
      </div>

      {/* The library. Matching items hold; the rest recede. */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item, index) => (
          <ItemCard
            key={`${item.title}-${index}`}
            item={item}
            matches={item.type === active}
            reduce={reduce}
          />
        ))}
      </div>
      </div>
    </section>
  );
}

function ItemCard({
  item,
  matches,
  reduce,
}: {
  item: Item;
  matches: boolean;
  reduce: boolean;
}) {
  const type = TYPE_BY_ID[item.type];

  return (
    <motion.article
      initial={false}
      animate={
        reduce
          ? { opacity: matches ? 1 : 0.4 }
          : { opacity: matches ? 1 : 0.32, scale: matches ? 1 : 0.97, y: matches ? 0 : 4 }
      }
      transition={{ duration: reduce ? 0 : 0.38, ease: EASE }}
      className="rounded-2xl border border-[#CBD5E1] bg-white p-5"
      style={{
        boxShadow: matches
          ? "0 1px 2px rgba(15,23,42,0.04), 0 14px 30px -18px rgba(37,99,235,0.28)"
          : "0 1px 2px rgba(15,23,42,0.03)",
      }}
    >
      <p className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: type.dot }}
        />
        {type.label}
      </p>
      <h3 className="mt-3 text-[15px] leading-snug font-semibold tracking-tight text-[#0F172A]">
        {item.title}
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[#475569]">{item.body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {item.tag && (
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}
          >
            {item.tag}
          </span>
        )}
        <span className="text-[11px] text-[#64748B]">{item.meta}</span>
      </div>
    </motion.article>
  );
}
