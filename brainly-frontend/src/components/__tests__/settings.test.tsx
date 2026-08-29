import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import { EmailSettings } from "../settings/email";
import { SharingSettings } from "../settings/sharing";
import { DataSettings } from "../settings/stubs";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { API_URL } from "../../config";

vi.mock("axios");

vi.mock("@clerk/react", () => {
  // Stable identities: a fresh getToken each render would re-fire the fetch
  // effects that depend on it.
  const auth = { getToken: vi.fn().mockResolvedValue("test-token") };
  const user = {
    user: { primaryEmailAddress: { emailAddress: "alice@example.com" } },
  };
  const clerk = { signOut: vi.fn() };
  return {
    useAuth: () => auth,
    useUser: () => user,
    useClerk: () => clerk,
  };
});

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
  timezone: "Asia/Kolkata",
  consentedAt: null,
  unsubscribedAt: null,
  lastDigestSentAt: null,
  email: "alice@example.com",
};

/** Sections render on their own now — the dialog around them is not the unit. */
const renderPane = (pane: ReactNode) =>
  render(
    <ThemeProvider>
      <MemoryRouter>{pane}</MemoryRouter>
    </ThemeProvider>,
  );

describe("weekly email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.get).mockResolvedValue({ data: { preferences: PREFS } });
  });

  it("sends the browser timezone rather than asking for it", async () => {
    renderPane(<EmailSettings />);

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/email/preferences?timezone="),
        expect.anything(),
      ),
    );
  });

  it("autosaves the toggle with no save button", async () => {
    vi.mocked(axios.put).mockResolvedValueOnce({
      data: { preferences: { ...PREFS, weeklyDigest: false } },
    });

    renderPane(<EmailSettings />);
    await screen.findByLabelText("Send weekly email");

    await userEvent.click(screen.getByLabelText("Send weekly email"));

    await waitFor(() =>
      expect(axios.put).toHaveBeenCalledWith(
        `${API_URL}/email/preferences`,
        expect.objectContaining({ weeklyDigest: false }),
        expect.anything(),
      ),
    );
    expect(screen.queryByRole("button", { name: /^save$/i })).not.toBeInTheDocument();
  });

  it("reverts the control when the save fails", async () => {
    vi.mocked(axios.put).mockRejectedValueOnce(new Error("network"));

    renderPane(<EmailSettings />);
    const toggle = await screen.findByLabelText("Send weekly email");
    expect(toggle).toBeChecked();

    await userEvent.click(toggle);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByLabelText("Send weekly email")).toBeChecked();
  });

  it("dims the section checkboxes while the weekly email is off", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: { preferences: { ...PREFS, weeklyDigest: false } },
    });

    renderPane(<EmailSettings />);

    expect(await screen.findByLabelText("Recall questions")).toBeDisabled();
    expect(screen.getByLabelText("Delivery day")).toBeDisabled();
  });

  it("clearing a section is not an unsubscribe", async () => {
    vi.mocked(axios.put).mockResolvedValueOnce({
      data: {
        preferences: {
          ...PREFS,
          digestSections: { ...PREFS.digestSections, savedThisWeek: false },
        },
      },
    });

    renderPane(<EmailSettings />);
    await userEvent.click(await screen.findByLabelText("What you saved this week"));

    await waitFor(() => expect(axios.put).toHaveBeenCalled());
    const body = vi.mocked(axios.put).mock.calls[0][1] as Record<string, unknown>;
    expect(body).not.toHaveProperty("weeklyDigest");
    expect(screen.getByLabelText("Send weekly email")).toBeChecked();
  });

  it("survives an older backend that omits the newer fields", async () => {
    // What a deployment from before digest sections existed answers with.
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        preferences: {
          featureAnnouncements: true,
          weeklyDigest: true,
          unsubscribedAll: false,
        },
      },
    });

    renderPane(<EmailSettings />);

    // Previously this threw on `prefs.digestSections[key]` and blanked the page.
    expect(await screen.findByLabelText("Send weekly email")).toBeInTheDocument();
    expect(screen.getByLabelText("Recall questions")).not.toBeChecked();
    expect(screen.getByLabelText("Delivery day")).toHaveValue("0");
  });

  it("shows an inline error when the request is blocked", async () => {
    // A CORS block or a signed-out 302 both land here as a rejected request.
    vi.mocked(axios.get).mockRejectedValue(new Error("Network Error"));

    renderPane(<EmailSettings />);

    expect(
      await screen.findByText(/couldn't load your email settings/i),
    ).toBeInTheDocument();
  });

  it("surfaces the not-yet-built preview send", async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error("501"));

    renderPane(<EmailSettings />);
    await userEvent.click(
      await screen.findByRole("button", { name: /send me one now/i }),
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/isn't available yet/i),
    );
  });
});

describe("SharingSettings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists what each link exposes and revokes it", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        links: [
          { _id: "l1", hash: "h1", scope: "tag", tag: "react", label: "react" },
        ],
      },
    });
    vi.mocked(axios.delete).mockResolvedValueOnce({ data: {} });

    render(<SharingSettings />);

    await waitFor(() =>
      expect(screen.getByText("Tag · react")).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("button", { name: "Revoke" }));

    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith(
        `${API_URL}/notes/share/h1`,
        expect.anything(),
      ),
    );
    expect(screen.queryByText("Tag · react")).not.toBeInTheDocument();
  });
});

describe("coming-soon sections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.get).mockResolvedValue({ data: {} });
  });

  it("says what the section will do, not just \"coming soon\"", () => {
    renderPane(<DataSettings />);

    expect(screen.getByText("Not built yet")).toBeInTheDocument();
    expect(
      screen.getByText(/import from pocket, raindrop and browser bookmarks/i),
    ).toBeInTheDocument();
  });

  it("hands the notify affordance to the announcements section", async () => {
    const onNotify = vi.fn();
    renderPane(<DataSettings onNotify={onNotify} />);

    await userEvent.click(
      screen.getByRole("button", { name: /notify me when it ships/i }),
    );

    expect(onNotify).toHaveBeenCalled();
  });

  it("offers no notify affordance when there is nowhere to send you", () => {
    renderPane(<DataSettings />);

    expect(screen.getByText("Not built yet")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /notify me/i }),
    ).not.toBeInTheDocument();
  });
});
