import { useMemo } from "react";
import { useMatchStore } from "../store/matchStore";

export function useMatchStats() {
  const events = useMatchStore((state) => state.events);

  return useMemo(() => {
    const totals = {
      goals: 0,
      fouls: 0,
      yellows: 0,
      reds: 0,
      subs: 0,
      shots: 0,
      setPieces: 0,
    };
    const teamA = {
      goals: 0,
      fouls: 0,
      yellows: 0,
      substitutions: 0,
    };
    const teamB = {
      goals: 0,
      fouls: 0,
      yellows: 0,
      substitutions: 0,
    };

    for (const event of events) {
      if (event.type === "goal") {
        totals.goals += 1;
      }
      if (event.type === "foul") {
        totals.fouls += 1;
      }
      if (event.type === "yellow_card") {
        totals.yellows += 1;
      }
      if (event.type === "red_card") {
        totals.reds += 1;
      }
      if (event.type === "substitution") {
        totals.subs += 1;
      }
      if (event.type === "shot" || event.type === "shot_on_target") {
        totals.shots += 1;
      }
      if (event.type === "corner" || event.type === "free_kick") {
        totals.setPieces += 1;
      }

      const target = event.team === "Team A" ? teamA : teamB;
      if (event.type === "goal") {
        target.goals += 1;
      }
      if (event.type === "foul") {
        target.fouls += 1;
      }
      if (event.type === "yellow_card") {
        target.yellows += 1;
      }
      if (event.type === "substitution") {
        target.substitutions += 1;
      }
    }

    return {
      latest: events[0] ?? null,
      totals,
      teamA,
      teamB,
    };
  }, [events]);
}
