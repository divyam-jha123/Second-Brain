/** Device-local preferences. Nothing here is worth a round trip to the server. */

export type ViewMode = "grid" | "list";

const DEFAULT_VIEW_KEY = "brain-expo-default-view";

export const readDefaultView = (): ViewMode => {
  try {
    return localStorage.getItem(DEFAULT_VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    // Private mode / blocked storage — fall through to the default.
    return "grid";
  }
};

export const writeDefaultView = (mode: ViewMode) => {
  try {
    localStorage.setItem(DEFAULT_VIEW_KEY, mode);
  } catch {
    // Nothing to do: the choice just won't survive a reload.
  }
};
