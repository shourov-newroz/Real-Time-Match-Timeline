import { AnimatePresence, motion as m } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { buttonMotion, entryMotion } from '../motion/motionTokens';
import { AnimatedNumber } from './AnimatedNumber';

export function BackToLatestButton({
  count,
  show,
  onClick,
}: {
  count: number;
  show: boolean;
  onClick: () => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={entryMotion.transition}
          className='absolute bottom-4 left-1/2 z-10 -translate-x-1/2'
        >
          <m.button
            {...buttonMotion}
            type='button'
            onClick={onClick}
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            className='inline-flex transform-gpu cursor-pointer items-center gap-1 rounded-full border border-electric-400/40 bg-electric-500 px-3 py-1 text-xs font-bold text-white shadow-xl shadow-electric-500/25 will-change-transform focus:outline-none focus:ring-2 focus:ring-electric-400/70 md:gap-2 md:px-4 md:py-2 md:text-sm'
          >
            {count > 0 ? (
              <>
                <AnimatedNumber value={count} containerClassName='min-w-4' />
                <span>New Event{count === 1 ? '' : 's'}</span>
              </>
            ) : (
              'Back to Latest'
            )}
            <ArrowUp className='h-4 w-4' />
          </m.button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
