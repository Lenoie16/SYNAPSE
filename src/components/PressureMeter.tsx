
import React, { useEffect, useState } from 'react';
import { Task, PressureAnalysis } from '@/types';
import { Activity, AlertTriangle, Zap } from 'lucide-react';

interface PressureMeterProps {
  tasks: Task[];
  startTime: number;
  endTime: number;
}

export const PressureMeter: React.FC<PressureMeterProps> = ({ tasks, startTime, endTime }) => {
  const [analysis, setAnalysis] = useState<PressureAnalysis>({
    level: 0,
    message: "Initializing diagnostics...",
    color: "#00ff9d"
  });

  useEffect(() => {
    const updatePressure = () => {
      const now = Date.now();
      const totalDuration = endTime - startTime;
      const elapsed = now - startTime;

      if (totalDuration <= 0) {
        setAnalysis({ level: 100, message: "Time anomaly detected.", color: "#808080" });
        return;
      }

      let progress = elapsed / totalDuration;
      progress = Math.max(0, Math.min(1, progress));
      const percentage = Math.round(progress * 100);

      let message = "Hackathon in progress.";
      let color = "#00ff9d"; // Start Green

      if (percentage < 25) {
        message = "Just started. Brainstorm & Prototype.";
        color = "#00ff9d"; // Green
      } else if (percentage < 50) {
        message = "Building core features.";
        color = "#00ccff"; // Blue
      } else if (percentage < 75) {
        message = "Crunch time. Connect the dots.";
        color = "#bd00ff"; // Purple
      } else if (percentage < 90) {
        message = "Polishing. Fix those bugs!";
        color = "#FFA500"; // Orange
      } else {
        message = "FINAL COUNTDOWN. HANDS OFF SOON!";
        color = "#ff3366"; // Red
      }

      if (now > endTime) {
        message = "HACKATHON ENDED.";
        color = "#ff3366";
      }

      setAnalysis({ level: percentage, message, color });
    };

    updatePressure();
    const interval = setInterval(updatePressure, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  return (
    <div className="bg-[rgb(var(--hack-surface))]/80 border border-[rgb(var(--hack-border))] p-5 rounded-sm relative overflow-hidden group animate-fade-in backdrop-blur-md">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity duration-500">
        <Activity className="w-16 h-16 text-[rgb(var(--hack-primary))]" />
      </div>

      <h3 className="font-bold text-[rgb(var(--hack-text))]/30 text-[10px] uppercase mb-4 tracking-[0.2em] flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-[rgb(var(--hack-primary))] animate-pulse" />
        System Pressure Analysis
      </h3>

      <div className="space-y-5">
        <div className="relative h-2 bg-[rgb(var(--hack-bg))]/40 rounded-sm overflow-hidden border border-[rgb(var(--hack-border))]">
          <div
            className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out overflow-hidden"
            style={{
              width: `${analysis.level}%`,
              backgroundColor: analysis.color,
              boxShadow: `0 0 20px ${analysis.color}80`
            }}
          >
            <div className="absolute inset-0 bg-[rgb(var(--hack-text))]/20 animate-pulse"></div>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] text-[rgb(var(--hack-text))]/20 font-mono uppercase tracking-wider mb-0.5">Status</span>
            <span className="text-xs font-bold font-mono tracking-tight" style={{ color: analysis.color }}>
              {analysis.message}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[rgb(var(--hack-text))]/20 font-mono uppercase tracking-wider mb-0.5">Load</span>
            <span className="text-2xl font-black font-mono leading-none drop-shadow-md" style={{ color: analysis.color }}>
              {analysis.level}%
            </span>
          </div>
        </div>

        {analysis.level > 85 && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-[rgb(var(--hack-danger))] animate-pulse bg-[rgb(var(--hack-danger))]/10 p-2.5 rounded-sm border border-[rgb(var(--hack-danger))]/20 shadow-[0_0_10px_rgba(var(--hack-danger),0.2)]">
            <AlertTriangle className="w-3.5 h-3.5" />
            CRITICAL PRESSURE DETECTED
          </div>
        )}
      </div>
    </div>
  );
};
