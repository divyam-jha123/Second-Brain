import { useEffect, useLayoutEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import {
  cameraAt,
  cursorAt,
  overlayIds,
  overlayPresenceAt,
  overlayShiftAt,
  pressAt,
  recedeAt,
  rippleAt,
  DASHBOARD_ALT,
  DASHBOARD_ASPECT,
  DASHBOARD_IMAGE,
  DESIGN_H,
  DESIGN_W,
  stackedOrigin,
  type AnchorMap,
  type StackedFraming,
} from "./features.data";
import { DigestScene, RevisitScene, SearchScene, ShareScene } from "./TourScenes";

/** The DOM-built product states, keyed by the ids the choreography uses. */
const SCENES = {
  digest: DigestScene,
  revisit: RevisitScene,
  share: ShareScene,
  search: SearchScene,
} as const;

/**
 * The product stage: one screenshot under a virtual camera, four DOM-built
 * product states that come forward over it, and a pointer that leads the eye.
 *
 * Nothing here re-renders while you scroll. Every animated value is a
 * MotionValue derived from one scroll progress value, and the pure choreography
 * functions in features.data.ts are the single source of truth for all of them —
 * which is why the pointer can point at a button inside a moving, zooming
 * screenshot and stay exactly on it.
 *
 * MEASURING THE POINTER'S TARGETS
 * -------------------------------
 * Overlay panels live in a fixed 1000 x 563 canvas that is uniformly scaled to
 * the stage, so their anchors are measured once in *canvas* pixels by walking
 * `offsetLeft` / `offsetTop` — a read that transforms and animations cannot
 * disturb, unlike `getBoundingClientRect`. Canvas pixels convert to stage
 * percentages by a constant, so a resize needs no re-measure at all.
 */

const ACCENT = "#774CFF";

/** Position of an element inside the design canvas, in canvas pixels. */
function offsetWithin(element: HTMLElement, root: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = element;
  while (node && node !== root) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x: x + element.offsetWidth / 2, y: y + element.offsetHeight / 2 };
}

interface Props {
  /** 0 → 1 across the whole pinned section. */
  progress: MotionValue<number>;
  reduceMotion?: boolean;
  /**
   * Push the whole composition in around a point, in stage percentages. Used by
   * the stacked layout, where the stage is small enough that the surrounding
   * dashboard is better cropped away than shrunk.
   */
  framing?: StackedFraming;
  className?: string;
}

export function ProductStage({
  progress,
  reduceMotion = false,
  framing,
  className = "",
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const anchorsRef = useRef<AnchorMap>({});
  const sizeRef = useRef({ width: 0, height: 0 });
  /** Bumped after a measure so the pointer transforms recompute off-scroll. */
  const layout = useMotionValue(0);

  // Keep the design canvas scaled to the stage. Written straight to the node so
  // a resize never costs a React render.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const fit = () => {
      const { width, height } = stage.getBoundingClientRect();
      sizeRef.current = { width, height };
      canvas.style.transform = `scale(${width / DESIGN_W})`;
      layout.set(layout.get() + 1);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [layout]);

  // Measure the pointer's targets once the panels have their final layout.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const measure = () => {
      const map: AnchorMap = {};
      canvas.querySelectorAll<HTMLElement>("[data-tour-anchor]").forEach((element) => {
        const key = element.dataset.tourAnchor;
        if (!key) return;
        const point = offsetWithin(element, canvas);
        map[key] = {
          x: (point.x / DESIGN_W) * 100,
          y: (point.y / DESIGN_H) * 100,
        };
      });
      anchorsRef.current = map;
      layout.set(layout.get() + 1);
    };

    measure();
    // Webfonts land after first paint and shift text-driven rows a few pixels.
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [layout]);

  /* ---------------------------------------------------------------- camera */

  const camX = useTransform(() => `${cameraAt(progress.get()).x}%`);
  const camY = useTransform(() => `${cameraAt(progress.get()).y}%`);
  const camScale = useTransform(() => cameraAt(progress.get()).scale);

  const recede = useTransform(() => recedeAt(progress.get()));
  const baseScale = useTransform(recede, (value) => 1 - value * 0.035);
  const scrimOpacity = useTransform(recede, (value) => value * 0.72);

  /* --------------------------------------------------------------- pointer */

  const pointerX = useTransform(() => {
    layout.get();
    return (cursorAt(progress.get(), anchorsRef.current).x / 100) * sizeRef.current.width;
  });
  const pointerY = useTransform(() => {
    layout.get();
    return (cursorAt(progress.get(), anchorsRef.current).y / 100) * sizeRef.current.height;
  });

  const press = useTransform(() => pressAt(progress.get()));
  const pointerScale = useTransform(press, (value) => 1 - value * 0.18);
  const ripple = useTransform(() => rippleAt(progress.get()));
  const rippleScale = useTransform(ripple, [0, 1], [0.3, 2.1]);
  const rippleOpacity = useTransform(ripple, [0, 0.15, 1], [0, 0.45, 0]);
  // The pointer only exists once the section is genuinely in play.
  const pointerOpacity = useTransform(progress, [0, 0.012, 0.985, 1], [0, 1, 1, 0]);

  const showPointer = !reduceMotion;

  return (
    <div
      ref={stageRef}
      className={`relative isolate w-full overflow-hidden rounded-[26px] border border-black/[0.07] bg-white shadow-[0_2px_6px_rgba(16,12,40,0.05),0_40px_90px_-40px_rgba(16,12,40,0.35)] ${className}`}
      style={{ aspectRatio: DASHBOARD_ASPECT }}
    >
      {/*
        Everything the tour draws — screenshot, product states and pointer —
        shares this frame, so the stacked layout can push in on all of it at
        once without any of the three drifting apart.
      */}
      <div
        className="absolute inset-0"
        style={
          framing
            ? {
                transform: `scale(${framing.zoom})`,
                transformOrigin: (({ x, y }) => `${x}% ${y}%`)(stackedOrigin(framing)),
              }
            : undefined
        }
      >
      {/* The screenshot, under the camera. */}
      <motion.div className="absolute inset-0" style={{ scale: baseScale }}>
        <motion.div
          className="absolute inset-0 origin-top-left"
          style={
            reduceMotion
              ? undefined
              : { x: camX, y: camY, scale: camScale, willChange: "transform" }
          }
        >
          <img
            src={DASHBOARD_IMAGE}
            alt={DASHBOARD_ALT}
            draggable={false}
            className="h-full w-full select-none object-cover"
          />
        </motion.div>
      </motion.div>

      {/* Dimming so a product state that comes forward has somewhere to sit. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#0B0818] backdrop-blur-[3px]"
        style={{ opacity: scrimOpacity }}
      />

      {/* The product states, in their own fixed design canvas. */}
      <div
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 origin-top-left"
        style={{ width: DESIGN_W, height: DESIGN_H }}
      >
        {overlayIds.map((id) => (
          <OverlayLayer key={id} id={id} progress={progress} reduceMotion={reduceMotion} />
        ))}
      </div>

      {showPointer && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-20"
          style={{ x: pointerX, y: pointerY, opacity: pointerOpacity }}
        >
          {/* Ambient emphasis: a soft brand-tinted pool, never an outline. */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 260,
              height: 260,
              background: `radial-gradient(circle, ${ACCENT}22 0%, ${ACCENT}0d 42%, transparent 70%)`,
            }}
          />
          <motion.span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              width: 54,
              height: 54,
              borderColor: ACCENT,
              scale: rippleScale,
              opacity: rippleOpacity,
            }}
          />
          <motion.svg
            width="26"
            height="30"
            viewBox="0 0 26 30"
            fill="none"
            className="relative origin-top-left"
            style={{
              // The path's tip sits at (3, 2.2); pull it onto the target point.
              marginLeft: -3,
              marginTop: -2,
              scale: pointerScale,
              filter: "drop-shadow(0 4px 10px rgba(16,12,40,0.35))",
            }}
          >
            <path
              d="M3 2.2 L3 22.6 L8.4 17.6 L11.9 25.9 L15.7 24.3 L12.3 16.2 L19.4 15.9 Z"
              fill="#17141F"
              stroke="#FFFFFF"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </motion.svg>
        </motion.div>
      )}

      </div>

      {/* Hairline inner edge so the stage reads as glass, not a raw image. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-black/[0.06] ring-inset"
      />
    </div>
  );
}

function OverlayLayer({
  id,
  progress,
  reduceMotion,
}: {
  id: keyof typeof SCENES;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  const Scene = SCENES[id];
  const presence = useTransform(() => overlayPresenceAt(id, progress.get()));
  const shift = useTransform(() =>
    reduceMotion ? 0 : overlayShiftAt(id, progress.get()) * 26,
  );
  const scale = useTransform(presence, [0, 1], reduceMotion ? [1, 1] : [0.975, 1]);

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity: presence, y: shift, scale, willChange: "transform, opacity" }}
    >
      <Scene />
    </motion.div>
  );
}
