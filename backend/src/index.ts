import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import type { CommandAck, MatchEvent, MatchSnapshot, MatchStatus } from "@rtmt/shared";
import { createMockEvent } from "./mockEvents.js";

const PORT = Number(process.env.PORT ?? 4000);
const REAL_MATCH_MINUTE_MS = 60_000;
const MIN_STREAM_DELAY_MS = 1_000;
const MAX_STREAM_DELAY_MS = 2_000;

function parseClientOrigins() {
  const configured = process.env.CLIENT_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (configured?.length) return configured;
  return ["http://localhost:5173"];
}

const clientOrigins = parseClientOrigins();

const app = express();
app.use(cors({ origin: clientOrigins }));
app.get("/health", (_req, res) => {
  res.json({ ok: true, status: match.status, minute: getCurrentMinute() });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: clientOrigins, methods: ["GET", "POST"] },
});

type MatchRuntime = {
  status: MatchStatus;
  matchId: string;
  currentMinute: number;
  startedAt: number | null;
  pausedAt: number | null;
  accumulatedPausedMs: number;
  eventSequence: number;
  eventTimer: NodeJS.Timeout | null;
  clockTimer: NodeJS.Timeout | null;
  events: MatchEvent[];
};

const match: MatchRuntime = {
  status: "idle",
  matchId: "match-1",
  currentMinute: 0,
  startedAt: null,
  pausedAt: null,
  accumulatedPausedMs: 0,
  eventSequence: 0,
  eventTimer: null,
  clockTimer: null,
  events: [],
};

function getCurrentMinute() {
  if (!match.startedAt) return 0;
  const pausedDuration = match.status === "paused" && match.pausedAt ? Date.now() - match.pausedAt : 0;
  const elapsed = Date.now() - match.startedAt - match.accumulatedPausedMs - pausedDuration;
  return Math.min(90, Math.max(1, Math.floor(elapsed / REAL_MATCH_MINUTE_MS) + 1));
}

function emittedEvents() {
  return [...match.events].sort((a, b) => b.minute - a.minute);
}

function emitSnapshot(eventName: "match_started" | "match_resumed") {
  io.emit(eventName, snapshotPayload());
}

function snapshotPayload(): MatchSnapshot {
  return {
    events: emittedEvents(),
    currentMinute: getCurrentMinute(),
    matchStatus: match.status,
  };
}

function streamNextEvent() {
  if (match.status !== "live") return;

  const minute = getCurrentMinute();
  match.currentMinute = minute;
  if (minute >= 90) {
    match.status = "ended";
    clearTimers();
    io.emit("match_ended");
    return;
  }

  const liveEvent = createMockEvent(match.matchId, match.eventSequence, minute);
  match.eventSequence += 1;
  match.events.unshift(liveEvent);
  io.emit("match_minute", match.currentMinute);
  io.emit("match_event", liveEvent);
  scheduleNextEvent();
}

function scheduleNextEvent(delayMs = randomStreamDelay()) {
  if (match.eventTimer || match.status !== "live") return;
  match.eventTimer = setTimeout(() => {
    match.eventTimer = null;
    streamNextEvent();
  }, delayMs);
}

function randomStreamDelay() {
  return Math.floor(MIN_STREAM_DELAY_MS + Math.random() * (MAX_STREAM_DELAY_MS - MIN_STREAM_DELAY_MS));
}

function startClock() {
  if (match.clockTimer || match.status !== "live") return;
  match.clockTimer = setInterval(() => {
    match.currentMinute = getCurrentMinute();
    io.emit("match_minute", match.currentMinute);
    if (match.currentMinute >= 90) {
      match.status = "ended";
      clearTimers();
      io.emit("match_ended");
    }
  }, 1_000);
}

function clearTimers() {
  if (match.eventTimer) clearTimeout(match.eventTimer);
  if (match.clockTimer) clearInterval(match.clockTimer);
  match.eventTimer = null;
  match.clockTimer = null;
}

function successAck(): CommandAck {
  return { ok: true, snapshot: snapshotPayload() };
}

function errorAck(error: string): CommandAck {
  return { ok: false, error, snapshot: snapshotPayload() };
}

function startMatch(): CommandAck {
  if (match.status === "live") {
    emitSnapshot("match_started");
    return successAck();
  }
  if (match.status === "paused") {
    return resumeMatch();
  }
  match.status = "live";
  match.startedAt = Date.now();
  match.pausedAt = null;
  match.accumulatedPausedMs = 0;
  match.currentMinute = 1;
  match.eventSequence = 0;
  match.matchId = `match-${Date.now()}`;
  match.events = [];
  emitSnapshot("match_started");
  startClock();
  scheduleNextEvent(1_000);
  return successAck();
}

function pauseMatch(): CommandAck {
  if (match.status !== "live") return errorAck("Match is not currently live.");
  match.status = "paused";
  match.pausedAt = Date.now();
  clearTimers();
  io.emit("match_paused");
  return successAck();
}

function resumeMatch(): CommandAck {
  if (match.status !== "paused") return errorAck("Match is not currently paused.");
  if (match.pausedAt) {
    match.accumulatedPausedMs += Date.now() - match.pausedAt;
  }
  match.pausedAt = null;
  match.status = "live";
  emitSnapshot("match_resumed");
  startClock();
  scheduleNextEvent(1_000);
  return successAck();
}

function resetMatch(): CommandAck {
  clearTimers();
  match.status = "idle";
  match.currentMinute = 0;
  match.startedAt = null;
  match.pausedAt = null;
  match.accumulatedPausedMs = 0;
  match.eventSequence = 0;
  match.matchId = `match-${Date.now()}`;
  match.events = [];
  io.emit("match_reset");
  return successAck();
}

io.on("connection", (socket) => {
  socket.emit("socket_connected");
  socket.emit("match_minute", getCurrentMinute());
  if (match.status !== "idle") {
    socket.emit("match_started", snapshotPayload());
  }

  socket.on("get_match_snapshot", (ack?: (payload: MatchSnapshot) => void) => {
    ack?.(snapshotPayload());
  });
  socket.on("start_match", (ack?: (payload: CommandAck) => void) => {
    ack?.(startMatch());
  });
  socket.on("pause_match", (ack?: (payload: CommandAck) => void) => {
    ack?.(pauseMatch());
  });
  socket.on("resume_match", (ack?: (payload: CommandAck) => void) => {
    ack?.(resumeMatch());
  });
  socket.on("reset_match", (ack?: (payload: CommandAck) => void) => {
    ack?.(resetMatch());
  });
});

httpServer.listen(PORT, () => {
  console.log(`Match timeline server running on port ${PORT}`);
  console.log(`Allowed client origins: ${clientOrigins.join(", ")}`);
});
