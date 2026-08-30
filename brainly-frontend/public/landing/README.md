# Landing-page assets

`brainexpo-dashboard.png` — the full-resolution Brain Expo dashboard screenshot
used by the scrollytelling product tour (`src/components/landing/`).

Drop the screenshot here with exactly that filename. The tour flies a virtual
camera around it using percentage coordinates, so any resolution works, but the
focus values in `features.data.ts` are tuned for the light-theme dashboard at
roughly 1664 x 941 (sidebar on the left, search bar across the top, card grid
filling the rest). If you swap in a screenshot with a different aspect ratio,
update `DASHBOARD_ASPECT` in `features.data.ts` to match.
