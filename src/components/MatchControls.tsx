import { motion as m } from "motion/react";
import { AlertCircle, Pause, Play, RotateCcw } from "lucide-react";
import { buttonMotion } from "../motion/motionTokens";
import { useMatchStore } from "../store/matchStore";

type Props = {
  startMatch: () => void;
  pauseMatch: () => void;
  resumeMatch: () => void;
  resetMatch: () => void;
};

export function MatchControls({ startMatch, pauseMatch, resumeMatch, resetMatch }: Props) {
  const status = useMatchStore((state) => state.matchStatus);
  const connectionStatus = useMatchStore((state) => state.connectionStatus);
  const commandState = useMatchStore((state) => state.commandState);
  const connectionBlocked = connectionStatus !== "connected";
  const hasPendingCommand = Object.values(commandState).some((command) => command.pending);
  const latestError = Object.values(commandState)
    .map((command) => command.error)
    .find((error): error is string => Boolean(error));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <ControlButton
          label="Start"
          pendingLabel="Starting..."
          icon={Play}
          onClick={startMatch}
          disabled={connectionBlocked || hasPendingCommand || status === "live"}
          pending={commandState.start.pending}
        />
        <ControlButton
          label="Pause"
          pendingLabel="Pausing..."
          icon={Pause}
          onClick={pauseMatch}
          disabled={connectionBlocked || hasPendingCommand || status !== "live"}
          pending={commandState.pause.pending}
        />
        <ControlButton
          label="Resume"
          pendingLabel="Resuming..."
          icon={Play}
          onClick={resumeMatch}
          disabled={connectionBlocked || hasPendingCommand || status !== "paused"}
          pending={commandState.resume.pending}
        />
        <ControlButton
          label="Reset"
          pendingLabel="Resetting..."
          icon={RotateCcw}
          onClick={resetMatch}
          disabled={connectionBlocked || hasPendingCommand}
          pending={commandState.reset.pending}
          secondary
        />
      </div>
      <div className="min-h-5 text-center text-xs">
        {connectionBlocked ? (
          <p aria-live="polite" className="font-semibold text-warning-500">
            Controls are unavailable while the socket is {connectionStatus}.
          </p>
        ) : latestError ? (
          <p aria-live="polite" className="inline-flex items-center gap-1 font-semibold text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            {latestError}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ControlButton({
  label,
  pendingLabel,
  icon: Icon,
  onClick,
  disabled,
  pending,
  secondary = false,
}: {
  label: string;
  pendingLabel: string;
  icon: typeof Play;
  onClick: () => void;
  disabled: boolean;
  pending: boolean;
  secondary?: boolean;
}) {
  const baseClassName = secondary
    ? "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
    : "bg-electric-500 text-white shadow-lg shadow-electric-500/20 hover:bg-electric-400";

  return (
    <m.button
      {...buttonMotion}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={pending}
      className={`inline-flex transform-gpu items-center gap-2 rounded-[8px] px-4 py-2 text-sm font-bold transition-colors will-change-transform focus:outline-none focus:ring-2 focus:ring-electric-400/70 ${baseClassName} ${
        disabled ? "cursor-not-allowed opacity-55 hover:bg-inherit" : "cursor-pointer"
      }`}
    >
      <Icon className={`h-4 w-4 ${pending ? "animate-pulse" : ""}`} />
      {pending ? pendingLabel : label}
    </m.button>
  );
}
