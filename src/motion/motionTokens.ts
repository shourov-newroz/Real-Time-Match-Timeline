export const motionTokens = {
  fast: 0.18,
  normal: 0.32,
  slow: 0.55,
  ease: [0.16, 1, 0.3, 1] as const,
  spring: {
    type: 'spring',
    stiffness: 260,
    damping: 28,
    mass: 0.85,
  } as const,
  softSpring: {
    type: 'spring',
    stiffness: 180,
    damping: 24,
    mass: 0.9,
  } as const,
  numberSpring: {
    type: 'spring',
    stiffness: 350,
    damping: 25,
  } as const,
};

export const buttonMotion = {
  whileHover: { y: -1, scale: 1.015 },
  whileTap: { scale: 0.98 },
  transition: motionTokens.spring,
};

export const entryMotion = {
  transition: motionTokens.softSpring,
};
