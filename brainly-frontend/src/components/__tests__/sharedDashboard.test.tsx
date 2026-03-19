import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SharedDashboard } from "../sharedDashboard";
import { API_URL } from "../../config";

vi.mock("axios");

describe("SharedDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and renders cards from API", async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        content: [
          {
            _id: "1",
            title: "A",
            content: "hello",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    } as { data: { content: Array<{ _id: string; title: string; content?: string; createdAt: string }> } });

    render(
      <MemoryRouter initialEntries={["/share/abc"]}>
        <Routes>
          <Route path="/share/:hash" element={<SharedDashboard />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("A")).toBeInTheDocument());
    expect(axios.get).toHaveBeenCalledWith(
      `${API_URL}/notes/api/share/abc`,
      { withCredentials: true },
    );
  });

  it("shows friendly message on 404", async () => {
    vi.mocked(axios.isAxiosError).mockReturnValueOnce(true);
    vi.mocked(axios.get).mockRejectedValueOnce({
      response: { status: 404 },
    });

    render(
      <MemoryRouter initialEntries={["/share/missing"]}>
        <Routes>
          <Route path="/share/:hash" element={<SharedDashboard />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(/shared brain link is invalid/i),
      ).toBeInTheDocument(),
    );
    expect(axios.get).toHaveBeenCalledWith(
      `${API_URL}/notes/api/share/missing`,
      { withCredentials: true },
    );
  });
});

