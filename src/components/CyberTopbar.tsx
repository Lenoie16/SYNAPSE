import React, { useState, useEffect } from 'react';
import { User } from '@/types';

interface CyberTopbarProps {
  currentUser: User | null;
  roomName: string | null;
}

export const CyberTopbar: React.FC<CyberTopbarProps> = ({ currentUser, roomName }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="h-[52px] bg-[#0d1426]/95 border-b border-white/5 backdrop-blur-xl flex items-center px-6 relative z-[100] flex-shrink-0">
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#9b4dff]/50 to-transparent"></div>

      <div className="font-orbitron font-black text-lg tracking-[4px] bg-gradient-to-r from-[#bf5fff] to-[#ff2d78] bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(191,95,255,0.5)] mr-8">
        SYNAPSE
      </div>

      <div className="flex items-center gap-3 bg-[#9b4dff]/10 border border-[#9b4dff]/25 rounded-sm px-3 py-1 text-[#bf5fff] font-mono text-[11px] tracking-wider">
        <div className="w-4 h-4 border border-[#bf5fff] rounded-full flex items-center justify-center text-[8px]">◈</div>
        <span>USER: {currentUser?.name?.toUpperCase() || 'PHANTOM_X'}</span>
      </div>

      <div className="ml-6 flex items-center gap-6 font-mono text-[10px] tracking-[2px] text-white/30">
        <div>
          <div className="text-white/20">SESSION ID</div>
          <div className="text-white/90 text-[11px]">{roomName || 'NEXUS-7734'}</div>
        </div>
        <div className="flex items-center gap-2 bg-[#00f5d4]/10 border border-[#00f5d4]/20 rounded-sm px-2.5 py-1 text-[#00f5d4] tracking-[3px]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00f5d4] shadow-[0_0_15px_rgba(0,245,212,0.4)] animate-pulse"></div>
          LIVE
        </div>
      </div>

      <div className="ml-auto flex items-center gap-5 font-mono text-[15px] tracking-[3px] text-white/30">
        <span className="text-[#bf5fff] text-xs">◷</span>
        <span>{formatTime(time)}</span>
      </div>
    </div>
  );
};
