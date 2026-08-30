import { useCallback, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useMediaQuery } from "../landingAnimations";
import { ProductStage } from "./ProductStage";
import { featureIndexAt, features, type FeatureScene } from "./features.data";

/**
 * Scroll-driven product tour: "save it, remember it, revisit it, share it".
 *
 * A short intro sits in normal flow, then a tall track pins one stage with
 * `position: sticky` — so the page keeps scrolling normally. No wheel
 * interception, no inner scroll container, no body lock.
 *
 * Scroll progress across the track is read once with `useScroll` and handed
 * straight to <ProductStage />, which derives camera, overlays and pointer from
 * it as MotionValues. The only React state the tour keeps is the active index,
 * which changes four times across the whole section, because the copy on the
 * left has to actually re-render.
 *
 * The two columns are one composition, not two cards: the stage is pulled left
 * underneath the narrative, and the narrative carries its own ground — a
 * gradient that fades out over the stage's left edge — so the product reads as
 * emerging from behind the sentence describing it.
 *
 * Below `lg` the pin is dropped (a 560vh sticky stage is miserable on a phone)
 * for a stacked read where each feature still gets its own product state.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const ACCENT = "#774CFF";
/** Track height. Uneven slices in features.data.ts divide it up. */
const TRACK_VH = 560;

const numberLabel = (index: number) => String(index + 1).padStart(2, "0");
const TOTAL = String(features.length).padStart(2, "0");

export function FeaturesScrollytelling() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  return (
    // No `overflow` on this section, at any value: it would make this element
    // the scrollport for the pinned stage inside and break `position: sticky`.
    // The page root already clips the horizontal bleed.
    <section
      id="tour"
      className="relative scroll-mt-24 border-y border-gray-100 bg-[#F8F8FB]"
      aria-label="How Brain Expo works"
    >
      {/* Shared ground: one soft field both columns sit on. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 72% 42%, rgba(119,76,255,0.10) 0%, rgba(119,76,255,0.03) 38%, transparent 68%)",
        }}
      />
      <SectionIntro />
      {isDesktop ? <PinnedTour /> : <StackedTour />}
    </section>
  );
}

function SectionIntro() {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div
      className="relative mx-auto max-w-3xl px-4 pt-24 pb-4 text-center sm:px-6 lg:pb-10"
      initial={reduce ? false : { opacity: 0, y: 18, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <p
        className="text-[11px] font-semibold tracking-[0.18em] uppercase"
        style={{ color: ACCENT }}
      >
        How Brain Expo works
      </p>
      <h2 className="font-hero mt-4 text-[34px] leading-[1.06] font-bold tracking-tight text-balance text-gray-900 sm:text-[44px] lg:text-[52px]">
        Don't just save it.
        <br />
        <span style={{ color: ACCENT }}>Remember it.</span>
      </h2>
      <p className="mx-auto mt-5 max-w-[52ch] text-base leading-relaxed text-pretty text-gray-500 sm:text-[17px]">
        Brain Expo captures what you discover, brings the important ideas back
        when they're worth revisiting, and lets you share what you've gathered
        with anyone.
      </p>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Desktop: one pinned stage                                                  */
/* -------------------------------------------------------------------------- */

function PinnedTour() {
  const reduce = useReducedMotion() ?? false;
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const activeRef = useRef(0);
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const next = featureIndexAt(progress);
    if (next !== activeRef.current) {
      activeRef.current = next;
      setActiveIndex(next);
    }
  });

  // Progress rail, driven straight off the MotionValue — it never re-renders.
  const railScale = useTransform(scrollYProgress, [0, 1], [0.015, 1]);

  /**
   * Scroll stays the single source of truth: a step click scrolls the page into
   * the middle of that step's slice rather than setting state behind its back.
   */
  const goToFeature = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const feature = features[index];
      const top = track.getBoundingClientRect().top + window.scrollY;
      const scrollable = track.offsetHeight - window.innerHeight;
      const midpoint = (feature.startProgress + feature.endProgress) / 2;
      window.scrollTo({
        top: Math.round(top + scrollable * midpoint),
        behavior: reduce ? "auto" : "smooth",
      });
    },
    [reduce],
  );

  const active = features[activeIndex];

  return (
    <div ref={trackRef} className="relative" style={{ height: `${TRACK_VH}vh` }}>
      {/* pt clears the page's fixed navbar so the stage is never tucked under it. */}
      <div className="sticky top-0 flex h-screen items-center overflow-hidden pt-14">
        <div className="mx-auto grid w-full max-w-[104rem] grid-cols-[minmax(0,23rem)_minmax(0,1fr)] items-center px-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:px-10 2xl:grid-cols-[minmax(0,29rem)_minmax(0,1fr)]">
          {/*
            Left: the narrative, on its own ground.

            `--tour-gutter` is the one number that keeps the two columns from
            colliding: the stage is pulled left by exactly this much, the copy is
            padded right by exactly this much, and the ground's fade is exactly
            this wide. So the copy always stops on the stage's leading edge, and
            the only thing that ever sits over the screenshot is the fade.
          */}
          <div className="relative z-20 [--tour-gutter:4rem] xl:[--tour-gutter:6rem] 2xl:[--tour-gutter:7rem]">
            {/* The ground the stage slides under. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-y-32 -left-32 right-0"
              style={{
                background:
                  "linear-gradient(to right, #F8F8FB 0, #F8F8FB calc(100% - var(--tour-gutter)), rgba(248,248,251,0) 100%)",
              }}
            />

            <div className="relative pr-[var(--tour-gutter)]">
              {/*
                Reserved so the steps below never shift as the copy changes.
                Sized to the tallest step ("Revisit") at the narrowest measure,
                with headroom — a still rail is worth the whitespace.
              */}
              <div className="min-h-[300px] 2xl:min-h-[324px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active.id}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(5px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(4px)" }}
                    transition={{ duration: reduce ? 0.2 : 0.4, ease: EASE }}
                  >
                    <p className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.16em] text-gray-400 tabular-nums">
                      {numberLabel(activeIndex)}
                      <span aria-hidden className="h-px w-6 bg-gray-300" />
                      <span className="tracking-[0.16em] uppercase" style={{ color: ACCENT }}>
                        {active.navLabel}
                      </span>
                    </p>
                    <h3 className="font-hero mt-4 max-w-[15ch] text-[30px] leading-[1.1] font-bold tracking-tight text-balance text-gray-900 xl:text-[35px] 2xl:text-[39px]">
                      {active.title}
                    </h3>
                    <p className="mt-4 max-w-[44ch] text-[15px] leading-relaxed text-pretty text-gray-500 xl:text-base">
                      {active.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ---------- Steps + progress rail ---------- */}
              <div className="mt-9 flex gap-5">
                <div
                  aria-hidden
                  className="relative w-px shrink-0 overflow-hidden rounded-full bg-gray-200"
                >
                  <motion.div
                    className="absolute inset-0 origin-top rounded-full"
                    style={{ backgroundColor: ACCENT, scaleY: railScale }}
                  />
                </div>

                <ul className="flex flex-col gap-0.5">
                  {features.map((feature, index) => {
                    const isActive = index === activeIndex;
                    return (
                      <li key={feature.id}>
                        <button
                          type="button"
                          onClick={() => goToFeature(index)}
                          aria-current={isActive ? "step" : undefined}
                          className={`group flex items-baseline gap-3 rounded-md py-1.5 text-left text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#774CFF] ${
                            isActive
                              ? "font-semibold text-gray-900"
                              : "font-medium text-gray-400 hover:text-gray-700"
                          }`}
                        >
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors"
                            style={{ backgroundColor: isActive ? ACCENT : "#D4D4D8" }}
                          />
                          {feature.navLabel}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* ---------- Right: the product, emerging from under the copy ---------- */}
          <motion.div
            className="relative z-10 -ml-[4rem] xl:-ml-[6rem] 2xl:-ml-[7rem]"
            initial={reduce ? false : { opacity: 0, y: 26, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.9, ease: EASE }}
            style={{ maxWidth: "calc(78vh * 1.777)" }}
          >
            <ProductStage progress={scrollYProgress} reduceMotion={reduce} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mobile / tablet: stacked read                                              */
/* -------------------------------------------------------------------------- */

function StackedTour() {
  return (
    <div className="relative mx-auto max-w-2xl px-4 pt-6 pb-20 sm:px-6">
      <div className="flex flex-col gap-16">
        {features.map((feature, index) => (
          <StackedFeature key={feature.id} feature={feature} index={index} />
        ))}
      </div>
    </div>
  );
}

function StackedFeature({ feature, index }: { feature: FeatureScene; index: number }) {
  const reduce = useReducedMotion() ?? false;
  // Each card is frozen at the moment its own product state is fully forward
  // and the pointer has arrived — the same choreography, held still.
  const held = useMotionValue(
    feature.startProgress + (feature.endProgress - feature.startProgress) * 0.78,
  );

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <p className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.16em] text-gray-400 tabular-nums">
        {numberLabel(index)} / {TOTAL}
        <span aria-hidden className="h-px w-5 bg-gray-300" />
        <span className="tracking-[0.16em] uppercase" style={{ color: ACCENT }}>
          {feature.navLabel}
        </span>
      </p>
      <h3 className="font-hero mt-3 text-[26px] leading-[1.14] font-bold tracking-tight text-balance text-gray-900 sm:text-3xl">
        {feature.title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-pretty text-gray-500 sm:text-base">
        {feature.description}
      </p>

      <ProductStage
        className="mt-6"
        progress={held}
        reduceMotion={reduce}
        framing={feature.stacked}
      />
    </motion.div>
  );
}
