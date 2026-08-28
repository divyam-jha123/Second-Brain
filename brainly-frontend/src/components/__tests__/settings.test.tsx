import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SettingsLayout } from "../../pages/settings/SettingsLayout";
import { EmailSettings } from "../../pages/settings/Email";
import { TagSettings } from "../settings/tags";
import { SharingSettings } from "../settings/sharing";
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
  return { useAuth: () => auth, useUser: () => user };
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

const renderSettings = (initial = "/settings/tags") =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/settings" element={<SettingsLayout />}>
            <Route path="tags" element={<TagSettings />} />
            <Route path="sharing" element={<SharingSettings />} />
            <Route path="email" element={<EmailSettings />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );

describe("settings navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.get).mockResolvedValue({ data: {} });
  });

  it("navigates client-side — every nav item is a router link", () => {
    renderSettings();

    // A plain <a href> would reload the document and remount the nav.
    for (const name of ["Back to brain", "Profile", "Security", "Danger zone"]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href");
    }
  });

  it("swaps only the content pane, keeping the nav mounted", async () => {
    renderSettings();
    const nav = screen.getByRole("link", { name: "Profile" });

    await userEvent.click(screen.getByRole("link", { name: "Sharing" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Sharing" })).toBeInTheDocument(),
    );
    // Same DOM node: the layout was not torn down and rebuilt.
    expect(screen.getByRole("link", { name: "Profile" })).toBe(nav);
  });

  it("marks the active item from the pathname", () => {
    renderSettings("/settings/sharing");

    expect(screen.getByRole("link", { name: "Sharing" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("weekly email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.get).mockResolvedValue({ data: { preferences: PREFS } });
  });

  it("sends the browser timezone rather than asking for it", async () => {
    renderSettings("/settings/email");

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

    renderSettings("/settings/email");
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

    renderSettings("/settings/email");
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

    renderSettings("/settings/email");

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

    renderSettings("/settings/email");
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

    renderSettings("/settings/email");

    // Previously this threw on `prefs.digestSections[key]` and blanked the page.
    expect(await screen.findByLabelText("Send weekly email")).toBeInTheDocument();
    expect(screen.getByLabelText("Recall questions")).not.toBeChecked();
    expect(screen.getByLabelText("Delivery day")).toHaveValue("0");
  });

  it("shows an inline error when the request is blocked", async () => {
    // A CORS block or a signed-out 302 both land here as a rejected request.
    vi.mocked(axios.get).mockRejectedValue(new Error("Network Error"));

    renderSettings("/settings/email");

    expect(
      await screen.findByText(/couldn't load your email settings/i),
    ).toBeInTheDocument();
  });

  it("surfaces the not-yet-built preview send", async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error("501"));

    renderSettings("/settings/email");
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
