import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { SettingsDialog } from "../settings/SettingsDialog";
import { ThemeProvider } from "../../theme/ThemeProvider";

vi.mock("axios");

vi.mock("@clerk/react", () => {
  const auth = { getToken: vi.fn().mockResolvedValue("test-token") };
  const user = {
    user: {
      fullName: "Divyam Jha",
      primaryEmailAddress: { emailAddress: "divyam@brainexpo.me" },
    },
  };
  const clerk = { signOut: vi.fn(), openUserProfile: vi.fn() };
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
  timezone: "UTC",
  consentedAt: null,
  unsubscribedAt: null,
  lastDigestSentAt: null,
  email: "divyam@brainexpo.me",
};

const renderDialog = (onClose = vi.fn()) => {
  const onSectionChange = vi.fn();
  render(
    <ThemeProvider>
      <SettingsDialog
        open
        section="account"
        onSectionChange={onSectionChange}
        onClose={onClose}
      />
    </ThemeProvider>,
  );
  return { onClose, onSectionChange };
};

beforeEach(() => {
  vi.mocked(axios.get).mockImplementation((url: string) =>
    Promise.resolve(
      url.includes("/email/preferences")
        ? { data: { preferences: PREFS } }
        : { data: { links: [] } },
    ),
  );
});

describe("SettingsDialog", () => {
  it("renders the account pane inside a modal dialog", async () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: "Settings" });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    expect(
      screen.getByRole("heading", { name: "Account" }),
    ).toBeInTheDocument();
    expect(screen.getByText("divyam@brainexpo.me")).toBeInTheDocument();

    // Preferences load before their switches become operable.
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: "Weekly email" })).toBeEnabled(),
    );
    expect(screen.getByRole("switch", { name: "Weekly email" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("switch", { name: "Public brain" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("switches section from the nav and closes on Escape", async () => {
    const user = userEvent.setup();
    const { onClose, onSectionChange } = renderDialog();

    await user.click(screen.getByRole("button", { name: /Appearance/ }));
    expect(onSectionChange).toHaveBeenCalledWith("appearance");

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
