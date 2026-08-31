import type { CSSProperties, ReactNode } from "react";
import { DESIGN_H, DESIGN_W } from "./features.data";
import {
  LuCheck,
  LuChevronRight,
  LuCopy,
  LuLink,
  LuSearch,
} from "react-icons/lu";

/**
 * The DOM-built product states the tour brings forward over the screenshot.
 *
 * These are not decorative mock-ups: the digest reproduces what
 * `brainly-backend/src/emails/weeklyDigest.ts` actually sends (its headings, its
 * stat tiles, its recall block), and the share panel
 * reproduces `shareModal.tsx` (its four scopes, its copy, its helper line). The
 * tour is allowed to say only things the product already does.
 *
 * DESIGN SPACE
 * ------------
 * Every panel is laid out in a fixed 1000 x 563 canvas which <ProductStage />
 * scales to whatever the stage measures. Authoring in pixels against a constant
 * canvas is what keeps these panels proportional to the screenshot behind them
 * at any viewport, with no breakpoint work and no font-size juggling.
 *
 * Cursor targets are published as `data-tour-anchor` and measured by the stage,
 * so moving a panel moves the pointer with it.
 */

/** Literal light-theme values matching the app's semantic tokens. */
const T = {
  card: "#FFFFFF",
  surface: "#F8FAFC",
  line: "#CBD5E1",
  fg: "#0F172A",
  fgMuted: "#475569",
  fgSubtle: "#64748B",
  brand: "#2563EB",
  tag: "#EFF6FF",
  tagFg: "#2563EB",
} as const;

const PRIMARY_GRADIENT = "linear-gradient(90deg, #2563EB 0%, #3B82F6 55%, #60A5FA 100%)";

/** The digest keeps the real content while adopting this landing palette. */
const E = {
  pageBg: "#F8FAFC",
  tileBg: "#FFFFFF",
  border: "#CBD5E1",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  cta: "#2563EB",
  recallBg: "#EFF6FF",
  recallLabel: "#2563EB",
  recallText: "#0F172A",
} as const;

const TYPE_DOT = {
  video: "#EF4444",
  tweet: "#18181B",
  document: "#A1A1AA",
  podcast: "#7C3AED",
} as const;

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

/** A panel placed in the 1000 x 563 design canvas. */
function Panel({
  x,
  y,
  width,
  children,
  elevation = 1,
  style,
}: {
  x: number;
  y: number;
  width: number;
  children: ReactNode;
  /** 1 = resting on the stage, 2 = lifted in front of another panel. */
  elevation?: 1 | 2;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        borderRadius: 18,
        background: T.card,
        border: `1px solid ${T.line}`,
        boxShadow:
          elevation === 2
            ? "0 2px 4px rgba(15,23,42,0.04), 0 28px 60px -28px rgba(37,99,235,0.34)"
            : "0 1px 2px rgba(15,23,42,0.04), 0 18px 44px -24px rgba(15,23,42,0.18)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <p
    style={{
      margin: 0,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.09em",
      color: E.textMuted,
      textTransform: "uppercase",
    }}
  >
    {children}
  </p>
);

/* -------------------------------------------------------------------------- */
/* 02 — Remember: the weekly digest, and the schedule that sends it           */
/* -------------------------------------------------------------------------- */

const DIGEST_SAVES = [
  {
    title: "Building a personal AI workflow that saves hours",
    meta: "example.com · Tuesday",
    type: "document" as const,
  },
  {
    title: "Rust Crash Course for Beginners",
    meta: "youtube.com · Wednesday",
    type: "video" as const,
  },
  {
    title: "How indie founders ship consistently",
    meta: "Indie Hackers Journal · Friday",
    type: "podcast" as const,
  },
];

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: E.tileBg,
        border: `1px solid ${E.border}`,
        borderRadius: 10,
        padding: "9px 12px",
      }}
    >
      <p style={{ margin: 0, fontSize: 11, color: E.textSecondary }}>{label}</p>
      <p
        style={{
          margin: "3px 0 0",
          fontSize: 22,
          fontWeight: 600,
          color: E.textPrimary,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
    </div>
  );
}

export function DigestScene() {
  return (
    <>
      {/* The mail itself — chrome and copy as the backend actually sends it. */}
      <Panel x={84} y={20} width={452} style={{ background: E.pageBg, padding: 12 }}>
        <div
          style={{
            background: "#FFFFFF",
            border: `1px solid ${E.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
              borderBottom: `1px solid ${E.border}`,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: E.textPrimary,
                letterSpacing: "-0.01em",
              }}
            >
              Brain Expo
            </span>
            <span style={{ fontSize: 11, color: E.textMuted }}>18–24 Aug</span>
          </div>

          <div style={{ padding: "14px 18px 15px" }}>
            <p
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 600,
                color: E.textPrimary,
                letterSpacing: "-0.015em",
              }}
            >
              Your week, organized
            </p>
            <p
              style={{
                margin: "5px 0 12px",
                fontSize: 12.5,
                lineHeight: 1.55,
                color: E.textSecondary,
              }}
            >
              You saved 12 things. Here's what's worth a second look.
            </p>

            <div style={{ display: "flex", gap: 8, marginBottom: 13 }}>
              <StatTile label="Saved" value="12" />
              <StatTile label="Untagged" value="3" />
              <StatTile label="Total" value="428" />
            </div>

            <Label>This week's saves</Label>
            <div style={{ marginTop: 6 }}>
              {DIGEST_SAVES.map((save, index) => (
                <div
                  key={save.title}
                  data-tour-anchor={index === 1 ? "digest-item" : undefined}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "9px 0",
                    borderTop: `1px solid ${E.border}`,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 7,
                      marginTop: 5,
                      flexShrink: 0,
                      background: TYPE_DOT[save.type],
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12.5,
                        lineHeight: 1.4,
                        color: E.textPrimary,
                      }}
                    >
                      {save.title}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: E.textMuted }}>
                      {save.meta}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 12,
                background: E.recallBg,
                borderRadius: 10,
                padding: "12px 15px",
              }}
            >
              <p
                style={{
                  margin: "0 0 7px",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.09em",
                  color: E.recallLabel,
                  textTransform: "uppercase",
                }}
              >
                Do you still remember
              </p>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: E.recallText }}>
                What was the one thing the Rust course said to build first?
              </p>
            </div>
          </div>
        </div>
      </Panel>

      {/* The schedule behind it — the real Weekly email settings row. */}
      <Panel x={524} y={168} width={404} elevation={2} style={{ padding: "18px 20px 20px" }}>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: T.fg,
            letterSpacing: "-0.015em",
          }}
        >
          Weekly email
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.5, color: T.fgMuted }}>
          Brain Expo mails your saves back to you on a schedule you set.
        </p>

        <div
          data-tour-anchor="digest-toggle"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            paddingTop: 14,
            borderTop: `1px solid ${T.line}`,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>
            Send weekly email
          </span>
          <span
            style={{
              width: 38,
              height: 22,
              borderRadius: 22,
              background: T.brand,
              position: "relative",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: 19,
                width: 16,
                height: 16,
                borderRadius: 16,
                background: "#FFFFFF",
                boxShadow: "0 1px 2px rgba(15,23,42,0.3)",
              }}
            />
          </span>
        </div>

        <div
          data-tour-anchor="digest-schedule"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 12,
            padding: "11px 13px",
            borderRadius: 10,
            border: `1px solid ${T.line}`,
            background: T.surface,
          }}
        >
          <span style={{ fontSize: 12, color: T.fgMuted }}>Delivery</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: T.fg,
            }}
          >
            Every Monday, 9:00 am
            <LuChevronRight size={14} color={T.fgSubtle} strokeWidth={2} />
          </span>
        </div>

        <div style={{ marginTop: 14 }}>
          <Label>Include</Label>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["What you saved this week", true],
              ["Untagged inbox nudge", true],
              ["Recall questions", true],
            ].map(([text, on]) => (
              <span
                key={text as string}
                style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: T.fgMuted }}
              >
                <span
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: 5,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: on ? T.brand : "transparent",
                    border: on ? "none" : `1px solid ${T.line}`,
                  }}
                >
                  {on ? <LuCheck size={10} color="#fff" strokeWidth={3.2} /> : null}
                </span>
                {text as string}
              </span>
            ))}
          </div>
        </div>
      </Panel>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* 03 — Revisit: the mail hands you back to the save                          */
/* -------------------------------------------------------------------------- */

export function RevisitScene() {
  return (
    <>
      {/* Left: the line in the mail you tapped. */}
      <Panel x={84} y={150} width={356} style={{ background: E.pageBg, padding: 12 }}>
        <div
          style={{
            background: "#FFFFFF",
            border: `1px solid ${E.border}`,
            borderRadius: 12,
            padding: "14px 16px",
          }}
        >
          <Label>This week's saves</Label>
          <div style={{ marginTop: 8 }}>
            {DIGEST_SAVES.map((save, index) => {
              const isTarget = index === 2;
              return (
                <div
                  key={save.title}
                  data-tour-anchor={isTarget ? "revisit-row" : undefined}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "9px 10px",
                    margin: "0 -10px",
                    borderRadius: 8,
                    background: isTarget ? E.recallBg : "transparent",
                    opacity: isTarget ? 1 : 0.45,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 7,
                      marginTop: 5,
                      flexShrink: 0,
                      background: TYPE_DOT[save.type],
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.4, color: E.textPrimary }}>
                      {save.title}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: E.textMuted }}>
                      {save.meta}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* The hand-off itself. */}
      <svg
        aria-hidden
        width={DESIGN_W}
        height={DESIGN_H}
        viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <path
          d="M 424 353 C 474 353, 488 238, 540 238"
          fill="none"
          stroke={T.brand}
          strokeWidth={1.5}
          strokeDasharray="5 5"
          opacity={0.5}
        />
        <circle cx="540" cy="238" r="3" fill={T.brand} opacity={0.7} />
      </svg>

      {/* Right: the save itself, in the dashboard's own card language. */}
      <Panel
        x={548}
        y={96}
        width={332}
        elevation={2}
        style={{ overflow: "hidden" }}
      >
        <div data-tour-anchor="revisit-card">
          <div
            style={{
              position: "relative",
              height: 148,
              background: "linear-gradient(140deg, #F5F3EE 0%, #ECE7DC 100%)",
              padding: "14px 16px",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#FFFFFF",
                borderRadius: 7,
                padding: "4px 8px",
                fontSize: 10.5,
                fontWeight: 600,
                color: "#7C3AED",
                boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 6, background: "#7C3AED" }} />
              Podcast
            </span>
            <p
              style={{
                margin: "14px 0 0",
                fontSize: 19,
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                color: "#1C1917",
                maxWidth: 190,
              }}
            >
              Indie Hackers Journal
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "#78716C" }}>
              Episode 67 · 28:34
            </p>
          </div>

          <div style={{ padding: "14px 16px 15px" }}>
            <p
              style={{
                margin: 0,
                fontSize: 14.5,
                fontWeight: 700,
                lineHeight: 1.3,
                letterSpacing: "-0.015em",
                color: T.fg,
              }}
            >
              How indie founders ship consistently
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.5, color: T.fgMuted }}>
              Great insights on focus, shipping, and sustainable growth.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 11 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "3px 9px",
                  borderRadius: 999,
                  background: T.tag,
                  color: T.tagFg,
                }}
              >
                growth
              </span>
              <span style={{ fontSize: 11, color: T.fgSubtle }}>Saved 2 months ago</span>
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* 04 — Share: the real share modal                                           */
/* -------------------------------------------------------------------------- */

const SCOPES = [
  { label: "Everything", hint: "Your whole Brain Expo" },
  { label: "A collection", hint: "One folder of saves" },
  { label: "A tag", hint: "Everything with one tag" },
  { label: "Specific items", hint: "Hand-pick what goes out" },
];

export function ShareScene() {
  return (
    <Panel x={292} y={54} width={416} elevation={2} style={{ padding: "20px 22px 22px" }}>
      <p
        style={{
          margin: 0,
          fontSize: 17,
          fontWeight: 700,
          color: T.fg,
          letterSpacing: "-0.02em",
        }}
      >
        What do you want to share?
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginTop: 14,
        }}
      >
        {SCOPES.map((scope, index) => {
          const selected = index === 0;
          return (
            <div
              key={scope.label}
              data-tour-anchor={selected ? "share-scope" : undefined}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                textAlign: "left",
                border: selected ? `1px solid ${T.brand}` : `1px solid ${T.line}`,
                background: selected ? "#EFF6FF" : T.card,
              }}
            >
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: T.fg }}>
                {scope.label}
              </span>
              <span style={{ display: "block", fontSize: 11, color: T.fgSubtle, marginTop: 2 }}>
                {scope.hint}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ margin: "14px 0 0", fontSize: 12, lineHeight: 1.55, color: T.fgMuted }}>
        Anything you later add to your Brain Expo will appear here too.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 14,
          padding: "9px 10px 9px 12px",
          borderRadius: 10,
          border: `1px solid ${T.line}`,
          background: T.surface,
        }}
      >
        <LuLink size={14} color={T.fgSubtle} strokeWidth={2} />
        <span
          style={{
            flex: 1,
            fontSize: 12.5,
            color: T.fgMuted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          brainexpo.me/share/8f3ca41d
        </span>
        <span
          data-tour-anchor="share-copy"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            borderRadius: 8,
            background: PRIMARY_GRADIENT,
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <LuCopy size={12} strokeWidth={2.2} />
          Copy link
        </span>
      </div>

      <p style={{ margin: "12px 0 0", fontSize: 11.5, color: T.fgSubtle }}>
        Revoke it whenever you want — a revoked link is never reissued.
      </p>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/* 05 — Find: search across everything                                        */
/* -------------------------------------------------------------------------- */

const RESULTS = [
  {
    title: "Design systems that scale",
    meta: "design-systems.io · PDF",
    tag: "design",
    dot: TYPE_DOT.document,
  },
  {
    title: "Building a personal AI workflow that saves hours",
    meta: "example.com · Article",
    tag: "productivity",
    dot: "#0EA5E9",
  },
  {
    title: "The future of clean energy innovation",
    meta: "cleanenergy.org · Article",
    tag: "research",
    dot: "#10B981",
  },
];

export function SearchScene() {
  return (
    <Panel x={168} y={92} width={664} elevation={2} style={{ overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "15px 18px",
          borderBottom: `1px solid ${T.line}`,
        }}
      >
        <LuSearch size={16} color={T.fgSubtle} strokeWidth={2} />
        <span style={{ fontSize: 15, color: T.fg, letterSpacing: "-0.01em" }}>
          design systems
        </span>
        <span
          style={{
            width: 1.5,
            height: 17,
            background: T.brand,
            borderRadius: 2,
            marginLeft: -6,
          }}
        />
        <span style={{ marginLeft: "auto", fontSize: 11, color: T.fgSubtle }}>
          3 of 428 saves
        </span>
      </div>

      <div style={{ padding: "8px 10px 10px" }}>
        {RESULTS.map((result, index) => (
          <div
            key={result.title}
            data-tour-anchor={index === 0 ? "search-result" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "10px 12px",
              borderRadius: 10,
              background: index === 0 ? T.surface : "transparent",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 7,
                flexShrink: 0,
                background: result.dot,
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.fg,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {result.title}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: T.fgSubtle }}>
                {result.meta}
              </p>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: "3px 9px",
                borderRadius: 999,
                background: T.tag,
                color: T.tagFg,
                flexShrink: 0,
              }}
            >
              {result.tag}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          borderTop: `1px solid ${T.line}`,
          background: T.surface,
          fontSize: 11.5,
          color: T.fgMuted,
        }}
      >
        Found in
        <span
          style={{
            padding: "3px 9px",
            borderRadius: 999,
            background: T.card,
            border: `1px solid ${T.line}`,
            fontWeight: 500,
            color: T.fg,
          }}
        >
          Design
        </span>
        <span
          style={{
            padding: "3px 9px",
            borderRadius: 999,
            background: T.card,
            border: `1px solid ${T.line}`,
            fontWeight: 500,
            color: T.fg,
          }}
        >
          Reading List
        </span>
      </div>
    </Panel>
  );
}
