export type MatchEventType =
  | "goal"
  | "foul"
  | "yellow_card"
  | "red_card"
  | "substitution"
  | "shot"
  | "shot_on_target"
  | "save"
  | "corner"
  | "offside"
  | "free_kick"
  | "throw_in"
  | "tackle"
  | "possession";

export type Team = "Team A" | "Team B";
export type MatchStatus = "idle" | "live" | "paused" | "ended";
export type ConnectionStatus = "connected" | "disconnected" | "reconnecting";
export type EventFilter =
  | "all"
  | "goals"
  | "chances"
  | "fouls"
  | "cards"
  | "set_pieces"
  | "substitutions";

export type MatchCommand = "start" | "pause" | "resume" | "reset";

export type MatchEvent = {
  id: string;
  minute: number;
  type: MatchEventType;
  team: Team;
  player: string;
  timestamp: string;
};

export type MatchSnapshot = {
  events: MatchEvent[];
  currentMinute: number;
  matchStatus: MatchStatus;
};

export type CommandAck = {
  ok: boolean;
  error?: string;
  snapshot?: MatchSnapshot;
};
