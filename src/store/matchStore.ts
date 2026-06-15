import { create } from "zustand";
import type { ConnectionStatus, MatchCommand, EventFilter, MatchEvent, MatchSnapshot, MatchStatus } from "../types/match";

type MatchState = {
  events: MatchEvent[];
  homeScore: number;
  awayScore: number;
  currentMinute: number;
  activeFilter: EventFilter;
  connectionStatus: ConnectionStatus;
  matchStatus: MatchStatus;
  newEventsCount: number;
  isViewingLatest: boolean;
  commandState: Record<MatchCommand, { pending: boolean; error: string | null }>;
  addEvent: (event: MatchEvent) => void;
  hydrateSnapshot: (snapshot: MatchSnapshot) => void;
  hydrateEvents: (events: MatchEvent[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setMatchStatus: (status: MatchStatus) => void;
  setCurrentMinute: (minute: number) => void;
  setFilter: (filter: EventFilter) => void;
  setViewingLatest: (value: boolean) => void;
  setCommandPending: (command: MatchCommand, pending: boolean) => void;
  setCommandError: (command: MatchCommand, error: string | null) => void;
  clearCommandErrors: () => void;
  incrementNewEvents: () => void;
  resetNewEvents: () => void;
  resetMatch: () => void;
};

function createInitialCommandState() {
  return {
    start: { pending: false, error: null },
    pause: { pending: false, error: null },
    resume: { pending: false, error: null },
    reset: { pending: false, error: null },
  } satisfies Record<MatchCommand, { pending: boolean; error: string | null }>;
}

function scoreFor(events: MatchEvent[], team: "Team A" | "Team B") {
  return events.filter((event) => event.type === "goal" && event.team === team).length;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  events: [],
  homeScore: 0,
  awayScore: 0,
  currentMinute: 0,
  activeFilter: "all",
  connectionStatus: "disconnected",
  matchStatus: "idle",
  newEventsCount: 0,
  isViewingLatest: true,
  commandState: createInitialCommandState(),
  addEvent: (event) =>
    set((state) => {
      if (state.events.some((existing) => existing.id === event.id)) return state;
      const events = [event, ...state.events];
      return {
        events,
        currentMinute: Math.max(state.currentMinute, event.minute),
        homeScore: event.type === "goal" && event.team === "Team A" ? state.homeScore + 1 : state.homeScore,
        awayScore: event.type === "goal" && event.team === "Team B" ? state.awayScore + 1 : state.awayScore,
      };
    }),
  hydrateSnapshot: (snapshot) =>
    set({
      events: [...snapshot.events].sort((a, b) => b.minute - a.minute),
      currentMinute: snapshot.currentMinute,
      matchStatus: snapshot.matchStatus,
      homeScore: scoreFor(snapshot.events, "Team A"),
      awayScore: scoreFor(snapshot.events, "Team B"),
      newEventsCount: 0,
      isViewingLatest: true,
    }),
  hydrateEvents: (events) =>
    set({
      events: [...events].sort((a, b) => b.minute - a.minute),
      homeScore: scoreFor(events, "Team A"),
      awayScore: scoreFor(events, "Team B"),
    }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setMatchStatus: (matchStatus) => set({ matchStatus }),
  setCurrentMinute: (currentMinute) => set({ currentMinute }),
  setFilter: (activeFilter) => set({ activeFilter }),
  setViewingLatest: (isViewingLatest) => set({ isViewingLatest }),
  setCommandPending: (command, pending) =>
    set((state) => ({
      commandState: {
        ...state.commandState,
        [command]: { pending, error: pending ? null : state.commandState[command].error },
      },
    })),
  setCommandError: (command, error) =>
    set((state) => ({
      commandState: {
        ...state.commandState,
        [command]: { pending: false, error },
      },
    })),
  clearCommandErrors: () =>
    set((state) => ({
      commandState: {
        start: { pending: state.commandState.start.pending, error: null },
        pause: { pending: state.commandState.pause.pending, error: null },
        resume: { pending: state.commandState.resume.pending, error: null },
        reset: { pending: state.commandState.reset.pending, error: null },
      },
    })),
  incrementNewEvents: () => set({ newEventsCount: get().newEventsCount + 1 }),
  resetNewEvents: () => set({ newEventsCount: 0 }),
  resetMatch: () =>
    set({
      events: [],
      homeScore: 0,
      awayScore: 0,
      currentMinute: 0,
      activeFilter: "all",
      matchStatus: "idle",
      newEventsCount: 0,
      isViewingLatest: true,
      commandState: createInitialCommandState(),
    }),
}));
