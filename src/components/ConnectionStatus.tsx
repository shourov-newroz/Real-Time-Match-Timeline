import { motion as m } from "motion/react";
import { Wifi, WifiOff } from "lucide-react";
import { motionTokens } from "../motion/motionTokens";
import { useMatchStore } from "../store/matchStore";

const styles = {
  connected: "border-grass-500/30 bg-grass-500/10 text-grass-400",
  reconnecting: "border-warning-500/30 bg-warning-500/10 text-warning-500",
  disconnected: "border-red-500/30 bg-red-500/10 text-red-400",
};

const labels = {
  connected: "Connected",
  reconnecting: "Reconnecting...",
  disconnected: "Disconnected",
};

export function ConnectionStatus() {
  const status = useMatchStore((state) => state.connectionStatus);
  const isActive = status !== "disconnected";

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${styles[status]}`}
    >
      <m.span
        className="relative flex h-2.5 w-2.5"
        animate={isActive ? { opacity: [0.65, 1, 0.65] } : { opacity: 1 }}
        transition={isActive ? { duration: motionTokens.slow * 2.4, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-current" />
      </m.span>
      {status === "disconnected" ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
      <span>{labels[status]}</span>
    </div>
  );
}
