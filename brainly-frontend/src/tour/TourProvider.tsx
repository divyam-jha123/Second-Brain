import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { driver } from "driver.js";
import type { Driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "./tour.css";
import { TourContext } from "./tourContext";
import { getStepsForViewport } from "./tourSteps";
import { TourCursor } from "./TourCursor";

interface TourProviderProps {
  children: ReactNode;
  /** Set true to kick off the tour once (e.g. right after onboarding). */
  autoStart?: boolean;
  /** Called once the tour ends, whether finished or skipped. */
  onComplete?: () => void;
}

const readCssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const TourProvider = ({
  children,
  autoStart = false,
  onComplete,
}: TourProviderProps) => {
  const [isActive, setIsActive] = useState(false);
  const [cursorTarget, setCursorTarget] = useState<{ x: number; y: number } | null>(
    null,
  );
  const driverRef = useRef<Driver | null>(null);
  const hasAutoStarted = useRef(false);

  const stop = useCallback(() => {
    driverRef.current?.destroy();
  }, []);

  const start = useCallback(() => {
    const steps: DriveStep[] = getStepsForViewport()
      .map((step) => {
        const element = document.querySelector(`[data-tour-id="${step.id}"]`);
        if (!element) return null;

        const driveStep: DriveStep = {
          element,
          popover: {
            title: step.title,
            description: step.description,
            side: step.side,
          },
          onHighlightStarted: (el) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            setCursorTarget({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            });
          },
        };
        return driveStep;
      })
      .filter((step): step is DriveStep => step !== null);

    if (steps.length === 0) return;

    const instance = driver({
      steps,
      animate: true,
      showProgress: true,
      allowClose: true,
      overlayColor: readCssVar("--overlay") || "rgba(0,0,0,0.55)",
      stagePadding: 6,
      stageRadius: 10,
      popoverClass: "brainexpo-tour-popover",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      onDestroyed: () => {
        setIsActive(false);
        setCursorTarget(null);
        onComplete?.();
      },
    });

    driverRef.current = instance;
    setIsActive(true);
    instance.drive();
  }, [onComplete]);

  // Waits a beat so the onboarding modal has finished unmounting and every
  // target is actually in the DOM before driver.js goes looking for them.
  useEffect(() => {
    if (!autoStart || hasAutoStarted.current) return;
    hasAutoStarted.current = true;
    const id = setTimeout(() => start(), 300);
    return () => clearTimeout(id);
  }, [autoStart, start]);

  const value = useMemo(() => ({ isActive, start, stop }), [isActive, start, stop]);

  return (
    <TourContext.Provider value={value}>
      {children}
      {isActive && <TourCursor target={cursorTarget} />}
    </TourContext.Provider>
  );
};
