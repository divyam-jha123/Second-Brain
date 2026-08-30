# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: **anyone drowning in bookmarks** — the general web reader whose saved
tabs, links and read-it-later items pile up unread and are effectively lost the
moment the tab closes. They are not running a formal research process and will not
maintain a filing system; the product has to work for someone who saves
impulsively and returns unpredictably.

Situation of use: mid-browse (save without breaking flow, often via the Chrome
extension), and later — days to months on — trying to retrieve something they only
half-remember.

## Product Purpose

Brain Expo is a second brain for the web: a personal library where every link,
tweet, YouTube video, PDF and note is stored in one place, tagged and indexed
automatically, and retrievable long after the user forgot they saved it.

Success is not volume saved. Success is the saved item coming back — either found
on demand from a half-memory, or resurfaced by email without the user going
looking.

## Positioning

The differentiator is **the return trip, delivered by email**. Competing tools
(Raindrop, Pocket, Notion, mymind) end at capture and storage; Brain Expo pushes
the library back to the user. A scheduled digest email reports what they saved and
what needs their attention, so a saved-and-forgotten pile becomes something they
actually come back to. Storage is table stakes; the outbound loop is the claim.

Note: "what is on your priority" is currently expressed through digest sections
(recent saves, untagged nudges, recall questions) and per-user scheduling — not
through a ranking or importance model. Any future surface may claim the resurfacing
loop, but must not imply automated prioritization that does not yet exist. Whether
to build real prioritization is an open product decision.

## Operating Context

- **Capture:** Chrome extension (Manifest V3) clips the current tab in one click;
  items can also be created directly in the web app.
- **Library:** dashboard with a card grid, sidebar navigation, search, tags and
  collections; light and dark themes with a system-following preference.
- **Retrieval:** tag and text search over the whole library.
- **Sharing:** any slice — everything, one collection, one tag, or a hand-picked
  set of items — publishes as a scoped public link that is revocable (revoking is a
  soft delete, so a killed hash is never reissued).
- **Resurfacing:** a weekly digest email, per-user day/hour/timezone, with
  independently toggleable sections; one-click signed unsubscribe that works
  without a session.
- **Onboarding:** first-run topic selection.

## Capabilities and Constraints

Confirmed functionality: notes/items (title, content or URL, user annotation, tags,
optional collection, derived source domain); collections; tags with counts, rename
(merging on collision) and delete; scoped revocable share links; email preferences
and digest scheduling; admin email surface; unsubscribe page.

Terminology used in product and code: **note/item**, **collection**, **tag**,
**share link**, **digest**.

Technical constraints future design must respect:

- Monorepo with three deployables: `brainly-frontend/` (React 19, Vite, TypeScript,
  Tailwind CSS v4, React Router, Motion, Clerk), `brainly-backend/` (Node, Express
  5, TypeScript ESM, Mongoose/MongoDB, Clerk, Resend, node-cron),
  `brainly-extension/` (React 19, Vite, MV3).
- Auth is Clerk end to end; every protected route resolves the user from the
  session token only — a user id in a request body is never trusted.
- Digest email HTML is hand-built for email clients (`brainly-backend/src/emails/`)
  and cannot use the web app's CSS.
- Landing-page product imagery comes from a real dashboard screenshot at
  `brainly-frontend/public/landing/brainexpo-dashboard.png`, driven by percentage
  coordinates in `src/components/landing/features.data.ts`.

Explicitly undecided: whether a true priority/importance model ships; pricing and
any commercial tier (none exists today).

## Brand Commitments

- Name: **Brain Expo**. Logo: `brainly-frontend/src/assets/brand/brain-expo-logo.svg`
  (plus `BrainExpoLogo.tsx`).
- Established tagline: *"Knowledge you actually use."*
- Support/contact domain: `brainexpo.me` (default support address
  `contact@brainexpo.me`).
- Voice, as written in the existing README and product copy: plain, concrete,
  second-person, unhyped — it names the real failure ("bookmarks pile up unread")
  rather than selling an abstraction. Preserve that register.
- Light and dark themes are both first-class; neither is an afterthought.

## Evidence on Hand

- **Real:** the working product itself, the dashboard screenshot at
  `brainly-frontend/public/landing/brainexpo-dashboard.png`, the Chrome extension,
  and the actual digest email.
- **Status:** live with a small group of early real users.
- **Absent — must never be fabricated:** user counts, growth or usage metrics,
  testimonials, quotes, customer or company logos, press mentions, ratings,
  funding, team size, and any pricing. No named customer may be invented, and no
  number may be stated for the user base until the user supplies one.

## Product Principles

1. **The return trip is the product.** Every surface should be judged by whether it
   helps a saved item come back, not by how much it helps a user save.
2. **Zero maintenance.** The user will never file, prune or curate. Structure must
   accrue on its own; anything that asks for upkeep is a design failure.
3. **Capture must not interrupt.** Saving happens mid-flow, from wherever the user
   already is, in one action.
4. **Half-memories are the real query.** Retrieval is designed for a vague,
   months-late recollection, not for a precise recall of a title.
5. **Sharing is scoped and revocable.** Publishing a slice is normal; losing control
   of it is not.

## Accessibility & Inclusion

No product-specific standard has been established with the user. Existing code
already carries ARIA attributes and honors `prefers-reduced-motion`; future work
must not regress that baseline.
