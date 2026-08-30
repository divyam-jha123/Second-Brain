import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  FaXTwitter,
  FaYoutube,
  FaLinkedin,
  FaFileLines,
  FaLink,
  FaVideo,
} from "react-icons/fa6";
import { SUPPORT_EMAIL } from "../config";
import { BrainExpoLogo } from "../assets/brand/BrainExpoLogo";
import { useLandingVariants, type LandingVariants } from "./landingAnimations";
import { FeaturesScrollytelling } from "./landing/FeaturesScrollytelling";
import { ProductStatement } from "./landing/ProductStatement";
import { FeatureSwitcher } from "./landing/FeatureSwitcher";
import { ServiceCards } from "./landing/ServiceCards";
import { SecurityBand } from "./landing/SecurityBand";
import { ClosingCTA } from "./landing/ClosingCTA";

/**
 * Brain Expo landing page.
 *
 * Layout recreated from the Framer "landing-page-design" (Krowtt) template:
 * Hero + floating cards -> big statement -> trusted-by -> feature highlight ->
 * service-card grid -> push/pull integrations -> testimonial ticker ->
 * compliance band -> CTA -> footer. Copy adapted for Brain Expo.
 */

const ACCENT = "#774CFF";

// The words the headline (and the hub tag) cycle through, in order.
const HERO_WORDS = ["organized", "connected", "smarter", "useful", "searchable"];

// Rotating highlight palette — 6 pairs (soft tinted pill bg + saturated accent
// dot) cycled in order behind the changing word. Pill text stays #111111 in all
// states; only the background + dot cross-fade together on each change.
const HIGHLIGHT_PAIRS: { bg: string; dot: string }[] = [
  { bg: "#E2F0FD", dot: "#0671E4" },
  { bg: "#C8F2D1", dot: "#16A230" },
  { bg: "#FFD8BB", dot: "#FD6000" },
  { bg: "#FDDEA3", dot: "#FDA610" },
  { bg: "#E6D5F9", dot: "#8B3EE2" },
  { bg: "#B4E1E0", dot: "#21837F" },
];

/**
 * Advances through `words` on a fixed interval and returns the current one.
 * Both the headline's bracketed word and the hub tag read from a single call of
 * this hook in the parent, so they always stay in sync. Cycling is paused under
 * prefers-reduced-motion (the first word stays put).
 */
function useCyclingWord(words: string[], interval = 2200): string {
  const reduce = useReducedMotion() ?? false;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((p) => (p + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval, reduce]);
  return words[i];
}

/**
 * True once the page is scrolled past `threshold` px. Drives the header morph
 * (flat full-width bar -> floating pill). rAF-throttled; reads scrollY on mount
 * so a deep-linked / refreshed-mid-page load starts in the correct state.
 */
function useScrolled(threshold = 40): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > threshold);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);
  return scrolled;
}

const heroCards = [
  {
    title: "Save anything instantly",
    text: "Capture links, tweets, videos and docs the moment you find them.",
  },
  {
    title: "AI-organized tags",
    text: "Everything you save is sorted and searchable automatically.",
  },
  {
    title: "Share in one click",
    text: "Turn any collection into a link your team can explore.",
  },
];

/**
 * Hero branch nodes — the floating platform tiles that surround the headline.
 *
 * The Brain Expo logo orb (stage centre) is the hub: each tile sits at a
 * percentage position around it and is joined to the orb by a curved "thread"
 * that draws itself in. Positions are given as % of the branch stage, and the
 * SVG thread coordinates live in a 1200x600 viewBox that maps 1:1 onto the same
 * stage (aspect-[1200/600] + meet), so a tile at left/top % lines up exactly
 * with its thread's anchor point.
 *   origin = where the thread leaves the orb rim · anchor = where it meets the tile
 */
const heroNodes: {
  name: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  pos: { left: string; top: string };
  path: string;
  origin: [number, number];
  thread: number; // absolute delay (s) for the thread draw
  entrance: number; // absolute delay (s) for the tile pop-in
  floatDur: number; // continuous idle-float period (s)
  floatDelay: number;
}[] = [
  { name: "YouTube", Icon: FaYoutube, color: "#FF0000", pos: { left: "7%", top: "16%" },
    path: "M 555 268 C 420 200, 250 130, 84 96", origin: [555, 268], thread: 0.95, entrance: 1.25, floatDur: 6.5, floatDelay: 0 },
  { name: "LinkedIn", Icon: FaLinkedin, color: "#0A66C2", pos: { left: "4%", top: "50%" },
    path: "M 540 300 C 380 300, 200 300, 48 300", origin: [540, 300], thread: 1.05, entrance: 1.35, floatDur: 7.5, floatDelay: 0.6 },
  { name: "Docs", Icon: FaFileLines, color: "#E8590C", pos: { left: "7%", top: "84%" },
    path: "M 555 332 C 420 400, 250 470, 84 504", origin: [555, 332], thread: 1.15, entrance: 1.45, floatDur: 6.9, floatDelay: 1.1 },
  { name: "Twitter / X", Icon: FaXTwitter, color: "#000000", pos: { left: "93%", top: "16%" },
    path: "M 645 268 C 780 200, 950 130, 1116 96", origin: [645, 268], thread: 1.0, entrance: 1.3, floatDur: 7.1, floatDelay: 0.3 },
  { name: "Links", Icon: FaLink, color: "#0EA5E9", pos: { left: "96%", top: "50%" },
    path: "M 660 300 C 820 300, 1000 300, 1152 300", origin: [660, 300], thread: 1.1, entrance: 1.4, floatDur: 6.7, floatDelay: 0.9 },
  { name: "Video", Icon: FaVideo, color: "#7C3AED", pos: { left: "93%", top: "84%" },
    path: "M 645 332 C 780 400, 950 470, 1116 504", origin: [645, 332], thread: 1.2, entrance: 1.5, floatDur: 7.3, floatDelay: 1.4 },
];

// The six source logos, matching the Framer template's Integration Logo row.
const integrationLogos: { name: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { name: "YouTube", Icon: FaYoutube },
  { name: "LinkedIn", Icon: FaLinkedin },
  { name: "Document", Icon: FaFileLines },
  { name: "Twitter", Icon: FaXTwitter },
  { name: "Link", Icon: FaLink },
  { name: "Video", Icon: FaVideo },
];

export const BrainExpoLanding = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const v = useLandingVariants();
  const word = useCyclingWord(HERO_WORDS);
  const scrolled = useScrolled(40);
  const MORPH = "620ms";
  const MORPH_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <motion.div
      // `overflow-x-clip` (not `-hidden`): clipping alone, without turning this
      // wrapper into a scroll container — which would break `position: sticky`
      // inside it (the scrollytelling tour depends on it).
      className="landing-root min-h-screen bg-[#e9e9e9] text-[#1b1b22] overflow-x-clip antialiased"
      initial="hidden"
      animate="visible"
      variants={v.root}
    >
      {/*
        Header that morphs on scroll. At the top of the page it's a full-width
        flat bar with a bottom rule; past 40px it contracts to a floating white
        pill (max 820px, rounded, drop shadow, pill CTA). Every morphing property
        animates together on one 620ms eased transition, so scrolling back up
        reverses it. Width/radius/shadow/background/border/padding are driven by
        inline style off `scrolled`; Tailwind handles the static bits.
      */}
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center">
        <div
          className="w-full backdrop-blur-md transition-all"
          style={{
            transitionDuration: MORPH,
            transitionTimingFunction: MORPH_EASE,
            maxWidth: scrolled ? "820px" : "100%",
            marginTop: scrolled ? "12px" : "0px",
            borderStyle: "solid",
            borderWidth: "1px",
            borderColor: scrolled ? "rgba(255,255,255,0.08)" : "transparent",
            borderBottomColor: scrolled ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.08)",
            borderRadius: scrolled ? "9999px" : "0px",
            backgroundColor: scrolled ? "#1b1b22" : "rgba(27,27,34,0.88)",
            boxShadow: scrolled
              ? "0 16px 40px -16px rgba(0,0,0,0.5)"
              : "0 0 0 0 rgba(0,0,0,0)",
          }}
        >
          <div
            className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 transition-all"
            style={{
              transitionDuration: MORPH,
              transitionTimingFunction: MORPH_EASE,
              paddingTop: scrolled ? "8px" : "12px",
              paddingBottom: scrolled ? "8px" : "12px",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span style={{ color: ACCENT }}>
                <BrainExpoLogo size="lg" />
              </span>
              <span className="text-xl font-bold tracking-tight text-white">Brain Expo</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {[
                ["Features", "#tour"],
                ["Products", "#products"],
                ["Integrations", "#integrations"],
                ["Security", "#security"],
                ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white hover:bg-white/10 transition min-h-[44px]"
                aria-label={isNavOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isNavOpen}
                onClick={() => setIsNavOpen((v) => !v)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  {isNavOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  )}
                </svg>
              </button>

              <Link
                to="/sign-in"
                className="hidden md:inline-flex text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2"
              >
                Log in
              </Link>
              <Link
                to="/sign-up"
                className="text-sm font-medium text-white px-4 py-2 transition-all hover:opacity-90 shadow-sm min-h-[44px] inline-flex items-center justify-center"
                style={{
                  backgroundColor: ACCENT,
                  borderRadius: scrolled ? "9999px" : "10px",
                  transitionDuration: MORPH,
                  transitionTimingFunction: MORPH_EASE,
                }}
              >
                Start for free
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile menu — a separate floating panel so it never clips the pill */}
        {isNavOpen && (
          <div className="md:hidden absolute left-4 right-4 top-full mt-2 rounded-2xl border border-white/10 bg-[#1b1b22] px-4 py-3 shadow-lg flex flex-col gap-1">
            {[
              ["Features", "#tour"],
              ["Products", "#products"],
              ["Integrations", "#integrations"],
              ["Security", "#security"],
              ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setIsNavOpen(false)}
                className="py-2 text-sm font-medium text-gray-300 hover:text-white"
              >
                {label}
              </a>
            ))}
            <Link to="/sign-in" className="py-2 text-sm font-medium text-gray-300 hover:text-white">
              Log in
            </Link>
          </div>
        )}
      </header>

      {/* ---------- Hero ---------- */}
      <section id="hero" className="relative overflow-hidden bg-[#FAFAFB]">
        {/*
          Background stack (behind all hero content), painted bottom-to-top:
          soft violet atmospheric glow -> fine architectural grid -> a near-white
          wash that keeps the area behind the heading cleaner so the typography
          stays dominant. Barely-there, never competing with the heading.
        */}
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          {/* Ambient glow — very low-opacity violet rising from bottom-centre +
              lower-right, anchored around the branch-stage band. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(780px 460px at 50% 780px, rgba(109,61,245,0.10), transparent 68%)," +
                "radial-gradient(680px 420px at 86% 740px, rgba(139,92,246,0.10), transparent 68%)," +
                "radial-gradient(560px 340px at 42% 800px, rgba(237,233,254,0.45), transparent 70%)",
            }}
          />
          {/* Fine 64px architectural grid — 1px violet lines at ~3.5%, faded to
              the edges by a radial mask. No diagonals, no per-cell gradient. */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(109,61,245,0.035) 1px, transparent 1px)," +
                "linear-gradient(to bottom, rgba(109,61,245,0.035) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
              WebkitMaskImage:
                "radial-gradient(125% 105% at 50% 38%, #000 45%, transparent 100%)",
              maskImage:
                "radial-gradient(125% 105% at 50% 38%, #000 45%, transparent 100%)",
            }}
          />
          {/* Clean the grid directly behind the heading. */}
          <div
            className="absolute inset-x-0 top-0 h-[460px]"
            style={{
              background:
                "radial-gradient(620px 300px at 50% 34%, rgba(250,250,251,0.92), rgba(250,250,251,0) 72%)",
            }}
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12">
          {/* Hero copy */}
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            

            <HeroHeading word={word} />

            <motion.p
              className="mt-5 mx-auto max-w-xl text-base sm:text-lg text-gray-500 leading-relaxed"
              variants={v.description}
            >
              Brain Expo captures everything you read, watch and save — then tags,
              organizes and surfaces it exactly when you need it.
            </motion.p>

            {/* Mobile CTA (the desktop CTA lives inside the branch stage below) */}
            <motion.div className="mt-8 md:hidden" variants={v.cta}>
              <HeroActions />
            </motion.div>
          </div>
        </div>

        {/*
          Branch stage (md+): full-width band so the threads reach ~80% of the
          viewport. The Brain Expo logo orb is the hub — threads draw out of it to
          the floating platform tiles, a live tag above the orb cycles the same
          word as the headline, and the primary CTA sits in the upper gap, inline
          with the top (YouTube / Twitter) nodes but centered. Hidden on mobile.
        */}
        <div className="relative z-10 mx-auto -mt-12 hidden w-full max-w-7xl px-4 sm:px-6 md:block">
          <div className="relative w-full md:aspect-[1200/600]">
            <HeroThreads />
            <HeroFloatingNodes v={v} />

            {/* Desktop CTA — centered, on the top-node line */}
            <div className="absolute left-1/2 top-[16%] z-20 -translate-x-1/2 -translate-y-1/2">
              <motion.div variants={v.cta}>
                <HeroActions />
              </motion.div>
            </div>

            <HeroHub v={v} word={word} />
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          {/* Hero cards row */}
          <motion.div
            className="mt-12 grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto text-left"
            variants={v.cardsContainer}
          >
            {heroCards.map((card) => (
              <motion.div
                key={card.title}
                className="rounded-xl border border-gray-200 bg-white/95 p-5 shadow-sm"
                variants={v.card}
              >
                <p className="text-sm font-semibold text-gray-900">{card.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{card.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------- Big statement ---------- */}
      <ProductStatement />

      {/* ---------- Guided product tour (scrollytelling) ---------- */}
      <FeaturesScrollytelling />

      {/* ---------- What you can save (interactive type filter) ---------- */}
      <FeatureSwitcher />

      {/* ---------- The five tools ---------- */}
      <ServiceCards />

      {/* ---------- Integrations (push / pull) ---------- */}
      <section id="integrations" className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Seamless, secure integrations with the tools you use
          </h2>
          <p className="mt-4 text-gray-500">
            Pull your reading in from anywhere, and push what you save back out to
            the apps where you already work.
          </p>
        </div>

        {/* Integratin Logo Outer: two stacked marquee rows + divider line */}
        <div className="flex flex-col items-center gap-0">
          {/* Pushing integrations — Black Logo row */}
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
            Pushing integrations
          </p>
          <div className="marquee-pause w-full overflow-hidden">
            <div className="marquee-track marquee-left" style={{ gap: "56px", padding: "12px 28px" }}>
              {[...integrationLogos, ...integrationLogos, ...integrationLogos].map(({ name, Icon }, i) => (
                <IntegrationLogo key={`push-${i}`} name={name} Icon={Icon} variant="black" />
              ))}
            </div>
          </div>

          {/* Integration Line divider */}
          <div className="my-8 h-px w-full max-w-[416px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

          {/* Pulling integrations — White Logo row */}
          <div className="marquee-pause w-full overflow-hidden">
            <div className="marquee-track marquee-right" style={{ gap: "56px", padding: "12px 28px" }}>
              {[...integrationLogos, ...integrationLogos, ...integrationLogos].map(({ name, Icon }, i) => (
                <IntegrationLogo key={`pull-${i}`} name={name} Icon={Icon} variant="white" />
              ))}
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-6">
            Pulling integrations
          </p>
        </div>
      </section>

      {/* ---------- Security (revocable-link demo) ---------- */}
      <SecurityBand />

      {/* ---------- Closing CTA ---------- */}
      <ClosingCTA />

      {/* ---------- Footer ---------- */}
      <footer className="bg-[#0f0e14] text-gray-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 text-white">
                <span style={{ color: ACCENT }}>
                  <BrainExpoLogo size="lg" />
                </span>
                <span className="text-lg font-bold">Brain Expo</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed max-w-xs">
                Your second brain for the modern web. Capture, organize and recall
                everything that matters.
              </p>
            </div>

            {/*
              Only destinations that exist. Pricing, a blog, a community and the
              social accounts were all links to nothing — a dead link costs more
              trust than an absent one.
            */}
            <FooterCol
              title="PRODUCT"
              links={[
                { label: "How it works", href: "#tour" },
                { label: "Save anything", href: "#features" },
                { label: "Integrations", href: "#integrations" },
                { label: "Security", href: "#security" },
              ]}
            />
            <FooterCol
              title="GET STARTED"
              links={[
                { label: "Create an account", href: "/sign-up" },
                { label: "Log in", href: "/sign-in" },
              ]}
            />
            <FooterCol
              title="SUPPORT"
              links={[{ label: "Contact us", href: `mailto:${SUPPORT_EMAIL}` }]}
            />
          </div>

          {/*
            Terms / Privacy / Cookie links pointed at "#". They are worth adding
            for real — this product stores saves and sends email — but a link to
            nothing is worse than no link. "Inc." also went: nothing establishes
            that the company is incorporated.
          */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
            <p className="text-xs">© 2026 Brain Expo. All rights reserved.</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex min-h-[36px] items-center text-xs decoration-white/40 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

/** Primary hero call-to-action pair. Rendered on mobile in the copy block and
 *  on md+ inside the branch stage (in the upper gap, inline with the top nodes). */
function HeroActions() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <Link
        to="/sign-up"
        className="w-full sm:w-auto text-sm font-semibold text-white px-6 py-3 rounded-xl shadow-sm hover:opacity-90 transition-opacity inline-flex items-center justify-center min-h-[48px]"
        style={{ backgroundColor: ACCENT }}
      >
        Start for free
      </Link>
      <a
        href="#products"
        className="w-full sm:w-auto text-sm font-semibold text-gray-700 px-6 py-3 rounded-xl border border-gray-200 bg-white/90 backdrop-blur hover:bg-white transition-colors inline-flex items-center justify-center min-h-[48px]"
      >
        See how it works
      </a>
    </div>
  );
}

/**
 * Hero headline: a fixed lead line ("Where your knowledge gets") that reveals
 * with a blur-up, followed by the accent word in brackets that cycles through
 * HERO_WORDS. The lead lines fade + rise + sharpen (blur -> 0), staggered; the
 * bracketed word swaps via <CyclingWord>. Reduced motion drops travel and blur.
 */
function HeroHeading({ word }: { word: string }) {
  const reduce = useReducedMotion() ?? false;
  const blurPx = reduce ? 0 : 10;

  const line = (delay: number) => ({
    initial: { y: reduce ? 0 : 16, opacity: 0, filter: `blur(${blurPx}px)` },
    animate: { y: 0, opacity: 1, filter: "blur(0px)" },
    transition: { duration: reduce ? 0.01 : 0.8, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <div className="relative z-10 mt-27">
      <motion.div
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm"
        style={{ borderColor: "rgba(119,76,255,0.25)", color: ACCENT, backgroundColor: "rgba(119,76,255,0.06)" }}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
        Your second brain for the modern web
      </motion.div>
      <h1
        className="font-hero mt-8 mx-auto max-w-3xl text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.2]"
        aria-label={`Where your knowledge gets ${word}`}
      >
        <motion.span className="font-bold block will-change-transform" {...line(0.28)}>
          Where your knowledge gets{" "}
          <motion.span className="inline-block align-middle will-change-transform" {...line(0.42)}>
            <CyclingWord word={word} />
          </motion.span>
        </motion.span>
      </h1>
    </div>
  );
}

/**
 * The changing word in the hero headline, wrapped in a soft tinted capsule.
 * The whole highlight behaves as one fluid element:
 *   • the container carries `layout`, so its box smoothly resizes to each new
 *     word instead of snapping;
 *   • words swap with `mode="popLayout"` (the outgoing word is pulled out of
 *     flow so the box measures the incoming word) crossfading on a clean
 *     vertical slide — out goes up, in comes from below (no blur);
 *   • the pill background and the accent dot cross-fade together through the
 *     6-pair HIGHLIGHT_PAIRS palette, advancing one pair per word change;
 *   • the dot on the left rides along via `layout`.
 * The word text stays #111111 in every state — only the bg + dot change.
 * Reduced motion collapses the swap to a fade and freezes the resize.
 */
function CyclingWord({ word }: { word: string }) {
  // Rotate the palette one pair per word change (independent of which word),
  // starting on pair 0 for the first render.
  const prev = useRef(word);
  const stepRef = useRef(0);
  const [pairIdx, setPairIdx] = useState(0);
  useEffect(() => {
    if (prev.current !== word) {
      prev.current = word;
      stepRef.current += 1;
      setPairIdx(stepRef.current % HIGHLIGHT_PAIRS.length);
    }
  }, [word]);
  const { bg, dot } = HIGHLIGHT_PAIRS[pairIdx];

  const EASE = [0.22, 1, 0.36, 1] as const;
  // The pill box resizes and its colours cross-fade to match the word roll.
  const spring = { type: "spring" as const, stiffness: 260, damping: 30, mass: 0.7 };
  const colorFade = { duration: 0.4, ease: EASE };

  return (
    <motion.span
      layout
      animate={{ backgroundColor: bg }}
      transition={{ layout: spring, backgroundColor: colorFade }}
      className="relative inline-flex items-center align-middle"
      style={{
        backgroundColor: bg,
        borderRadius: "999px",
        paddingLeft: "0.42em",
        paddingRight: "0.46em",
        paddingTop: "0.12em",
        paddingBottom: "0.16em",
        gap: "0.4em",
      }}
    >
      {/* Accent dot on the LEFT — cross-fades its colour with the pill bg and
          rides with the capsule as it resizes. No glow, no shadow. */}
      <motion.span
        layout="position"
        aria-hidden
        animate={{ backgroundColor: dot }}
        transition={{ layout: spring, backgroundColor: colorFade }}
        className="shrink-0 rounded-full"
        style={{ width: "0.45em", height: "0.45em", backgroundColor: dot }}
      />

      {/* Masked roll: the incoming word rises from below, the outgoing word
          continues up and out of view. overflow-hidden clips the travel. */}
      <span className="relative inline-block overflow-hidden leading-[1.12]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={word}
            className="inline-block whitespace-nowrap will-change-transform font-light"
            style={{ color: "#111111" }}
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.42, ease: EASE }}
          >
            {word}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.span>
  );
}

/**
 * Hero threads — the curved "branches" that connect the logo-orb hub to each
 * floating platform tile. Drawn in a 1200x600 viewBox that maps 1:1 onto the
 * branch stage (aspect-[1200/600] + xMidYMid meet), so every thread lines up
 * with its tile's percentage position. Each thread draws itself in (pathLength
 * 0 -> 1, staggered), then a dashed overlay flows along it forever. A soft dot
 * marks where the branch roots into the orb rim. Hidden on mobile / static
 * for reduced motion.
 */
function HeroThreads() {
  const reduce = useReducedMotion() ?? false;
  return (
    <svg
      viewBox="0 0 1200 600"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      className="hidden md:block absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    >
      <defs>
        <linearGradient id="wireGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#774CFF" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#774CFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#774CFF" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {heroNodes.map((n) => (
        <g key={n.name}>
          <motion.path
            d={n.path}
            stroke="url(#wireGrad)"
            strokeWidth={1.6}
            strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: reduce ? 0.01 : 1.1,
              delay: reduce ? 0 : n.thread,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
          {/* animated flow overlay */}
          <path
            d={n.path}
            stroke="#774CFF"
            strokeWidth={1.4}
            strokeOpacity={0.45}
            strokeDasharray="4 14"
            className="wire-flow"
          />
          {/* branch root dot on the orb rim */}
          <circle cx={n.origin[0]} cy={n.origin[1]} r={4} fill="#ffffff" stroke="#774CFF" strokeWidth={1.4} />
        </g>
      ))}
    </svg>
  );
}

/**
 * Hero hub — the Brain Expo logo orb at the centre of the branch stage (the
 * point every thread roots into) with a live "tag" floating just above it. The
 * tag shows the same cycling word as the headline, so the hub reads as the thing
 * doing the organizing. Orb and tag share the staggered blur-rise entrance.
 */
function HeroHub({ v, word }: { v: LandingVariants; word: string }) {
  return (
    <>
      {/* Live tag, centred above the orb */}
      <div
        className="absolute z-10"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, calc(-50% - 82px))" }}
      >
        <motion.div variants={v.secondary(1.05)}>
          <div className="hero-float" style={{ animationDuration: "5.5s" }}>
            <HubTag word={word} />
          </div>
        </motion.div>
      </div>

      {/* Logo orb */}
      <div
        className="absolute"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
      >
        <motion.div className="relative" variants={v.secondary(0.85)}>
          <div
            className="orb-glow absolute -inset-10 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(119,76,255,0.55), transparent)" }}
          />
          <div
            className="relative flex h-24 w-24 items-center justify-center rounded-full sm:h-28 sm:w-28"
            style={{
              background: "radial-gradient(circle at 32% 28%, #8a6bff, #1b1b22 78%)",
              boxShadow: "0 20px 55px rgba(119,76,255,0.5), inset 0 0 20px rgba(255,255,255,0.15)",
            }}
          >
            <span className="text-white">
              <BrainExpoLogo size="lg" />
            </span>
          </div>
        </motion.div>
      </div>
    </>
  );
}

/**
 * The floating pill above the orb. A pulsing dot plus the current cycling word,
 * kept in sync with the headline (same `word` prop, same word list). The word
 * swaps with the same blur/slide as <CyclingWord>.
 */
function HubTag({ word }: { word: string }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-3.5 py-1.5 shadow-[0_12px_32px_-8px_rgba(80,50,180,0.5)] ring-1 ring-black/5">
      <span className="relative flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-60"
          style={{ backgroundColor: ACCENT, animation: reduce ? undefined : "orbPulse 2s ease-in-out infinite" }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT }} />
      </span>
      <span className="text-xs font-medium text-gray-500">Knowledge, made</span>
      <span className="grid text-xs font-semibold" style={{ color: ACCENT }}>
        <AnimatePresence initial={false}>
          <motion.span
            key={word}
            className="col-start-1 row-start-1 whitespace-nowrap"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: reduce ? 0.01 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}

/**
 * Hero floating tiles — the six platform "PNG" cards that branch around the
 * headline. Each is placed at its node's percentage position (centered on the
 * point) so it caps the end of a thread. The outer element runs the entrance
 * (blur + fade + rise, staggered), the inner element runs a continuous idle
 * float; keeping them on separate elements avoids transform conflicts.
 */
function HeroFloatingNodes({ v }: { v: LandingVariants }) {
  return (
    <div className="hidden md:block absolute inset-0 pointer-events-none" aria-hidden>
      {heroNodes.map((n) => (
        <div
          key={n.name}
          className="absolute"
          style={{ left: n.pos.left, top: n.pos.top, transform: "translate(-50%, -50%)" }}
        >
          <motion.div variants={v.secondary(n.entrance)}>
            <div
              className="hero-float"
              style={{ animationDuration: `${n.floatDur}s`, animationDelay: `${n.floatDelay}s` }}
            >
              <div className="flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur px-3.5 py-2.5 shadow-[0_18px_45px_-12px_rgba(80,50,180,0.4)] ring-1 ring-black/5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${n.color}14` }}
                >
                  <n.Icon className="h-5 w-5" style={{ color: n.color }} />
                </span>
                <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{n.name}</span>
              </div>
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  );
}

/**
 * Single logo card — mirrors the Framer "Integration Logo" node thread:
 *   Outer card (radius 22.8px, 2px border, drop-shadow, 5px padding)
 *     -> Inner tinted square (68x81, radius 20px, 16px padding, translucent fill)
 *       -> logo (max ~43px wide)
 * "black" is the Pushing row, "white" is the Pulling row.
 */
function IntegrationLogo({
  name,
  Icon,
  variant,
}: {
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
  variant: "black" | "white";
}) {
  const black = variant === "black";
  return (
    <div
      title={name}
      className="shrink-0"
      style={{
        borderRadius: "22.8px",
        padding: "5px",
        border: black ? "2px solid rgba(255,255,255,0.1)" : "2px solid rgba(0,0,0,0.06)",
        background: black ? "#1b1b22" : "#ffffff",
        boxShadow: "0px 25px 40px -6.4px rgba(0,0,0,0.2)",
      }}
    >
      {/* Integration Logo Inner */}
      <div
        className="flex items-center justify-center"
        style={{
          width: "68px",
          height: "81px",
          borderRadius: "20px",
          padding: "16px",
          background: black ? "rgba(233,233,233,0.12)" : "rgba(0,0,0,0.04)",
        }}
      >
        <Icon className={`w-8 h-8 ${black ? "text-white" : "text-[#1b1b22]"}`} />
      </div>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold text-white">{title}</h4>
      <ul className="space-y-1 text-sm">
        {links.map(({ label, href }) => {
          // In-page anchors and mailto: stay plain <a>; app routes go through
          // the router so they don't cost a full reload.
          const isRoute = href.startsWith("/");
          const className =
            "inline-flex min-h-[36px] items-center decoration-white/40 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
          return (
            <li key={label}>
              {isRoute ? (
                <Link to={href} className={className}>
                  {label}
                </Link>
              ) : (
                <a href={href} className={className}>
                  {label}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
