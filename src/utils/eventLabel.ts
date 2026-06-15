import type { MatchEventType } from "../types/match";

export const eventLabel: Record<MatchEventType, string> = {
  goal: "Goal",
  foul: "Foul",
  yellow_card: "Yellow Card",
  red_card: "Red Card",
  substitution: "Substitution",
  shot: "Shot",
  shot_on_target: "Shot on Target",
  save: "Save",
  corner: "Corner",
  offside: "Offside",
  free_kick: "Free Kick",
  throw_in: "Throw-in",
  tackle: "Tackle",
  possession: "Possession",
};

export const teamLabel = {
  "Team A": "Manchester City",
  "Team B": "Arsenal FC",
} as const;

export const teamShort = {
  "Team A": "MCI",
  "Team B": "ARS",
} as const;
