import type { CSSProperties } from "react";
import type { ViewMode } from "../lib/prefs";

/**
 * Placeholders for data that is still in flight. Each one mirrors the geometry
 * of the component it stands in for, so the real content lands in the space
 * already reserved for it instead of shoving the page around.
 *
 * `--skeleton-delay` offsets the sweep per item; a list therefore reads as a
 * single wave passing through it rather than as N blocks blinking at once.
 */
const delay = (index: number): CSSProperties =>
  ({ "--skeleton-delay": `${index * 0.09}s` }) as CSSProperties;

/** A placeholder bar. The caller owns the radius so an icon slot can stay a
 *  rounded square while a line of text is a full pill. */
const Bar = ({
  className = "",
  index = 0,
}: {
  className?: string;
  index?: number;
}) => (
  <span aria-hidden style={delay(index)} className={`skeleton block ${className}`} />
);

// Small variations keep six identical cards from looking like a printed grid.
const TITLE_WIDTHS = ["w-[88%]", "w-[76%]", "w-[93%]"];
const NOTE_WIDTHS = ["w-[58%]", "w-[68%]", "w-[46%]"];

const CardSkeleton = ({ index = 0 }: { index?: number }) => (
  <article
    aria-hidden
    className="flex flex-col overflow-hidden rounded-xl border border-line bg-card p-3"
  >
    <span
      style={delay(index)}
      className="skeleton block h-40 w-full rounded-lg"
    />

    <div className="flex flex-1 flex-col gap-2.5 px-1 pt-4">
      <Bar index={index} className={`h-3 rounded-full ${TITLE_WIDTHS[index % 3]}`} />
      <Bar index={index} className={`h-3 rounded-full ${NOTE_WIDTHS[index % 3]}`} />
      <Bar index={index} className="mt-1 h-5 w-16 rounded-full" />

      <div className="mt-auto flex items-center gap-2 pt-3">
        <Bar index={index} className="h-4 w-4 shrink-0 rounded-full" />
        <Bar index={index} className="h-2.5 w-32 rounded-full" />
      </div>
    </div>
  </article>
);

const RowSkeleton = ({ index = 0 }: { index?: number }) => (
  <article
    aria-hidden
    className="flex gap-4 rounded-xl border border-line bg-card p-3"
  >
    <span
      style={delay(index)}
      className="skeleton block h-24 w-40 shrink-0 rounded-lg"
    />
    <div className="flex flex-1 flex-col gap-2.5 py-1">
      <Bar index={index} className={`h-3 rounded-full ${TITLE_WIDTHS[index % 3]}`} />
      <Bar index={index} className={`h-3 rounded-full ${NOTE_WIDTHS[index % 3]}`} />
      <div className="mt-auto flex items-center gap-2">
        <Bar index={index} className="h-4 w-4 shrink-0 rounded-full" />
        <Bar index={index} className="h-2.5 w-32 rounded-full" />
      </div>
    </div>
  </article>
);

/** The card grid while notes are loading. Mirrors the real grid's columns. */
export const NotesSkeleton = ({
  viewMode = "grid",
  count = 6,
}: {
  viewMode?: ViewMode;
  count?: number;
}) => (
  <div
    role="status"
    aria-busy="true"
    aria-live="polite"
    className={
      viewMode === "grid"
        ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        : "flex flex-col gap-4"
    }
  >
    <span className="sr-only">Loading your saves…</span>
    {Array.from({ length: count }, (_, i) =>
      viewMode === "grid" ? (
        <CardSkeleton key={i} index={i} />
      ) : (
        <RowSkeleton key={i} index={i} />
      ),
    )}
  </div>
);

// Collection names are short and uneven; equal-width bars would read as a
// table rather than as a list of names.
const COLLECTION_WIDTHS = ["w-20", "w-28", "w-16", "w-24", "w-20"];

/** Sidebar collection rows, matched to NavItem's px-3 py-2 / gap-3 geometry. */
export const CollectionsSkeleton = () => (
  <div role="status" aria-busy="true" className="flex flex-col gap-0.5">
    <span className="sr-only">Loading collections…</span>
    {COLLECTION_WIDTHS.map((width, i) => (
      <div key={i} className="flex items-center gap-3 px-3 py-2.5">
        <Bar index={i} className="h-4 w-4 shrink-0 rounded-[5px]" />
        <Bar index={i} className={`h-3 rounded-full ${width}`} />
      </div>
    ))}
  </div>
);

const TAG_WIDTHS = ["w-14", "w-10", "w-16"];

/** Sidebar tag pills, so an unloaded library never claims "No tags yet". */
export const TagsSkeleton = () => (
  <div role="status" aria-busy="true" className="flex flex-wrap gap-1.5 px-3">
    <span className="sr-only">Loading tags…</span>
    {TAG_WIDTHS.map((width, i) => (
      <Bar key={i} index={i} className={`h-6 rounded-full ${width}`} />
    ))}
  </div>
);
