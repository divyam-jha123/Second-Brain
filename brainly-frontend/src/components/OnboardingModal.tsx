import { useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { LuArrowLeft, LuArrowRight, LuCheck, LuPlus } from "react-icons/lu";
import { completeOnboarding, syncUser } from "../lib/api";
import type { OnboardingPayload } from "../lib/api";

/**
 * Deliberately broad: a saved-links tool is not developer-specific, so the
 * suggestions have to read as sensible to a lawyer or a marketer too. Anything
 * missing is one "add your own" away, and collections can be renamed later.
 */
const TOPIC_GROUPS = [
  {
    label: "Work",
    topics: [
      "Marketing",
      "Sales",
      "Legal",
      "Finance",
      "Product",
      "Design",
      "Engineering",
      "Data & analytics",
      "AI / agents",
      "Operations",
      "Hiring & people",
      "Customer research",
      "Writing & content",
      "Teaching",
    ],
  },
  {
    label: "Personal",
    topics: [
      "Learning",
      "Health & fitness",
      "Personal finance",
      "Recipes",
      "Travel",
    ],
  },
];

const SUGGESTED_TOPICS = TOPIC_GROUPS.flatMap((group) => group.topics);

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const HOURS = Array.from({ length: 24 }, (_, hour) => ({
  value: hour,
  label:
    hour === 0
      ? "12:00 am"
      : hour < 12
        ? `${hour}:00 am`
        : hour === 12
          ? "12:00 pm"
          : `${hour - 12}:00 pm`,
}));

const SECTIONS = [
  {
    key: "savedThisWeek" as const,
    label: "What I saved this week",
    hint: "A digest of new items, grouped by collection",
  },
  {
    key: "untaggedNudge" as const,
    label: "Untagged inbox nudge",
    hint: "Only when items are sitting unsorted",
  },
  {
    key: "recallQuestions" as const,
    label: "Recall questions",
    hint: "3 questions from things you saved a while ago",
  },
];

const TOTAL_STEPS = 2;

const StepHeader = ({ step }: { step: number }) => (
  <div className="mb-5 flex items-center gap-4">
    <span className="shrink-0 text-sm text-fg-muted">
      Step {step} of {TOTAL_STEPS}
    </span>
    <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full bg-accent transition-all duration-500"
        style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
      />
    </div>
  </div>
);

const Checkbox = ({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint: string;
}) => (
  <label className="flex cursor-pointer items-start gap-3">
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
        checked ? "border-accent bg-accent text-accent-fg" : "border-line-strong"
      }`}
    >
      {checked && <LuCheck size={13} />}
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />
    <span>
      <span className="block text-[15px] font-medium text-fg">{label}</span>
      <span className="block text-sm text-fg-muted">{hint}</span>
    </span>
  </label>
);

const TopicChip = ({
  topic,
  selected,
  onClick,
}: {
  topic: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`rounded-full border px-4 py-2 text-sm transition-colors cursor-pointer ${
      selected
        ? "border-accent bg-accent-soft text-accent-soft-fg"
        : "border-line text-fg hover:border-line-strong"
    }`}
  >
    {topic}
  </button>
);

interface OnboardingModalProps {
  /** Called once the flow is finished or skipped, so the card can close. */
  onDone: () => void;
}

export const OnboardingModal = ({ onDone }: OnboardingModalProps) => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [step, setStep] = useState(1);
  const [topics, setTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [sections, setSections] = useState({
    savedThisWeek: true,
    untaggedNudge: true,
    recallQuestions: false,
  });
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState(9);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  // Anything typed in sits on its own row, next to the "add your own" button.
  const customTopics = useMemo(
    () => topics.filter((t) => !SUGGESTED_TOPICS.includes(t)),
    [topics],
  );

  const toggleTopic = (topic: string) =>
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );

  const addCustomTopic = () => {
    const topic = customTopic.trim();
    setCustomTopic("");
    setIsAddingCustom(false);
    if (topic && !topics.includes(topic)) setTopics((prev) => [...prev, topic]);
  };

  const finish = async (payload: OnboardingPayload) => {
    setIsSaving(true);
    setError("");
    try {
      const token = await getToken();
      // The backend requires a synced user before onboarding, so that the
      // welcome email still fires exactly once from /user/sync.
      if (user) {
        await syncUser(token, {
          username:
            user.username || user.firstName || email.split("@")[0] || "User",
          email,
        });
      }
      await completeOnboarding(token, payload);
      onDone();
    } catch (err) {
      console.error("Onboarding failed:", err);
      setError("Something went wrong. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* The dashboard stays visible behind the card. */}
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Set up your brain"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-card p-6 shadow-2xl animate-scaleIn"
      >
        {step === 1 ? (
          <>
            <StepHeader step={1} />

            <h2 className="text-2xl font-bold text-fg">
              What kind of work do you do?
            </h2>
            <p className="mt-1 text-[15px] text-fg-muted">
              We'll set up collections to match.
            </p>

            <div className="mt-5 flex flex-col gap-4">
              {TOPIC_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="pb-2 text-xs font-medium tracking-wide text-fg-subtle">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.topics.map((topic) => (
                      <TopicChip
                        key={topic}
                        topic={topic}
                        selected={topics.includes(topic)}
                        onClick={() => toggleTopic(topic)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                {customTopics.map((topic) => (
                  <TopicChip
                    key={topic}
                    topic={topic}
                    selected
                    onClick={() => toggleTopic(topic)}
                  />
                ))}

                {isAddingCustom ? (
                  <input
                    autoFocus
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onBlur={addCustomTopic}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addCustomTopic();
                      if (e.key === "Escape") {
                        setCustomTopic("");
                        setIsAddingCustom(false);
                      }
                    }}
                    placeholder="Your topic"
                    aria-label="Add your own topic"
                    className="w-36 rounded-full border border-dashed border-line-strong bg-transparent px-4 py-2 text-sm text-fg placeholder:text-fg-subtle outline-none focus:border-accent"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(true)}
                    className="flex items-center gap-1.5 rounded-full border border-dashed border-line-strong px-4 py-2 text-sm text-fg-muted transition-colors hover:text-fg cursor-pointer"
                  >
                    <LuPlus size={14} />
                    add your own
                  </button>
                )}
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between border-t border-line pt-5">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => finish({ skip: true })}
                className="text-sm font-medium text-fg-muted transition-colors hover:text-fg disabled:opacity-50 cursor-pointer"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover cursor-pointer"
              >
                Continue
                <LuArrowRight size={15} />
              </button>
            </div>
          </>
        ) : (
          <>
            <StepHeader step={2} />

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-fg">
                  Send me a weekly email
                </h2>
                <p className="mt-1 text-[15px] text-fg-muted">
                  {email ? `To ${email}. ` : ""}Change or turn it off anytime in
                  settings.
                </p>
              </div>

              <label className="email-toggle mt-1.5">
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  aria-label="Send me a weekly email"
                />
                <span className="email-toggle__slider" />
              </label>
            </div>

            <div
              className={`mt-6 flex flex-col gap-4 border-t border-line pt-5 transition-opacity ${
                emailEnabled ? "" : "pointer-events-none opacity-50"
              }`}
            >
              {SECTIONS.map((section) => (
                <Checkbox
                  key={section.key}
                  label={section.label}
                  hint={section.hint}
                  checked={sections[section.key]}
                  onChange={(next) =>
                    setSections((prev) => ({ ...prev, [section.key]: next }))
                  }
                />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
              <span className="text-[15px] text-fg-muted">Send on</span>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                disabled={!emailEnabled}
                aria-label="Delivery day"
                className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-fg outline-none focus:border-accent disabled:opacity-50 cursor-pointer"
              >
                {DAYS.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={hour}
                onChange={(e) => setHour(Number(e.target.value))}
                disabled={!emailEnabled}
                aria-label="Delivery time"
                className="rounded-lg border border-line bg-card px-3 py-2 text-sm text-fg outline-none focus:border-accent disabled:opacity-50 cursor-pointer"
              >
                {HOURS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="text-sm text-fg-subtle">{timezone}</span>
            </div>

            <div className="mt-7 flex items-center justify-between border-t border-line pt-5">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg disabled:opacity-50 cursor-pointer"
              >
                <LuArrowLeft size={15} />
                Back
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => finish({ skip: true })}
                  className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-hover disabled:opacity-50 cursor-pointer"
                >
                  Skip
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    finish({
                      topics,
                      weeklyEmail: {
                        enabled: emailEnabled,
                        sections,
                        day,
                        hour,
                        timezone,
                      },
                    })
                  }
                  className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Finish"}
                </button>
              </div>
            </div>
          </>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-danger-soft px-4 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
