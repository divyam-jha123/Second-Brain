import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Card } from "../card";

describe("Card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title and added date", () => {
    render(
      <Card
        title="Hello"
        type="document"
        content="Some content"
        tags={["t1"]}
        addedDate="2026-01-01"
      />,
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText(/Added on 2026-01-01/i)).toBeInTheDocument();
  });

  it("hides share/delete buttons when readOnly", () => {
    render(
      <Card
        title="RO"
        type="document"
        content="x"
        tags={["t1"]}
        addedDate="2026-01-01"
        readOnly
      />,
    );

    expect(screen.queryByTitle("Copy link")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Delete")).not.toBeInTheDocument();
  });

  it("copies content to clipboard when share clicked", async () => {
    const onShare = vi.fn();
    render(
      <Card
        title="Share"
        type="document"
        content="https://example.com"
        tags={["t1"]}
        addedDate="2026-01-01"
        onShare={onShare}
      />,
    );

    fireEvent.click(screen.getByTitle("Copy link"));

    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://example.com"),
    );
    expect(onShare).toHaveBeenCalled();
  });

  it("opens expanded view on click and closes on Escape", () => {
    render(
      <Card
        title="Expand"
        type="document"
        content="x"
        tags={["t1"]}
        addedDate="2026-01-01"
      />,
    );

    fireEvent.click(screen.getByText("Expand"));
    // One delete button on the preview card + one in the expanded modal.
    expect(screen.getAllByTitle("Delete")).toHaveLength(2);

    fireEvent.keyDown(document, { key: "Escape" });
    // Modal closes; preview card remains.
    expect(screen.getAllByTitle("Delete")).toHaveLength(1);
  });
});

