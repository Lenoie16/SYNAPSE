import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeToggleProps {
  themeMode: 'dark' | 'warm';
  toggleTheme: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ themeMode, toggleTheme, className }) => {
  return (
    <button
      onClick={toggleTheme}
      className={`relative w-10 h-10 flex items-center justify-center rounded-full bg-hack-surface/50 border border-hack-border transition-colors ${className}`}
      aria-label="Toggle theme"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={themeMode === 'dark' ? 'moon' : 'sun'}
          initial={{ y: -20, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.3 }}
          className="absolute"
        >
          {themeMode === 'dark' ? (
            <Moon className="w-5 h-5 text-hack-muted" />
          ) : (
            <Sun className="w-5 h-5 text-hack-accent" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
};
