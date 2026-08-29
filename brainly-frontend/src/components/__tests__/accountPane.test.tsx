import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import { AccountPane } from "../settings/AccountPane";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { API_URL } from "../../config";

vi.mock("axios");

// Clerk hands back a fresh getToken on every render. An effect that depends on
// it re-runs after each setState, which is what used to reset the toggles.
vi.mock("@clerk/react", () => ({
  useAuth: () => ({ getToken: () => Promise.resolve("test-token") }),
  useUser: () => ({
    user: {
      fullName: "Divyam Jha",
      primaryEmailAddress: { emailAddress: "divyam@brainexpo.me" },
    },
  }),
  useClerk: () => ({ signOut: vi.fn(), openUserProfile: vi.fn() }),
}));

const PREFS = {
  featureAnnouncements: true,
  weeklyDigest: true,
  unsubscribedAll: false,
  digestSections: {
    savedThisWeek: true,
    untaggedNudge: true,
    recallQuestions: false,
  },
  digestDay: 0,
  digestHour: 9,
  timezone: "UTC",
  consentedAt: null,
  unsubscribedAt: null,
  lastDigestSentAt: null,
  email: "divyam@brainexpo.me",
};

const renderPane = () =>
  render(
    <ThemeProvider>
      <MemoryRouter>
        <AccountPane />
      </MemoryRouter>
    </ThemeProvider>,
  );

/** Lets a test wait for the re-render the buggy effect used to cause. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(axios.get).mockImplementation((url: string) =>
    Promise.resolve(
      url.includes("/email/preferences")
        ? { data: { preferences: PREFS } }
        : { data: { links: [] } },
    ),
  );
  vi.mocked(axios.put).mockResolvedValue({
    data: { preferences: { ...PREFS, weeklyDigest: false } },
  });
  vi.mocked(axios.post).mockResolvedValue({ data: { hash: "h1" } });
});

describe("account preferences", () => {
  it("keeps a flipped toggle flipped instead of snapping back", async () => {
    renderPane();
    const toggle = await screen.findByRole("switch", { name: "Weekly email" });
    await waitFor(() => expect(toggle).toBeEnabled());

    await userEvent.click(toggle);

    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/email/preferences`,
        expect.objectContaining({ weeklyDigest: false }),
        expect.anything(),
      ),
    );
    await settle();
    expect(screen.getByRole("switch", { name: "Weekly email" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("reads each preference once, not on every render", async () => {
    renderPane();
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: "Weekly email" })).toBeEnabled(),
    );
    await settle();

    // One /email/preferences and one /notes/share, and nothing more.
    expect(vi.mocked(axios.get).mock.calls).toHaveLength(2);
  });

  it("publishes a public brain link and shows it", async () => {
    renderPane();
    const toggle = await screen.findByRole("switch", { name: "Public brain" });
    await waitFor(() => expect(toggle).toBeEnabled());

    await userEvent.click(toggle);

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/notes/share`,
        { scope: "all" },
        expect.anything(),
      ),
    );
    expect(await screen.findByText(/\/share\/h1$/)).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Public brain" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("leaves the weekly toggle usable when only the share read fails", async () => {
    vi.mocked(axios.get).mockImplementation((url: string) =>
      url.includes("/email/preferences")
        ? Promise.resolve({ data: { preferences: PREFS } })
        : Promise.reject(new Error("Network Error")),
    );

    renderPane();

    await waitFor(() =>
      expect(screen.getByRole("switch", { name: "Weekly email" })).toBeEnabled(),
    );
    expect(screen.getByRole("switch", { name: "Public brain" })).toBeDisabled();
    expect(
      screen.getByText(/couldn't load some of your settings/i),
    ).toBeInTheDocument();
  });
});
