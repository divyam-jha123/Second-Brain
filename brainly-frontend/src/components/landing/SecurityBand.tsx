import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LuLink, LuRotateCcw } from "react-icons/lu";

/**
 * What this band claims, it can demonstrate.
 *
 * It replaces a "GDPR & SOC-2 Ready / end-to-end encryption" panel that the
 * backend does not support — auth is Clerk, storage is Mongo via Mongoose, and
 * there is no E2E encryption anywhere in the codebase. Every sentence here maps
 * to something that is actually implemented:
 *
 *   • protected routes resolve the user from the Clerk session only, and never
 *     trust an id in a request body      → brainly-backend middlewares
 *   • revoking a share link is a soft delete, so a killed hash is never
 *     reissued                           → the Link model's revoke path
 *
 * And rather than asserting the second one, the panel lets you do it.
 */

const PRIMARY_GRADIENT = "linear-gradient(90deg, #2563EB 0%, #3B82F6 55%, #60A5FA 100%)";
const EASE = [0.22, 1, 0.36, 1] as const;

const HASH = "brainexpo.me/share/8f3ca41d";

export function SecurityBand() {
  const reduce = useReducedMotion() ?? false;
  const [revoked, setRevoked] = useState(false);

  return (
    <section id="security" className="scroll-mt-24 bg-white px-4 py-20 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 rounded-3xl border border-[#CBD5E1] bg-[#F8FAFC] p-8 text-[#0F172A] shadow-[0_20px_60px_-40px_rgba(37,99,235,0.26)] sm:p-12 md:flex-row">
        <div className="flex-1">
          <h2 className="font-hero text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            Your Brain stays yours
          </h2>
          <p className="mt-3 max-w-xl leading-relaxed text-[#475569]">
            Every protected route resolves you from your Clerk session — an id in
            a request body is never trusted. And anything you publish is scoped to
            exactly what you picked, and dies the moment you say so.
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#64748B]">
            Try it: revoking is a soft delete, so a killed address is never handed
            out again.
          </p>
        </div>

        {/* The mechanism, operable. */}
        <div className="w-full rounded-2xl border border-[#CBD5E1] bg-white p-5 md:w-[22rem]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold tracking-widest text-[#64748B] uppercase">
              Share link
            </span>
            <StatusPill revoked={revoked} reduce={reduce} />
          </div>

          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2.5">
            <LuLink
              size={14}
              strokeWidth={2}
              className={revoked ? "text-[#94A3B8]" : "text-[#64748B]"}
            />
            <span
              className={`relative truncate font-mono text-[12.5px] tabular-nums transition-colors duration-300 ${
                revoked ? "text-[#94A3B8]" : "text-[#475569]"
              }`}
            >
              {HASH}
              {/* The line that kills it, drawn rather than toggled. */}
              <motion.span
                aria-hidden
                className="absolute top-1/2 left-0 h-px w-full origin-left bg-[#94A3B8]"
                initial={false}
                animate={{ scaleX: revoked ? 1 : 0 }}
                transition={{ duration: reduce ? 0 : 0.4, ease: EASE }}
              />
            </span>
          </div>

          <button
            type="button"
            onClick={() => setRevoked((value) => !value)}
            className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
              revoked
                ? "border border-[#CBD5E1] bg-transparent text-[#475569] hover:border-[#94A3B8] hover:text-[#0F172A]"
                : "text-white hover:opacity-90"
            }`}
            style={revoked ? undefined : { background: PRIMARY_GRADIENT }}
          >
            {revoked ? (
              <>
                <LuRotateCcw size={14} strokeWidth={2.2} />
                Try it again
              </>
            ) : (
              "Revoke this link"
            )}
          </button>

          <div className="mt-3 min-h-[32px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={revoked ? "revoked" : "active"}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: reduce ? 0.15 : 0.28, ease: EASE }}
                className="text-xs leading-relaxed text-[#64748B]"
              >
                {revoked
                  ? "Revoked. That address is gone for good — it is never reissued."
                  : "Anyone with this link can read what you scoped to it. Nothing else."}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusPill({ revoked, reduce }: { revoked: boolean; reduce: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-300"
      style={{
        borderColor: revoked ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)",
        backgroundColor: revoked ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)",
        color: revoked ? "#F87171" : "#34D399",
      }}
    >
      <motion.span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: revoked ? "#F87171" : "#34D399" }}
        animate={reduce || revoked ? { opacity: 1 } : { opacity: [1, 0.35, 1] }}
        transition={{ duration: 2, repeat: revoked ? 0 : Infinity, ease: "easeInOut" }}
      />
      {revoked ? "Revoked" : "Active"}
    </span>
  );
}
