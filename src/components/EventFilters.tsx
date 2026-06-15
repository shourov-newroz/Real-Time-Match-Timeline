import { motion as m } from "motion/react";
import { buttonMotion } from "../motion/motionTokens";
import { useMatchStore } from "../store/matchStore";
import type { EventFilter } from "../types/match";

const filters: { value: EventFilter; label: string }[] = [
  { value: "all", label: "All Events" },
  { value: "goals", label: "Goals" },
  { value: "chances", label: "Chances" },
  { value: "fouls", label: "Fouls" },
  { value: "cards", label: "Cards" },
  { value: "set_pieces", label: "Set Pieces" },
  { value: "substitutions", label: "Subs" },
];

export function EventFilters() {
  const activeFilter = useMatchStore((state) => state.activeFilter);
  const setFilter = useMatchStore((state) => state.setFilter);

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = filter.value === activeFilter;
        return (
          <m.button
            {...buttonMotion}
            type="button"
            key={filter.value}
            onClick={() => setFilter(filter.value)}
            className={`transform-gpu cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition-colors will-change-transform focus:outline-none focus:ring-2 focus:ring-electric-400/60 ${
              isActive ? "border-electric-400 bg-electric-500 text-white" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            {filter.label}
          </m.button>
        );
      })}
    </div>
  );
}
