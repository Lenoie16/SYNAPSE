import React, { useEffect, useState } from 'react';
import { Icons } from '@/components/Icons';

interface TimerProps {
  endTime: number;
}

export const Timer: React.FC<TimerProps> = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const [critical, setCritical] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setCritical(true);
        clearInterval(interval);
        return;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
      
      setCritical(hours === 0 && minutes < 30);
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className={`flex items-center space-x-2 font-mono text-xl ${critical ? 'text-hack-danger animate-pulse' : 'text-hack-primary'}`}>
      <Icons.Clock className="w-5 h-5" />
      <span>{timeLeft}</span>
    </div>
  );
};