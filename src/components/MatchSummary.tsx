import { motion as m } from 'motion/react';
import { BarChart3, Clock, Radio, Shield } from 'lucide-react';
import { useMatchStats } from '../hooks/useMatchStats';
import { entryMotion, motionTokens } from '../motion/motionTokens';
import { useMatchStore } from '../store/matchStore';
import { eventLabel, teamLabel, teamShort } from '../utils/eventLabel';
import { AnimatedNumber } from './AnimatedNumber';

export function MatchSummary() {
  const currentMinute = useMatchStore((state) => state.currentMinute);
  const matchStatus = useMatchStore((state) => state.matchStatus);
  const { latest, teamA, teamB, totals } = useMatchStats();

  return (
    <aside className='space-y-4'>
      <m.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={entryMotion.transition}
        className='transform-gpu rounded-[8px] border border-white/10 bg-pitch-800/90 p-4 shadow-glow will-change-transform'
      >
        <h2 className='mb-4 flex items-center gap-2 text-sm font-black text-white'>
          <BarChart3 className='h-4 w-4 text-electric-400' />
          Match Summary
        </h2>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
          <Metric label='Goals' value={totals.goals} tone='text-grass-400' />
          <Metric label='Fouls' value={totals.fouls} tone='text-warning-500' />
          <Metric
            label='Yellows'
            value={totals.yellows}
            tone='text-yellow-300'
          />
          <Metric label='Reds' value={totals.reds} tone='text-red-400' />
          <Metric label='Shots' value={totals.shots} tone='text-sky-300' />
          <Metric
            label='Set Pieces'
            value={totals.setPieces}
            tone='text-cyan-300'
          />
          <Metric label='Subs' value={totals.subs} tone='text-violet-300' />
          <Metric
            label='Minute'
            value={currentMinute}
            tone='text-electric-400'
          />
        </div>
        <div className='mt-4 border-t border-white/10 pt-4'>
          <p className='text-[11px] font-bold uppercase text-slate-500'>
            Latest Event
          </p>
          <p aria-live='polite' aria-atomic='true' className='mt-2 text-sm text-slate-300'>
            {latest ? (
              <>
                <span className='font-bold text-white'>{latest.player}</span> -{' '}
                {latest.minute}' - {eventLabel[latest.type]} -{' '}
                <span
                  className={
                    latest.team === 'Team A'
                      ? 'text-electric-400'
                      : 'text-red-400'
                  }
                >
                  {teamShort[latest.team]}
                </span>
              </>
            ) : (
              'Waiting for match activity'
            )}
          </p>
        </div>
      </m.section>
      <m.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...entryMotion.transition, delay: 0.05 }}
        className='transform-gpu rounded-[8px] border border-white/10 bg-pitch-800/90 p-4 will-change-transform'
      >
        <h2 className='mb-3 flex items-center gap-2 text-sm font-black text-white'>
          <Radio className='h-4 w-4 text-electric-400' />
          Match State
        </h2>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-slate-400'>Status</span>
          <span className='font-bold capitalize text-white'>{matchStatus}</span>
        </div>
        <div className='mt-3 flex items-center justify-between text-sm'>
          <span className='flex items-center gap-2 text-slate-400'>
            <Clock className='h-4 w-4' />
            Clock
          </span>
          <span className='inline-flex items-center font-bold text-white'>
            <AnimatedNumber value={currentMinute} suffix="'" containerClassName='min-w-7' />
            <span className='ml-1'>/ 90'</span>
          </span>
        </div>
      </m.section>
      <HeadToHeadStats teamA={teamA} teamB={teamB} />
    </aside>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className='rounded-[8px] bg-pitch-950/60 p-3'>
      <AnimatedNumber
        value={value}
        className={`text-xl font-black ${tone}`}
        containerClassName='min-w-8'
      />
      <div className='mt-1 text-[11px] text-slate-500'>{label}</div>
    </div>
  );
}

function HeadToHeadStats({
  teamA,
  teamB,
}: {
  teamA: { goals: number; fouls: number; yellows: number; substitutions: number };
  teamB: { goals: number; fouls: number; yellows: number; substitutions: number };
}) {
  return (
    <m.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...entryMotion.transition, delay: 0.1 }}
      className='transform-gpu rounded-[8px] border border-white/10 bg-pitch-800/90 p-4 shadow-glow will-change-transform'
    >
      <h2 className='mb-4 flex items-center gap-2 text-sm font-black text-white'>
        <Shield className='h-4 w-4 text-electric-400' />
        Head-to-Head Stats
      </h2>
      <div className='space-y-5'>
        <ComparisonRow
          label='Goals'
          leftValue={teamA.goals}
          rightValue={teamB.goals}
          fillClass='bg-grass-500'
          trackClass='bg-grass-500/20'
        />
        <ComparisonRow
          label='Fouls'
          leftValue={teamA.fouls}
          rightValue={teamB.fouls}
          fillClass='bg-warning-500'
          trackClass='bg-warning-500/20'
        />
        <ComparisonRow
          label='Yellow Cards'
          leftValue={teamA.yellows}
          rightValue={teamB.yellows}
          fillClass='bg-yellow-400'
          trackClass='bg-yellow-400/20'
        />
        <ComparisonRow
          label='Substitutions'
          leftValue={teamA.substitutions}
          rightValue={teamB.substitutions}
          fillClass='bg-violet-500'
          trackClass='bg-violet-500/20'
        />
      </div>
      <div className='mt-5 border-t border-white/10 pt-4'>
        <div className='flex items-center justify-between text-sm'>
          <span className='flex items-center gap-2 text-electric-400'>
            <span className='h-2.5 w-2.5 rounded-full bg-electric-400' />
            {teamLabel['Team A']}
          </span>
          <span className='flex items-center gap-2 text-red-400'>
            {teamLabel['Team B']}
            <span className='h-2.5 w-2.5 rounded-full bg-red-400' />
          </span>
        </div>
      </div>
    </m.section>
  );
}

function ComparisonRow({
  label,
  leftValue,
  rightValue,
  fillClass,
  trackClass,
}: {
  label: string;
  leftValue: number;
  rightValue: number;
  fillClass: string;
  trackClass: string;
}) {
  const total = leftValue + rightValue;
  const leftWidth = total === 0 ? 50 : (leftValue / total) * 100;

  return (
    <div>
      <div className='mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500'>
        <AnimatedNumber
          value={leftValue}
          className='text-xl font-black normal-case tracking-normal text-white'
          containerClassName='min-w-7'
        />
        <span>{label}</span>
        <AnimatedNumber
          value={rightValue}
          className='text-xl font-black normal-case tracking-normal text-white'
          containerClassName='min-w-7'
        />
      </div>
      <div className={`h-2 rounded-full ${trackClass}`}>
        <m.div
          key={`${label}-${leftValue}-${rightValue}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: leftWidth / 100 }}
          transition={motionTokens.softSpring}
          className={`h-full w-full origin-left transform-gpu rounded-full will-change-transform ${fillClass}`}
        />
      </div>
      <div className='mt-2 flex items-center justify-between text-xs font-semibold'>
        <span className='text-electric-400'>{teamShort['Team A']}</span>
        <span className='text-red-400'>{teamShort['Team B']}</span>
      </div>
    </div>
  );
}
