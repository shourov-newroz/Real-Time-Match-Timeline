import { useCallback, useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useMatchStore } from "../store/matchStore";
import type { CommandAck, MatchCommand, MatchEvent, MatchSnapshot } from "../types/match";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000";
const ACK_TIMEOUT_MS = 5_000;

type CommandEventName = "start_match" | "pause_match" | "resume_match" | "reset_match";

const commandEventMap: Record<MatchCommand, CommandEventName> = {
  start: "start_match",
  pause: "pause_match",
  resume: "resume_match",
  reset: "reset_match",
};

export function useMatchSocket() {
  const hydrateSnapshot = useMatchStore((state) => state.hydrateSnapshot);
  const addEvent = useMatchStore((state) => state.addEvent);
  const setConnectionStatus = useMatchStore((state) => state.setConnectionStatus);
  const setMatchStatus = useMatchStore((state) => state.setMatchStatus);
  const setCurrentMinute = useMatchStore((state) => state.setCurrentMinute);
  const setCommandPending = useMatchStore((state) => state.setCommandPending);
  const setCommandError = useMatchStore((state) => state.setCommandError);
  const clearCommandErrors = useMatchStore((state) => state.clearCommandErrors);
  const socketRef = useRef<Socket | null>(null);

  const requestSnapshot = useCallback(async (socket: Socket) => {
    const snapshot = await new Promise<MatchSnapshot>((resolve, reject) => {
      socket.timeout(ACK_TIMEOUT_MS).emit("get_match_snapshot", (error: Error | null, payload?: MatchSnapshot) => {
        if (error || !payload) {
          reject(error ?? new Error("Snapshot request failed."));
          return;
        }
        resolve(payload);
      });
    });

    hydrateSnapshot(snapshot);
  }, [hydrateSnapshot]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
    });

    socketRef.current = socket;
    setConnectionStatus("reconnecting");

    socket.on("connect", async () => {
      setConnectionStatus("connected");
      clearCommandErrors();

      try {
        await requestSnapshot(socket);
      } catch {
        setConnectionStatus("reconnecting");
      }
    });

    socket.on("connect_error", () => {
      setConnectionStatus("reconnecting");
    });

    socket.on("disconnect", () => {
      setConnectionStatus("reconnecting");
    });

    socket.io.on("reconnect_attempt", () => {
      setConnectionStatus("reconnecting");
    });

    socket.on("match_started", (snapshot: MatchSnapshot) => {
      hydrateSnapshot(snapshot);
    });

    socket.on("match_resumed", (snapshot: MatchSnapshot) => {
      hydrateSnapshot(snapshot);
    });

    socket.on("match_minute", (minute: number) => {
      setCurrentMinute(minute);
    });

    socket.on("match_event", (event: MatchEvent) => {
      addEvent(event);
    });

    socket.on("match_paused", () => {
      setMatchStatus("paused");
    });

    socket.on("match_reset", () => {
      hydrateSnapshot({
        events: [],
        currentMinute: 0,
        matchStatus: "idle",
      });
    });

    socket.on("match_ended", () => {
      setMatchStatus("ended");
      setCurrentMinute(90);
    });

    return () => {
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setConnectionStatus("disconnected");
    };
  }, [
    addEvent,
    clearCommandErrors,
    hydrateSnapshot,
    requestSnapshot,
    setConnectionStatus,
    setCurrentMinute,
    setMatchStatus,
  ]);

  const sendCommand = useCallback(async (command: MatchCommand) => {
    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      setCommandError(command, "Connection is unavailable.");
      return;
    }

    setCommandPending(command, true);

    try {
      const ack = await new Promise<CommandAck>((resolve, reject) => {
        socket
          .timeout(ACK_TIMEOUT_MS)
          .emit(commandEventMap[command], (error: Error | null, payload?: CommandAck) => {
            if (error || !payload) {
              reject(error ?? new Error("Command acknowledgement failed."));
              return;
            }
            resolve(payload);
          });
      });

      if (!ack.ok) {
        setCommandError(command, ack.error ?? "Command failed.");
        if (ack.snapshot) {
          hydrateSnapshot(ack.snapshot);
        }
        return;
      }

      if (ack.snapshot) {
        hydrateSnapshot(ack.snapshot);
      }

      setCommandError(command, null);
    } catch {
      setCommandError(command, "Timed out waiting for the server.");
    } finally {
      setCommandPending(command, false);
    }
  }, [hydrateSnapshot, setCommandError, setCommandPending]);

  return {
    startMatch: useCallback(() => {
      void sendCommand("start");
    }, [sendCommand]),
    pauseMatch: useCallback(() => {
      void sendCommand("pause");
    }, [sendCommand]),
    resumeMatch: useCallback(() => {
      void sendCommand("resume");
    }, [sendCommand]),
    resetMatch: useCallback(() => {
      void sendCommand("reset");
    }, [sendCommand]),
  };
}
