import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { Dashboard } from "../dashboard";
import { API_URL } from "../../config";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { SettingsDialogProvider } from "../settings/SettingsDialogProvider";

vi.mock("axios");

const getTokenMock = vi.fn().mockResolvedValue("test-token");
const userMock = {
  username: "alice",
  firstName: "Alice",
  emailAddresses: [{ emailAddress: "alice@example.com" }],
};

vi.mock("@clerk/react", () => ({
  useAuth: () => ({ getToken: getTokenMock }),
  useUser: () => ({ user: userMock }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

describe("Dashboard axios connectivity", () => {
  it("calls GET /notes with Bearer token on mount", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { post: [] } });

    render(
    <ThemeProvider>
      <MemoryRouter>
        <SettingsDialogProvider>
          <Dashboard />
        </SettingsDialogProvider>
      </MemoryRouter>
    </ThemeProvider>
    );

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/notes`, {
        headers: { Authorization: "Bearer test-token" },
        withCredentials: true,
      }),
    );

    // The empty state only appears once the fetch has resolved — before that
    // the grid shows skeletons, not "you have nothing".
    expect(
      await screen.findByText(/Nothing here yet/i),
    ).toBeInTheDocument();
  });
});

