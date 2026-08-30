/**
 * Content + choreography for the <FeaturesScrollytelling /> product tour.
 *
 * Everything here is data — the copy on the left, and the camera / cursor /
 * overlay choreography on the right — so the tour can be re-timed without
 * touching a line of motion code.
 *
 * THREE COORDINATE SPACES
 * -----------------------
 * 1. Global progress (0 → 1) across the whole pinned section. Each feature owns
 *    a slice of it; the slices are deliberately uneven because "Remember" is the
 *    argument the section exists to make and needs room to land.
 * 2. Image space — percentages of the dashboard screenshot. Camera focus points
 *    and any cursor target that points at real product chrome live here, so they
 *    stay correct at every zoom level and every stage size.
 * 3. Stage space — percentages of the visible media frame. Cursor targets inside
 *    the DOM-built product states (digest, share, search) live here and are
 *    resolved at runtime by measuring `[data-tour-anchor]` elements, so they
 *    follow the panels wherever the layout puts them.
 *
 * There is no highlight rectangle. Emphasis comes from where the camera looks,
 * where the cursor goes, and what the stage chooses to bring forward.
 */

export interface FeatureFocus {
  /** % from the left of the screenshot. */
  x: number;
  /** % from the top of the screenshot. */
  y: number;
  /** Camera zoom. 1 = the whole screenshot fits the frame. */
  scale: number;
}

/** Small-screen framing: how far to push in, and on what. */
export interface StackedFraming {
  zoom: number;
  /** % across the stage that should end up centred. */
  focusX: number;
  /** % down the stage that should end up centred. */
  focusY: number;
}

/** A DOM-built product state that comes forward over the screenshot. */
export type OverlayId = "digest" | "revisit" | "share" | "search";

export interface CameraKey {
  /** Position within the feature's own slice, 0 → 1. */
  at: number;
  focus: FeatureFocus;
}

export type CursorKey = {
  /** Position within the feature's own slice, 0 → 1. */
  at: number;
  action?: "click";
} & (
  | { space: "image"; x: number; y: number }
  | { space: "stage"; anchor: string }
);

export interface FeatureScene {
  id: string;
  /** Short name in the numbered navigation. */
  navLabel: string;
  title: string;
  description: string;
  /** Slice of global scroll progress this feature owns. */
  startProgress: number;
  endProgress: number;
  camera: CameraKey[];
  cursor: CursorKey[];
  /** Optional DOM product state, with fade-in/out as fractions of the slice. */
  overlay?: { scene: OverlayId; in: number; out: number };
  /**
   * Stacked (small-screen) framing. The stage is a fraction of its desktop size
   * there, so the whole composition is pushed in around the part of the scene
   * that carries this step — the surrounding dashboard crops away rather than
   * shrinking everything into illegibility. `focus` is the point, in stage
   * percentages, that should end up in the middle of the frame.
   */
  stacked: StackedFraming;
}

/**
 * The fixed canvas the DOM-built product states are authored in. <ProductStage />
 * scales it to whatever the stage measures, which is what keeps those panels
 * proportional to the screenshot behind them at every viewport.
 */
export const DESIGN_W = 1000;
export const DESIGN_H = 563;

/** The base product screenshot the stage always holds. */
export const DASHBOARD_IMAGE = "/landing/brainexpo-dashboard.png";
export const DASHBOARD_ALT =
  "The Brain Expo dashboard: a sidebar of collections and tags, a search bar, and a grid of saved articles, videos, podcasts, PDFs, tweets and notes.";
/** Intrinsic aspect ratio of the screenshot above — the stage follows it exactly. */
export const DASHBOARD_ASPECT = 1672 / 941;

/**
 * Landmarks in the real screenshot, in image space. Named once here so the
 * choreography reads as intent ("move to the Add button") instead of numbers.
 */
const UI = {
  addButton: { x: 90.3, y: 6.4 },
  shareButton: { x: 95.8, y: 6.4 },
  searchField: { x: 38, y: 6.4 },
  firstCard: { x: 29.5, y: 41 },
  podcastCard: { x: 68, y: 40 },
  cardGrid: { x: 57, y: 48 },
} as const;

export const features: FeatureScene[] = [
  {
    id: "capture",
    stacked: { zoom: 1.18, focusX: 52, focusY: 42 },
    navLabel: "Capture",
    title: "Save anything worth remembering.",
    description:
      "Articles, YouTube videos, PDFs, tweets, podcasts, notes and links — keep everything you discover in one place.",
    startProgress: 0,
    endProgress: 0.16,
    camera: [
      { at: 0, focus: { x: 56, y: 42, scale: 1.02 } },
      { at: 0.55, focus: { x: 58, y: 30, scale: 1.14 } },
      { at: 1, focus: { x: 52, y: 34, scale: 1.12 } },
    ],
    cursor: [
      { at: 0.05, space: "image", ...UI.cardGrid },
      { at: 0.48, space: "image", ...UI.addButton },
      { at: 0.58, space: "image", ...UI.addButton, action: "click" },
      { at: 1, space: "image", ...UI.firstCard },
    ],
  },
  {
    id: "remember",
    stacked: { zoom: 1.1, focusX: 48, focusY: 49 },
    navLabel: "Remember",
    title: "Never forget what you saved.",
    description:
      "Brain Expo brings your saved knowledge back through weekly or scheduled emails, so the ideas worth keeping don't disappear into a forgotten archive.",
    startProgress: 0.16,
    endProgress: 0.4,
    camera: [
      { at: 0, focus: { x: 52, y: 38, scale: 1.1 } },
      { at: 1, focus: { x: 50, y: 46, scale: 1.03 } },
    ],
    overlay: { scene: "digest", in: 0.04, out: 0.9 },
    cursor: [
      { at: 0.16, space: "stage", anchor: "digest-toggle" },
      { at: 0.34, space: "stage", anchor: "digest-schedule" },
      { at: 0.42, space: "stage", anchor: "digest-schedule", action: "click" },
      { at: 0.72, space: "stage", anchor: "digest-item" },
      { at: 1, space: "stage", anchor: "digest-item" },
    ],
  },
  {
    id: "revisit",
    stacked: { zoom: 1.15, focusX: 48, focusY: 45 },
    navLabel: "Revisit",
    title: "Turn saved knowledge back into useful knowledge.",
    description:
      "Return to the resources that earned their place, instead of letting them get buried under everything you saved after them.",
    startProgress: 0.4,
    endProgress: 0.6,
    camera: [
      { at: 0, focus: { x: 50, y: 46, scale: 1.04 } },
      { at: 1, focus: { x: 44, y: 44, scale: 1.08 } },
    ],
    overlay: { scene: "revisit", in: 0.06, out: 0.9 },
    cursor: [
      { at: 0.12, space: "stage", anchor: "revisit-row" },
      { at: 0.34, space: "stage", anchor: "revisit-row", action: "click" },
      { at: 0.72, space: "stage", anchor: "revisit-card" },
      { at: 1, space: "stage", anchor: "revisit-card" },
    ],
  },
  {
    id: "share",
    stacked: { zoom: 1.42, focusX: 50, focusY: 40 },
    navLabel: "Share",
    title: "Share your Brain with anyone.",
    description:
      "Publish a collection, a tag, or a hand-picked set of saves as one link. Scoped to exactly what you chose, and revocable the moment you change your mind.",
    startProgress: 0.6,
    endProgress: 0.8,
    camera: [
      { at: 0, focus: { x: 82, y: 24, scale: 1.34 } },
      { at: 0.34, focus: { x: 78, y: 28, scale: 1.28 } },
      { at: 0.55, focus: { x: 58, y: 42, scale: 1.06 } },
      { at: 1, focus: { x: 56, y: 44, scale: 1.06 } },
    ],
    overlay: { scene: "share", in: 0.36, out: 0.92 },
    cursor: [
      { at: 0.08, space: "image", ...UI.shareButton },
      { at: 0.24, space: "image", ...UI.shareButton, action: "click" },
      { at: 0.62, space: "stage", anchor: "share-scope" },
      { at: 0.84, space: "stage", anchor: "share-copy", action: "click" },
      { at: 1, space: "stage", anchor: "share-copy" },
    ],
  },
  {
    id: "find",
    stacked: { zoom: 1.35, focusX: 50, focusY: 42 },
    navLabel: "Find",
    title: "Find the idea you remember.",
    description:
      "Search titles, notes, tags and links, then keep it all in shape with collections and tags that match how you already think.",
    startProgress: 0.8,
    endProgress: 1,
    camera: [
      { at: 0, focus: { x: 48, y: 16, scale: 1.26 } },
      { at: 0.6, focus: { x: 48, y: 20, scale: 1.2 } },
      { at: 0.86, focus: { x: 50, y: 50, scale: 1 } },
      { at: 1, focus: { x: 50, y: 50, scale: 1 } },
    ],
    overlay: { scene: "search", in: 0.14, out: 0.78 },
    cursor: [
      { at: 0.06, space: "image", ...UI.searchField },
      { at: 0.16, space: "image", ...UI.searchField, action: "click" },
      { at: 0.5, space: "stage", anchor: "search-result" },
      { at: 0.8, space: "image", ...UI.podcastCard },
      { at: 1, space: "image", ...UI.cardGrid },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Choreography maths                                                         */
/* -------------------------------------------------------------------------- */

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Ease-in-out used for every travel between two keys — pointers accelerate. */
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Where in the section a feature sits, and how far into it we are. */
export function featureIndexAt(progress: number): number {
  for (let i = features.length - 1; i >= 0; i -= 1) {
    if (progress >= features[i].startProgress) return i;
  }
  return 0;
}

/** Converts a feature-local `at` to global section progress. */
const toGlobal = (feature: FeatureScene, at: number) =>
  feature.startProgress +
  at * (feature.endProgress - feature.startProgress);

/**
 * Camera solution for a focus point: where to translate the image (in % of the
 * frame) so the focus point lands in the middle.
 *
 * With `transform-origin: top left`, a point at `focus.x`% of the image lands at
 * `x + scale * focus.x` percent of the frame. Solving for the centre gives
 * `x = 50 - scale * focus.x`, clamped to `[100 * (1 - scale), 0]` — the exact
 * range in which the image still covers the frame, which is what guarantees a
 * blank gutter is never revealed.
 */
export function solveCamera({ x: focusX, y: focusY, scale }: FeatureFocus) {
  const min = 100 * (1 - scale);
  return {
    x: clamp(50 - scale * focusX, min, 0),
    y: clamp(50 - scale * focusY, min, 0),
    scale,
  };
}

/** Flattened camera keys in global progress, built once at module load. */
const cameraTrack: { at: number; focus: FeatureFocus }[] = features
  .flatMap((feature) =>
    feature.camera.map((key) => ({
      at: toGlobal(feature, key.at),
      focus: key.focus,
    })),
  )
  .sort((a, b) => a.at - b.at);

/**
 * The camera at any point in the section. Focus is interpolated first and only
 * then solved, so the framing glides instead of snapping between clamped ends.
 */
export function cameraAt(progress: number) {
  const p = clamp(progress, 0, 1);
  const next = cameraTrack.findIndex((key) => key.at >= p);
  if (next === -1) return solveCamera(cameraTrack[cameraTrack.length - 1].focus);
  if (next === 0) return solveCamera(cameraTrack[0].focus);

  const a = cameraTrack[next - 1];
  const b = cameraTrack[next];
  const t = b.at === a.at ? 1 : smooth((p - a.at) / (b.at - a.at));
  return solveCamera({
    x: lerp(a.focus.x, b.focus.x, t),
    y: lerp(a.focus.y, b.focus.y, t),
    scale: lerp(a.focus.scale, b.focus.scale, t),
  });
}

type ResolvedCursorKey = {
  at: number;
  action?: "click";
} & ({ space: "image"; x: number; y: number } | { space: "stage"; anchor: string });

/** Flattened cursor keys in global progress. */
const cursorTrack: ResolvedCursorKey[] = features
  .flatMap((feature) =>
    feature.cursor.map((key) => ({ ...key, at: toGlobal(feature, key.at) })),
  )
  .sort((a, b) => a.at - b.at);

/** Stage-space anchors the overlays must publish, measured at runtime. */
export type AnchorMap = Record<string, { x: number; y: number } | undefined>;

const pointOf = (
  key: ResolvedCursorKey,
  camera: { x: number; y: number; scale: number },
  anchors: AnchorMap,
): { x: number; y: number } | null => {
  if (key.space === "image") {
    return {
      x: camera.x + camera.scale * key.x,
      y: camera.y + camera.scale * key.y,
    };
  }
  return anchors[key.anchor] ?? null;
};

/**
 * Cursor position in stage space at a given progress. Image-space targets are
 * projected through the *same* camera solution the stage is using at that exact
 * progress, so the pointer can never drift off the control it is pointing at.
 * A stage-space target that has not been measured yet holds the previous point
 * rather than snapping the cursor to the top-left corner.
 */
export function cursorAt(
  progress: number,
  anchors: AnchorMap,
): { x: number; y: number } {
  const p = clamp(progress, 0, 1);
  const camera = cameraAt(p);

  let next = cursorTrack.findIndex((key) => key.at >= p);
  if (next === -1) next = cursorTrack.length - 1;
  const a = cursorTrack[Math.max(next - 1, 0)];
  const b = cursorTrack[next];

  const pa = pointOf(a, camera, anchors);
  const pb = pointOf(b, camera, anchors);
  if (!pa && !pb) return { x: 50, y: 50 };
  if (!pa) return pb!;
  if (!pb) return pa;

  const t = b.at === a.at ? 1 : smooth(clamp((p - a.at) / (b.at - a.at), 0, 1));
  return { x: lerp(pa.x, pb.x, t), y: lerp(pa.y, pb.y, t) };
}

/** Global progress points where the pointer presses. */
export const clickPoints: number[] = cursorTrack
  .filter((key) => key.action === "click")
  .map((key) => key.at);

/** 0 → 1 press amount: a quick dip and release around each click point. */
export function pressAt(progress: number): number {
  const window = 0.012;
  let strongest = 0;
  for (const point of clickPoints) {
    const distance = Math.abs(progress - point);
    if (distance < window) {
      strongest = Math.max(strongest, 1 - distance / window);
    }
  }
  return strongest;
}

/** 0 → 1 ripple amount: starts at the click and expands just after it. */
export function rippleAt(progress: number): number {
  const window = 0.02;
  let strongest = 0;
  for (const point of clickPoints) {
    const delta = progress - point;
    if (delta >= 0 && delta < window) {
      strongest = Math.max(strongest, delta / window);
    }
  }
  return strongest;
}

const overlayWindows = features
  .filter((feature): feature is FeatureScene & { overlay: NonNullable<FeatureScene["overlay"]> } =>
    Boolean(feature.overlay),
  )
  .map((feature) => ({
    scene: feature.overlay.scene,
    in: toGlobal(feature, feature.overlay.in),
    out: toGlobal(feature, feature.overlay.out),
    fade: (feature.endProgress - feature.startProgress) * 0.14,
  }));

export const overlayIds = overlayWindows.map((window) => window.scene);

/** 0 → 1 presence of one overlay at a given progress. */
export function overlayPresenceAt(scene: OverlayId, progress: number): number {
  const window = overlayWindows.find((entry) => entry.scene === scene);
  if (!window) return 0;
  if (progress <= window.in - window.fade) return 0;
  if (progress >= window.out + window.fade) return 0;
  if (progress < window.in) return smooth((progress - (window.in - window.fade)) / window.fade);
  if (progress > window.out) return smooth(1 - (progress - window.out) / window.fade);
  return 1;
}

/**
 * Which way an overlay should travel while it is not fully present: +1 before
 * its window (so it rises into place) and -1 after it (so it leaves upward),
 * scaled by how far from present it is.
 */
export function overlayShiftAt(scene: OverlayId, progress: number): number {
  const window = overlayWindows.find((entry) => entry.scene === scene);
  if (!window) return 0;
  const presence = overlayPresenceAt(scene, progress);
  if (presence >= 1) return 0;
  return (progress < window.in ? 1 : -1) * (1 - presence);
}

/** How far the screenshot should recede behind whichever overlay is forward. */
export function recedeAt(progress: number): number {
  return overlayIds.reduce(
    (strongest, scene) => Math.max(strongest, overlayPresenceAt(scene, progress)),
    0,
  );
}

/**
 * `transform-origin` that puts a stacked framing's focus point in the middle of
 * the frame. A point `p` maps to `origin + (p - origin) * zoom`; solving that
 * for 50 gives the origin below. Clamping it to [0, 100] is exactly the range
 * in which the pushed-in content still covers the frame, so no framing can
 * reveal an empty edge however it is tuned.
 */
export function stackedOrigin({ zoom, focusX, focusY }: StackedFraming) {
  if (zoom === 1) return { x: 50, y: 50 };
  const solve = (focus: number) => clamp((50 - focus * zoom) / (1 - zoom), 0, 100);
  return { x: solve(focusX), y: solve(focusY) };
}
