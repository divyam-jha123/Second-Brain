import { describe, it, expect } from "vitest";
import { isDue, localSlot } from "../src/cron/weeklyDigest.js";
import { buildWeeklyDigestHtml } from "../src/emails/weeklyDigest.js";
import type { WeeklyDigestData } from "../src/emails/weeklyDigest.js";

// Sunday 2026-08-30, 03:30 UTC.
const SUNDAY_0330_UTC = new Date("2026-08-30T03:30:00Z");

describe("localSlot", () => {
  it("reads the weekday and hour in the user's own timezone", () => {
    // 03:30 UTC Sunday is 09:00 Sunday in Kolkata (+5:30).
    expect(localSlot(SUNDAY_0330_UTC, "Asia/Kolkata")).toEqual({
      day: 0,
      hour: 9,
    });
    // ...and still Saturday evening in New York.
    expect(localSlot(SUNDAY_0330_UTC, "America/New_York")).toEqual({
      day: 6,
      hour: 23,
    });
  });

  it("falls back to UTC on a malformed timezone instead of throwing", () => {
    expect(localSlot(SUNDAY_0330_UTC, "Not/AZone")).toEqual({ day: 0, hour: 3 });
  });

  it("reports midnight as hour 0, never 24", () => {
    const midnight = new Date("2026-08-30T00:00:00Z");
    expect(localSlot(midnight, "UTC").hour).toBe(0);
  });
});

describe("isDue", () => {
  const base = {
    digestDay: 0,
    digestHour: 9,
    timezone: "Asia/Kolkata",
    lastDigestSentAt: null,
  };

  it("is due at the user's chosen local slot", () => {
    expect(isDue(base, SUNDAY_0330_UTC)).toBe(true);
  });

  it("is not due at the same instant for a different timezone", () => {
    // Same moment, but it is Saturday 23:00 in New York.
    expect(isDue({ ...base, timezone: "America/New_York" }, SUNDAY_0330_UTC)).toBe(
      false,
    );
  });

  it("is not due an hour early or late", () => {
    expect(isDue(base, new Date("2026-08-30T02:30:00Z"))).toBe(false);
    expect(isDue(base, new Date("2026-08-30T04:30:00Z"))).toBe(false);
  });

  it("respects a different chosen day", () => {
    expect(isDue({ ...base, digestDay: 3 }, SUNDAY_0330_UTC)).toBe(false);
  });

  it("will not send twice in the same week", () => {
    const justSent = { ...base, lastDigestSentAt: new Date("2026-08-30T03:00:00Z") };
    expect(isDue(justSent, SUNDAY_0330_UTC)).toBe(false);
  });

  it("sends again once a full week has passed", () => {
    const lastWeek = { ...base, lastDigestSentAt: new Date("2026-08-23T03:30:00Z") };
    expect(isDue(lastWeek, SUNDAY_0330_UTC)).toBe(true);
  });

  it("defaults to Sunday 9am when the user never chose", () => {
    expect(isDue({ timezone: "Asia/Kolkata" }, SUNDAY_0330_UTC)).toBe(true);
  });
});

const data = (over: Partial<WeeklyDigestData> = {}): WeeklyDigestData => ({
  username: "alice",
  dateRange: "24–30 Aug",
  savedThisWeek: 14,
  untaggedThisWeek: 12,
  totalSaved: 348,
  notes: [
    {
      title: "Postgres indexing deep dive",
      url: "https://youtube.com/watch?v=abc",
      type: "video",
      source: "youtube.com",
      savedOn: "Wednesday",
    },
  ],
  moreCount: 11,
  recallQuestions: [],
  sections: {
    savedThisWeek: true,
    untaggedNudge: true,
    recallQuestions: false,
  },
  unsubscribeUrl: "https://brainexpo.me/unsubscribe?token=x",
  dashboardUrl: "https://brainexpo.me/dashboard",
  settingsUrl: "https://brainexpo.me/settings/email",
  ...over,
});

describe("buildWeeklyDigestHtml", () => {
  it("renders without anything email clients drop", () => {
    const html = buildWeeklyDigestHtml(data());

    // Gmail strips custom properties; Outlook ignores flex and grid.
    expect(html).not.toMatch(/var\(--/);
    expect(html).not.toMatch(/display:\s*flex/);
    expect(html).not.toMatch(/display:\s*grid/);
    // Icon fonts never load in email.
    expect(html).not.toMatch(/class="ti /);
  });

  it("shows the stats and the date range", () => {
    const html = buildWeeklyDigestHtml(data());

    expect(html).toContain("24–30 Aug");
    expect(html).toContain("348");
    expect(html).toContain("Postgres indexing deep dive");
    expect(html).toContain("+ 11 more");
  });

  it("omits a section the user turned off", () => {
    const html = buildWeeklyDigestHtml(
      data({
        sections: {
          savedThisWeek: false,
          untaggedNudge: false,
          recallQuestions: false,
        },
      }),
    );

    expect(html).not.toContain("THIS WEEK'S SAVES");
    expect(html).not.toContain("Tag them now");
  });

  it("skips the nudge when nothing is untagged", () => {
    const html = buildWeeklyDigestHtml(data({ untaggedThisWeek: 0 }));
    expect(html).not.toContain("Tag them now");
  });

  it("never renders the recall block while questions are unimplemented", () => {
    const html = buildWeeklyDigestHtml(
      data({
        recallQuestions: [],
        sections: {
          savedThisWeek: true,
          untaggedNudge: true,
          recallQuestions: true,
        },
      }),
    );

    expect(html).not.toContain("DO YOU STILL REMEMBER");
  });

  it("escapes note titles", () => {
    const html = buildWeeklyDigestHtml(
      data({
        notes: [
          {
            title: '<script>alert("x")</script>',
            url: "https://a.com",
            type: "document",
            savedOn: "Monday",
          },
        ],
      }),
    );

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("refuses a javascript: url on a save", () => {
    const html = buildWeeklyDigestHtml(
      data({
        notes: [
          {
            title: "Bad",
            // eslint-disable-next-line no-script-url
            url: "javascript:alert(1)",
            type: "document",
            savedOn: "Monday",
          },
        ],
      }),
    );

    expect(html).not.toContain("javascript:");
    expect(html).toContain("https://brainexpo.me/dashboard");
  });
});
