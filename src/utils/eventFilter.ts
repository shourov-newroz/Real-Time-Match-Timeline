import type { EventFilter, MatchEvent } from "../types/match";

export function filterEvents(events: MatchEvent[], filter: EventFilter) {
  if (filter === "all") return events;
  if (filter === "goals") return events.filter((event) => event.type === "goal");
  if (filter === "chances") return events.filter((event) => event.type === "shot" || event.type === "shot_on_target" || event.type === "save");
  if (filter === "fouls") return events.filter((event) => event.type === "foul");
  if (filter === "cards") {
    return events.filter((event) => event.type === "yellow_card" || event.type === "red_card");
  }
  if (filter === "set_pieces") {
    return events.filter((event) => event.type === "corner" || event.type === "free_kick" || event.type === "throw_in" || event.type === "offside");
  }
  return events.filter((event) => event.type === "substitution");
}
