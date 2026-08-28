import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Card } from "../card";

describe("Card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title, tags and source footer", () => {
    render(
      <Card
        title="Hello"
        type="document"
        content="https://example.com/post"
        tags={["t1"]}
        addedDate="2026-01-01"
      />,
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("t1")).toBeInTheDocument();
    expect(screen.getByText("example.com")).toBeInTheDocument();
  });

  it("falls back to an untagged pill when there are no tags", () => {
    render(
      <Card title="Bare" type="document" content="x" tags={[]} addedDate="2026-01-01" />,
    );

    expect(screen.getByText("untagged")).toBeInTheDocument();
  });

  it("embeds tweets and LinkedIn posts directly in the grid card", () => {
    const { container, rerender } = render(
      <Card
        title="Tweet"
        type="tweet"
        content="https://x.com/someone/status/123"
        tags={[]}
        addedDate="2026-01-01"
      />,
    );

    // Rendered on the grid card itself, not only inside the expanded modal.
    expect(container.querySelector("blockquote.twitter-tweet")).toBeInTheDocument();

    rerender(
      <Card
        title="Post"
        type="linkedin"
        content="https://www.linkedin.com/posts/someone_slug-activity-7123456789012345678-AbCd"
        tags={[]}
        addedDate="2026-01-01"
      />,
    );

    expect(container.querySelector("iframe")).toHaveAttribute(
      "src",
      "https://www.linkedin.com/embed/feed/update/urn:li:activity:7123456789012345678",
    );
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

