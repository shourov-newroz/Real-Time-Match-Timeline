import { motion as m } from 'motion/react';
import { Shield } from 'lucide-react';
import { entryMotion } from '../motion/motionTokens';
import { useMatchStore } from '../store/matchStore';
import { teamLabel } from '../utils/eventLabel';
import { AnimatedNumber } from './AnimatedNumber';

export function LiveScore() {
  const homeScore = useMatchStore((state) => state.homeScore);
  const awayScore = useMatchStore((state) => state.awayScore);
  const minute = useMatchStore((state) => state.currentMinute);
  const status = useMatchStore((state) => state.matchStatus);
  const statusLabel =
    status === "idle"
      ? "Ready"
      : status === "live"
        ? "Live"
        : status === "paused"
          ? "Paused"
          : "Full Time";

  return (
    <section className='rounded-[8px] border border-white/10 bg-gradient-to-br from-pitch-850 via-pitch-900 to-pitch-950 p-5 shadow-glow md:p-7'>
      <div className='grid items-center gap-5 md:grid-cols-[1fr_auto_1fr]'>
        <TeamBlock
          name={teamLabel['Team A']}
          side='Home'
          align='left'
          tone='blue'
        />
        <div className='text-center'>
          <m.div
            key={`${status}-${minute}`}
            className='mb-2 inline-flex transform-gpu items-center rounded-full border border-warning-500/30 bg-warning-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-warning-500 will-change-transform'
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={entryMotion.transition}
            aria-live='polite'
            aria-atomic='true'
          >
            {statusLabel} -
            <AnimatedNumber
              value={minute}
              suffix="'"
              containerClassName='ml-1 min-w-6'
            />
          </m.div>
          <div
            aria-live='polite'
            aria-atomic='true'
            className='flex items-center justify-center gap-4 text-white'
          >
            <ScoreValue value={homeScore} />
            <span className='text-6xl font-black leading-none text-slate-500 md:text-7xl'>
              :
            </span>
            <ScoreValue value={awayScore} />
          </div>
          <p className='mt-3 text-xs text-slate-500'>
            Premier League - Matchday 28
          </p>
        </div>
        <TeamBlock
          name={teamLabel['Team B']}
          side='Away'
          align='right'
          tone='red'
        />
      </div>
    </section>
  );
}

function ScoreValue({ value }: { value: number }) {
  return (
    <AnimatedNumber
      value={value}
      containerClassName='w-12 sm:w-16'
      className={`text-6xl font-black leading-none tracking-tighter md:text-7xl ${
        value > 0 ? 'text-white' : 'text-slate-550'
      }`}
    />
  );
}

function TeamBlock({
  name,
  side,
  align,
  tone,
}: {
  name: string;
  side: string;
  align: 'left' | 'right';
  tone: 'blue' | 'red';
}) {
  const reverse = align === 'right';
  const ring =
    tone === 'blue'
      ? 'border-electric-400/35 bg-electric-500/10 text-electric-400'
      : 'border-red-400/35 bg-red-500/10 text-red-400';

  return (
    <div
      className={`flex items-center gap-3 ${
        reverse ? 'justify-end text-right' : ''
      }`}
    >
      {!reverse && <Badge className={ring} label={name[0]} />}
      <div>
        <h2 className='text-base font-bold text-white md:text-lg'>{name}</h2>
        <p className='mt-1 text-xs text-slate-500'>{side}</p>
      </div>
      {reverse && <Badge className={ring} label={name[0]} />}
    </div>
  );
}

function Badge({ className, label }: { className: string; label: string }) {
  return (
    <div
      className={`grid h-12 w-12 place-items-center rounded-full border ${className}`}
    >
      <Shield className='h-5 w-5' />
      <span className='sr-only'>{label}</span>
    </div>
  );
}
