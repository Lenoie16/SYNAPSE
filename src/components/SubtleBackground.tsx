import React from 'react';

interface SubtleBackgroundProps {
  mode: 'dark' | 'warm';
}

export const SubtleBackground: React.FC<SubtleBackgroundProps> = ({ mode }) => {
  const isDark = mode === 'dark';
  
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* Base Background */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${isDark ? 'bg-[#020617]' : 'bg-[#fffbeb]'}`} />
      
      {/* Moving Gradient Orbs */}
      <div className="absolute inset-0 opacity-40">
        <div 
            className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] animate-blob mix-blend-multiply filter
            ${isDark ? 'bg-purple-900/30' : 'bg-orange-300/30'}`}
        />
        <div 
            className={`absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply filter
            ${isDark ? 'bg-blue-900/30' : 'bg-yellow-300/30'}`}
        />
        <div 
            className={`absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply filter
            ${isDark ? 'bg-indigo-900/30' : 'bg-pink-300/30'}`}
        />
      </div>
      
      {/* Subtle Grid Overlay */}
      <div className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay`} />
    </div>
  );
};
