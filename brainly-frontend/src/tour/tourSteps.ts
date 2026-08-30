export interface TourStep {
  id: string;
  title: string;
  description: string;
  side?: "top" | "bottom" | "left" | "right";
  /** Only shown at >=768px (the dashboard's `md:` breakpoint). */
  desktopOnly?: boolean;
  /** Only shown below 768px. */
  mobileOnly?: boolean;
}

/** Ordered top-to-bottom, roughly matching how the eye scans the dashboard. */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "sidebar-home",
    title: "Your brain, at a glance",
    description: "This takes you back to everything you've saved, from anywhere in the app.",
    side: "right",
    desktopOnly: true,
  },
  {
    id: "sidebar-all",
    title: "Everything you've saved",
    description: "Every note, link, and file lives here, unfiltered.",
    side: "right",
    desktopOnly: true,
  },
  {
    id: "sidebar-inbox",
    title: "Inbox",
    description: "New saves land here until you give them a tag or a collection.",
    side: "right",
    desktopOnly: true,
  },
  {
    id: "sidebar-collections",
    title: "Collections",
    description: "Group related saves together. Add as many as you like with \"New collection\".",
    side: "right",
    desktopOnly: true,
  },
  {
    id: "sidebar-tags",
    title: "Tags",
    description: "A quicker way to filter across collections. Click any tag to jump to it.",
    side: "right",
    desktopOnly: true,
  },
  {
    id: "sidebar-account",
    title: "Your account",
    description: "Manage your profile, appearance, and settings from here.",
    side: "top",
    desktopOnly: true,
  },
  {
    id: "dashboard-settings-mobile",
    title: "Your account",
    description: "Manage your profile, appearance, and settings from here.",
    side: "bottom",
    mobileOnly: true,
  },
  {
    id: "dashboard-search",
    title: "Search everything",
    description: "Find a note by title, content, or tag. Press ⌘K to jump here from anywhere.",
    side: "bottom",
  },
  {
    id: "dashboard-add",
    title: "Add something new",
    description: "Save a link, note, or file to your brain.",
    side: "bottom",
    desktopOnly: true,
  },
  {
    id: "dashboard-fab",
    title: "Add something new",
    description: "Save a link, note, or file to your brain.",
    side: "left",
    mobileOnly: true,
  },
  {
    id: "dashboard-share",
    title: "Share your brain",
    description: "Generate a link so someone else can browse your saves.",
    side: "bottom",
    desktopOnly: true,
  },
  {
    id: "dashboard-filters",
    title: "Filter by type",
    description: "Narrow the view to videos, tweets, LinkedIn posts, or docs.",
    side: "bottom",
  },
  {
    id: "dashboard-view-toggle",
    title: "Sort and view",
    description: "Change the sort order or switch between grid and list view.",
    side: "bottom",
  },
  {
    id: "dashboard-cards",
    title: "Your saves",
    description: "Everything matching your filters shows up here. Click a card to open it.",
    side: "top",
  },
  {
    id: "dashboard-bottom-nav",
    title: "Quick navigation",
    description: "Jump between your saves, inbox, and content types.",
    side: "top",
    mobileOnly: true,
  },
];

/** Builds the step list for the current viewport, dropping mismatched steps. */
export const getStepsForViewport = (): TourStep[] => {
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  return TOUR_STEPS.filter((step) => {
    if (step.desktopOnly) return isDesktop;
    if (step.mobileOnly) return !isDesktop;
    return true;
  });
};
