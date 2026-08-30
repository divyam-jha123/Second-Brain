import { useContext } from "react";
import { TourContext } from "./tourContext";

/** Starts or stops the dashboard tour from anywhere inside <TourProvider>. */
export const useTour = () => {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used inside a <TourProvider>");
  }
  return ctx;
};
