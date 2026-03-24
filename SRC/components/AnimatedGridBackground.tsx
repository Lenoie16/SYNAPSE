import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedGridBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-hack-bg -z-10">
      <motion.div
        initial={{ y: '0%' }}
        animate={{ y: '-50%' }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
        }}
        className="absolute inset-0 h-[200%] w-full"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(var(--hack-border), 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--hack-border), 0.2) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-hack-bg via-hack-bg/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-l from-hack-bg via-hack-bg/50 to-transparent" />
    </div>
  );
};
