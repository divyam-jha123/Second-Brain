import { createContext } from "react";

export interface TourValue {
  isActive: boolean;
  start: () => void;
  stop: () => void;
}

export const TourContext = createContext<TourValue | null>(null);
