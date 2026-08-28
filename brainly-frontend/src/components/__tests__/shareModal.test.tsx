import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { ShareModal } from "../shareModal";
import { API_URL } from "../../config";
import type { Note } from "../dashboard";

vi.mock("axios");

vi.mock("@clerk/react", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("test-token") }),
}));

const notes: Note[] = [
  { _id: "n1", title: "React docs", createdAt: "", tags: ["react"], collectionId: "c1" },
  { _id: "n2", title: "Caching post", createdAt: "", tags: [], collectionId: null },
];

const renderModal = (props: Partial<Parameters<typeof ShareModal>[0]> = {}) =>
  render(
    <ShareModal
      isOpen
      onClose={() => {}}
      itemCount={notes.length}
      notes={notes}
      collections={[{ _id: "c1", name: "Frontend", order: 0, count: 1 }]}
      tags={[{ name: "react", count: 1 }]}
      {...props}
    />,
  );

describe("ShareModal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks what to share instead of minting a link straight away", () => {
    renderModal();

    expect(screen.getByText("What do you want to share?")).toBeInTheDocument();
    expect(screen.getByText("A collection")).toBeInTheDocument();
    expect(screen.getByText("A tag")).toBeInTheDocument();
    expect(screen.getByText("Specific items")).toBeInTheDocument();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("sends the chosen items, not everything", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { hash: "h1" } });

    renderModal();
    await userEvent.click(screen.getByText("Specific items"));
    await userEvent.click(screen.getByLabelText("React docs"));
    await userEvent.click(screen.getByRole("button", { name: /generate link/i }));

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        `${API_URL}/notes/share`,
        expect.objectContaining({ scope: "items", noteIds: ["n1"] }),
        expect.anything(),
      ),
    );
  });

  it("counts what the selection actually exposes", async () => {
    renderModal();

    expect(screen.getByText("2 items will be shared")).toBeInTheDocument();

    await userEvent.click(screen.getByText("A tag"));
    await userEvent.click(screen.getByRole("button", { name: /react/i }));

    expect(screen.getByText("1 item will be shared")).toBeInTheDocument();
  });

  it("won't generate a link that exposes nothing", async () => {
    renderModal();
    await userEvent.click(screen.getByText("Specific items"));

    expect(screen.getByRole("button", { name: /generate link/i })).toBeDisabled();
  });

  it("opens on the collection the dashboard is filtered to", () => {
    renderModal({ activeCollectionId: "c1" });

    expect(
      screen.getByRole("button", { name: /a collection/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 item will be shared")).toBeInTheDocument();
  });
});
