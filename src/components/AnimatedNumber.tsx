import { AnimatePresence, motion as m } from 'motion/react';
import { motionTokens } from '../motion/motionTokens';

type AnimatedNumberProps = {
  value: number;
  className?: string;
  containerClassName?: string;
  suffix?: string;
};

export function AnimatedNumber({
  value,
  className = '',
  containerClassName = '',
  suffix = '',
}: AnimatedNumberProps) {
  return (
    <span
      className={`relative inline-block overflow-hidden text-center select-none ${containerClassName}`}
    >
      <AnimatePresence mode='wait' initial={false}>
        <m.span
          key={`${value}${suffix}`}
          initial={{ y: -15, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 15, opacity: 0, scale: 0.8 }}
          transition={motionTokens.numberSpring}
          className={`block transform-gpu will-change-transform ${className}`}
        >
          {value}
          {suffix}
        </m.span>
      </AnimatePresence>
    </span>
  );
}
