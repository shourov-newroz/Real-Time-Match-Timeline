import type { CSSProperties } from 'react';
import { motion } from 'motion/react';
import { motionTokens } from '../motion/motionTokens';
import type { MatchEvent } from '../types/match';
import { eventAccent, EventIcon } from '../utils/eventIcon';
import { eventLabel, teamShort } from '../utils/eventLabel';
import { AnimatedNumber } from './AnimatedNumber';

export function TimelineItem({
  event,
  layoutEnabled,
  animateEntry,
  containerStyle,
  measureRef,
}: {
  event: MatchEvent;
  layoutEnabled: boolean;
  animateEntry: boolean;
  containerStyle?: CSSProperties;
  measureRef?: (node: HTMLElement | null) => void;
}) {
  const accent = eventAccent(event.type);
  const isHome = event.team === 'Team A';

  return (
    // Outer div: positional shell for the virtualizer — no ref here, no initial=false
    // so it doesn't interfere with the inner entry animation.
    <div
      id={`timeline-item-${event.id}`}
      style={containerStyle}
      className='cursor-default'
    >
      <motion.article
        // Only the article is measured: one ref, one element, correct height.
        ref={measureRef}
        layout={layoutEnabled}
        // Do NOT set initial={false} globally — let animateEntry control it.
        // When animateEntry is false we pass `false` to skip the initial state
        // without locking out future animateEntry=true renders.
        initial={
          animateEntry
            ? {
                y: -14,
                opacity: 0,
                scale: 0.985,
                boxShadow: '0 0 0 rgba(56, 189, 248, 0)',
              }
            : false
        }
        animate={
          animateEntry
            ? {
                y: 0,
                opacity: 1,
                scale: 1,
                // Keyframe sequence: transparent → electric glow → settled shadow
                boxShadow: [
                  '0 0 0 rgba(56, 189, 248, 0)',
                  '0 12px 28px rgba(56, 189, 248, 0.16)',
                  '0 8px 18px rgba(15, 23, 42, 0.18)',
                ],
              }
            : {
                y: 0,
                opacity: 1,
                scale: 1,
                boxShadow: '0 8px 18px rgba(15, 23, 42, 0.18)',
              }
        }
        exit={{ opacity: 0, scale: 0.985 }}
        transition={{
          y: {
            type: 'spring',
            stiffness: 320,
            damping: 30,
            mass: 0.75,
          },
          scale: {
            type: 'spring',
            stiffness: 300,
            damping: 26,
            mass: 0.8,
          },
          opacity: { duration: 0.22, ease: motionTokens.ease },
          boxShadow: { duration: 0.42, ease: motionTokens.ease },
        }}
        className={`flex min-h-[76px] transform-gpu rounded-[8px] border bg-pitch-800/88 px-4 py-3 shadow-sm will-change-transform ${accent}`}
      >
        <div className='grid grid-cols-[auto_1fr_auto] items-start gap-3 w-full'>
          <div className='min-w-8 text-sm font-black text-warning-500'>
            <AnimatedNumber
              value={event.minute}
              suffix="'"
              containerClassName='min-w-8'
            />
          </div>
          <div className='flex min-w-0 gap-3'>
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${accent}`}
            >
              <EventIcon type={event.type} className='h-3.5 w-3.5' />
            </span>
            <div className='min-w-0'>
              <h3 className='truncate text-sm font-bold text-white'>
                {event.player}
              </h3>
              <p className='mt-1 text-xs text-slate-400'>
                {eventLabel[event.type]}{' '}
                <span className='mx-1 text-slate-600'>-</span>
                <span className={isHome ? 'text-electric-400' : 'text-red-400'}>
                  {teamShort[event.team]}
                </span>
              </p>
            </div>
          </div>
          <span className='justify-self-end text-right text-[10px] font-bold uppercase tracking-wide text-slate-500'>
            {isHome ? 'HM' : 'AW'}
          </span>
        </div>
      </motion.article>
    </div>
  );
}
