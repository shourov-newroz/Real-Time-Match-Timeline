import { ConnectionStatus } from "./components/ConnectionStatus";
import { LiveScore } from "./components/LiveScore";
import { MatchControls } from "./components/MatchControls";
import { MatchSummary } from "./components/MatchSummary";
import { MatchTimeline } from "./components/MatchTimeline";
import { useMatchSocket } from "./hooks/useMatchSocket";

export default function App() {
  const controls = useMatchSocket();

  return (
    <main className="min-h-screen px-4 py-5 text-slate-100 md:px-8 md:py-7">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Real-Time Match Timeline</h1>
            <p className="mt-1 text-sm text-slate-500">Live football event stream with stable reading state.</p>
          </div>
          <ConnectionStatus />
        </header>
        <div className="space-y-5">
          <LiveScore />
          <MatchControls {...controls} />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <MatchTimeline />
            <MatchSummary />
          </div>
        </div>
      </div>
    </main>
  );
}
