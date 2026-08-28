import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OnboardingModal } from "../OnboardingModal";

const completeOnboarding = vi.fn().mockResolvedValue(undefined);
const syncUser = vi.fn().mockResolvedValue(undefined);

vi.mock("../../lib/api", () => ({
  completeOnboarding: (...args: unknown[]) => completeOnboarding(...args),
  syncUser: (...args: unknown[]) => syncUser(...args),
}));

vi.mock("@clerk/react", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("test-token") }),
  useUser: () => ({
    user: {
      username: "alice",
      firstName: "Alice",
      emailAddresses: [{ emailAddress: "alice@example.com" }],
      primaryEmailAddress: { emailAddress: "alice@example.com" },
    },
  }),
}));

describe("OnboardingModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows only the first card until Continue is pressed", () => {
    render(<OnboardingModal onDone={vi.fn()} />);

    expect(screen.getByText("What kind of work do you do?")).toBeInTheDocument();
    // The second card must not be on screen at the same time.
    expect(screen.queryByText("Send me a weekly email")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Continue"));

    expect(screen.getByText("Send me a weekly email")).toBeInTheDocument();
    expect(screen.queryByText("What kind of work do you do?")).not.toBeInTheDocument();
  });

  it("suggests topics beyond software, grouped by work and personal", () => {
    render(<OnboardingModal onDone={vi.fn()} />);

    ["Legal", "Marketing", "Sales", "Finance", "Recipes"].forEach((topic) =>
      expect(screen.getByText(topic)).toBeInTheDocument(),
    );
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("keeps a typed-in topic selected alongside the suggestions", () => {
    render(<OnboardingModal onDone={vi.fn()} />);

    fireEvent.click(screen.getByText("add your own"));
    const input = screen.getByLabelText("Add your own topic");
    fireEvent.change(input, { target: { value: "Litigation" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByText("Litigation")).toHaveAttribute("aria-pressed", "true");
  });

  it("Back returns to the first card with picks intact", () => {
    render(<OnboardingModal onDone={vi.fn()} />);

    fireEvent.click(screen.getByText("Legal"));
    fireEvent.click(screen.getByText("Continue"));
    fireEvent.click(screen.getByText("Back"));

    expect(screen.getByText("Legal")).toHaveAttribute("aria-pressed", "true");
  });

  it("submits the picked topics and email choices, then closes", async () => {
    const onDone = vi.fn();
    render(<OnboardingModal onDone={onDone} />);

    fireEvent.click(screen.getByText("Marketing"));
    fireEvent.click(screen.getByText("Continue"));
    fireEvent.click(screen.getByText("Finish"));

    await waitFor(() => expect(onDone).toHaveBeenCalled());

    // The user must be synced first, or the backend answers 409.
    expect(syncUser).toHaveBeenCalled();
    expect(completeOnboarding).toHaveBeenCalledWith(
      "test-token",
      expect.objectContaining({
        topics: ["Marketing"],
        weeklyEmail: expect.objectContaining({ enabled: true, day: 0, hour: 9 }),
      }),
    );
  });

  it("Skip completes without seeding anything", async () => {
    const onDone = vi.fn();
    render(<OnboardingModal onDone={onDone} />);

    fireEvent.click(screen.getByText("Skip for now"));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(completeOnboarding).toHaveBeenCalledWith("test-token", { skip: true });
  });
});
