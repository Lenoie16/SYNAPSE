import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OpeningAnimationProps {
  onAnimationComplete: () => void;
}

const OpeningAnimation: React.FC<OpeningAnimationProps> = ({ onAnimationComplete }) => {
  const [showSingleText, setShowSingleText] = useState(true);
  const [showRepeatingText, setShowRepeatingText] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setShowSingleText(false);
      setShowRepeatingText(true);
    }, 1500); // Show single text for 1.5 seconds

    const timer2 = setTimeout(() => {
      onAnimationComplete();
    }, 2500); // Signal completion after initial sequence (single text + fade-in of repeating)

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onAnimationComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 flex items-center justify-center z-0 overflow-hidden"
    >
      {/* Background is handled by the parent App.tsx, so we just need a container for text */}
      <AnimatePresence>
        {showSingleText && (
          <motion.h1
            key="single-synapse"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
            className="text-7xl font-sans font-black italic tracking-[0.15em] text-white drop-shadow-glow-lg"
          >
            SYNAPSE
          </motion.h1>
        )}

        {showRepeatingText && (
          <motion.div
            key="repeating-synapse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {Array.from({ length: 12 }).map((_, rowIndex) => (
              <motion.div
                key={rowIndex}
                initial={{ x: rowIndex % 2 === 0 ? '0%' : '-100%' }}
                animate={{ x: rowIndex % 2 === 0 ? '-100%' : '0%' }}
                transition={{
                  duration: 60, // Slower speed
                  ease: 'linear',
                  repeat: Infinity,
                  repeatType: 'loop',
                }}
                className="flex whitespace-nowrap"
              >
                {Array.from({ length: 10 }).map((_, colIndex) => (
                  <span
                    key={`${rowIndex}-${colIndex}`}
                    className="text-7xl font-bold text-white opacity-20 drop-shadow-glow-md mx-4"
                  >
                    SYNAPSE
                  </span>
                ))}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OpeningAnimation;
