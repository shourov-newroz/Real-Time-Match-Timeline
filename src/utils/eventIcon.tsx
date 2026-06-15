import { AlertTriangle, CircleDot, Flag, Footprints, Hand, MoveRight, RefreshCcw, ShieldCheck, Square, Target } from "lucide-react";
import type { MatchEventType } from "../types/match";

export function EventIcon({ type, className = "h-4 w-4" }: { type: MatchEventType; className?: string }) {
  if (type === "goal") return <CircleDot className={className} />;
  if (type === "foul") return <AlertTriangle className={className} />;
  if (type === "yellow_card") return <Square className={className} />;
  if (type === "red_card") return <Square className={className} />;
  if (type === "substitution") return <RefreshCcw className={className} />;
  if (type === "shot" || type === "shot_on_target") return <Target className={className} />;
  if (type === "save") return <ShieldCheck className={className} />;
  if (type === "corner" || type === "free_kick" || type === "offside") return <Flag className={className} />;
  if (type === "throw_in") return <Hand className={className} />;
  if (type === "tackle") return <Footprints className={className} />;
  return <MoveRight className={className} />;
}

export function eventAccent(type: MatchEventType) {
  if (type === "goal") return "border-grass-500/70 bg-grass-500/10 text-grass-400";
  if (type === "foul") return "border-warning-500/70 bg-warning-500/10 text-warning-500";
  if (type === "yellow_card") return "border-yellow-400/70 bg-yellow-400/10 text-yellow-300";
  if (type === "red_card") return "border-red-500/70 bg-red-500/10 text-red-400";
  if (type === "substitution") return "border-violet-500/70 bg-violet-500/10 text-violet-300";
  if (type === "shot" || type === "shot_on_target" || type === "save") return "border-sky-400/70 bg-sky-400/10 text-sky-300";
  if (type === "corner" || type === "free_kick" || type === "throw_in" || type === "offside") return "border-cyan-400/70 bg-cyan-400/10 text-cyan-300";
  return "border-slate-400/60 bg-slate-400/10 text-slate-300";
}

export function StatusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <Flag className={className} />;
}
