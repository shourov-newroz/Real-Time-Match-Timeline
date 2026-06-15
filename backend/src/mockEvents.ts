import type { MatchEvent, MatchEventType, Team } from "@rtmt/shared";

type Player = {
  name: string;
  roles: Array<"gk" | "def" | "mid" | "att">;
};

const players: Record<Team, Player[]> = {
  "Team A": [
    { name: "Ederson", roles: ["gk"] },
    { name: "Walker", roles: ["def"] },
    { name: "Dias", roles: ["def"] },
    { name: "Rodri", roles: ["mid"] },
    { name: "Silva", roles: ["mid", "att"] },
    { name: "Foden", roles: ["mid", "att"] },
    { name: "Doku", roles: ["att"] },
    { name: "Haaland", roles: ["att"] },
    { name: "De Bruyne", roles: ["mid", "att"] },
  ],
  "Team B": [
    { name: "Raya", roles: ["gk"] },
    { name: "White", roles: ["def"] },
    { name: "Saliba", roles: ["def"] },
    { name: "Rice", roles: ["mid"] },
    { name: "Odegaard", roles: ["mid", "att"] },
    { name: "Saka", roles: ["att"] },
    { name: "Martinelli", roles: ["att"] },
    { name: "Havertz", roles: ["mid", "att"] },
    { name: "Trossard", roles: ["att"] },
  ],
};

const eventWeights: Array<{ type: MatchEventType; weight: number; role: Player["roles"][number] }> = [
  { type: "possession", weight: 28, role: "mid" },
  { type: "tackle", weight: 16, role: "def" },
  { type: "throw_in", weight: 12, role: "def" },
  { type: "foul", weight: 11, role: "mid" },
  { type: "free_kick", weight: 8, role: "mid" },
  { type: "corner", weight: 6, role: "att" },
  { type: "offside", weight: 5, role: "att" },
  { type: "shot", weight: 5, role: "att" },
  { type: "shot_on_target", weight: 3, role: "att" },
  { type: "save", weight: 2, role: "gk" },
  { type: "yellow_card", weight: 1.6, role: "def" },
  { type: "goal", weight: 0.8, role: "att" },
  { type: "red_card", weight: 0.08, role: "def" },
  { type: "substitution", weight: 0.04, role: "mid" },
];

export function createMockEvent(matchId: string, sequence: number, minute: number): MatchEvent {
  const team = chooseTeam(sequence);
  const type = chooseEventType(minute);
  const role = eventWeights.find((item) => item.type === type)?.role ?? "mid";
  const player = choosePlayer(team, role, sequence, minute);

  return {
    id: `${matchId}-${sequence}-${minute}-${type}`,
    minute,
    type,
    team,
    player,
    timestamp: new Date().toISOString(),
  };
}

function chooseTeam(sequence: number): Team {
  const pressure = Math.sin(sequence / 6) + Math.random() * 1.35;
  return pressure > 0.45 ? "Team A" : "Team B";
}

function chooseEventType(minute: number): MatchEventType {
  const adjustedWeights = eventWeights.map((item) => {
    if (item.type === "substitution") {
      return { ...item, weight: minute >= 55 ? 2.6 : 0 };
    }
    if (item.type === "goal") {
      const lateGameLift = minute >= 70 ? 1.35 : 1;
      return { ...item, weight: item.weight * lateGameLift };
    }
    if (item.type === "yellow_card") {
      const derbyTension = minute >= 35 ? 1.55 : 0.7;
      return { ...item, weight: item.weight * derbyTension };
    }
    if (item.type === "red_card") {
      return { ...item, weight: minute >= 60 ? item.weight : 0.01 };
    }
    if (item.type === "shot_on_target" || item.type === "shot" || item.type === "corner") {
      return { ...item, weight: item.weight * attackingTempo(minute) };
    }
    return item;
  });

  const total = adjustedWeights.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;

  for (const item of adjustedWeights) {
    cursor -= item.weight;
    if (cursor <= 0) return item.type;
  }

  return "possession";
}

function attackingTempo(minute: number) {
  if (minute < 15) return 0.75;
  if (minute >= 40 && minute <= 45) return 1.2;
  if (minute >= 75) return 1.45;
  return 1;
}

function choosePlayer(team: Team, role: Player["roles"][number], sequence: number, minute: number) {
  const candidates = players[team].filter((player) => player.roles.includes(role));
  const pool = candidates.length > 0 ? candidates : players[team];
  return pool[(sequence + minute) % pool.length].name;
}
