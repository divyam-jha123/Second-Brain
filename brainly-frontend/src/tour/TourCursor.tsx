interface TourCursorProps {
  target: { x: number; y: number } | null;
}

/** A fake cursor that glides to whatever the tour is highlighting next. */
export const TourCursor = ({ target }: TourCursorProps) => {
  if (!target) return null;

  return (
    <div
      className="tour-cursor"
      style={{ transform: `translate(${target.x}px, ${target.y}px)` }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 2.5 19.5 10 12.4 12.4 10 19.5 4 2.5Z"
          fill="var(--accent)"
          stroke="var(--bg)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
