import { motion as m } from 'motion/react';
import type { CSSProperties } from 'react';
import { entryMotion } from '../motion/motionTokens';
import type { MatchEvent } from '../types/match';
import { eventAccent, EventIcon } from '../utils/eventIcon';
import { eventLabel, teamShort } from '../utils/eventLabel';

export function TimelineItem({
  event,
  shouldAnimateEntry = false,
  containerStyle,
}: {
  event: MatchEvent;
  shouldAnimateEntry?: boolean;
  containerStyle?: CSSProperties;
}) {
  const accent = eventAccent(event.type);
  const isHome = event.team === 'Team A';

  return (
    <div
      id={`timeline-item-${event.id}`}
      style={containerStyle}
      className='cursor-default'
    >
      <m.article
        key={event.id}
        initial={
          shouldAnimateEntry ? { opacity: 0, y: -14, scale: 0.96 } : false
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={
          shouldAnimateEntry ? entryMotion.transition : { duration: 0 }
        }
        className={`flex min-h-[76px] transform-gpu rounded-[8px] border bg-pitch-800/88 px-4 py-3 shadow-sm will-change-transform ${accent}`}
      >
        <div className='grid w-full grid-cols-[auto_1fr_auto] items-start gap-3'>
          <div className='min-w-8 text-sm font-black text-warning-500'>
            {event.minute}&apos;
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
      </m.article>
    </div>
  );
}
