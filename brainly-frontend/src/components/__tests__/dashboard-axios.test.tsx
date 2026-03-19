import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { Dashboard } from "../dashboard";
import { API_URL } from "../../config";

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
  UserButton: () => null,
}));

describe("Dashboard axios connectivity", () => {
  it("calls GET /notes with Bearer token on mount", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { post: [] } });

    render(<Dashboard />);

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/notes`, {
        headers: { Authorization: "Bearer test-token" },
        withCredentials: true,
      }),
    );

    expect(
      screen.getByText(/No notes found in this category/i),
    ).toBeInTheDocument();
  });
});

