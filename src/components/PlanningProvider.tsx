import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { LunarResult } from '@/lib/lunar-data';
import { appendScenario } from '@/lib/lunar-planning';
import { readPlanningStorage, validStoredResult } from '@/lib/planning-storage';

type PlanningState = {
  current: LunarResult | null;
  saved: LunarResult[];
  setCurrent: (result: LunarResult | null) => void;
  save: (result: LunarResult) => void;
  remove: (index: number) => void;
};
const PlanningContext = createContext<PlanningState | null>(null);
export function PlanningProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<LunarResult | null>(null),
    [saved, setSaved] = useState<LunarResult[]>([]),
    [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const data = readPlanningStorage(localStorage.getItem('synexis-planning-v1'));
      setSaved(data.saved);
      setCurrent(data.current);
    } catch {
      /* Storage is optional. */
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem('synexis-planning-v1', JSON.stringify({ saved, current }));
      } catch {
        /* Keep working in memory if unavailable. */
      }
    }
  }, [saved, current, hydrated]);
  return (
    <PlanningContext.Provider
      value={{
        current,
        saved,
        setCurrent,
        save: (result) => {
          if (validStoredResult(result)) setSaved((items) => appendScenario(items, result));
        },
        remove: (index) => setSaved((items) => items.filter((_, i) => i !== index)),
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
}
export function usePlanning() {
  const value = useContext(PlanningContext);
  if (!value) throw new Error('Planning provider missing');
  return value;
}
