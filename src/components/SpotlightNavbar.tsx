
import React, { useRef, useState } from 'react';
import { View } from '@/types';
import { Kanban, Code, FileText, Folder, Zap, Settings, Shield, MessageSquare, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface NavItem {
  id: View;
  icon: React.ElementType;
  label: string;
}

interface SpotlightNavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  isMobile?: boolean;
}

export const SpotlightNavbar: React.FC<SpotlightNavbarProps> = ({ currentView, onNavigate, isMobile }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  const baseNavItems: NavItem[] = [
    { id: 'kanban', icon: Kanban, label: 'Board' },
    { id: 'snippets', icon: Code, label: 'Vault' },
    { id: 'files', icon: FileText, label: 'Data' },
    { id: 'directory', icon: Folder, label: 'Dirs' },
    { id: 'code-editor', icon: Code, label: 'Editor' },
    { id: 'settings', icon: Settings, label: 'Sys' },
    { id: 'admin', icon: Shield, label: 'Admin' },
  ];

  const mobileNavItems: NavItem[] = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'diagnostics', icon: Activity, label: 'Stats' },
  ];

  const navItems = isMobile 
    ? [...baseNavItems.filter(item => item.id !== 'settings' && item.id !== 'admin'), ...mobileNavItems] 
    : baseNavItems;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
      <div
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative flex items-center justify-start md:justify-around gap-1 rounded-2xl border border-hack-border bg-hack-surface/90 p-2 shadow-2xl backdrop-blur-xl transition-colors duration-500 overflow-x-auto hide-scrollbar"
      >
        {/* Spotlight Effect */}
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 hidden md:block"
          style={{
            opacity,
            background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgb(var(--hack-primary) / 0.15), transparent 40%)`,
          }}
        />
        
        {/* Spotlight Border Glow */}
        <div 
            className="pointer-events-none absolute inset-0 rounded-2xl transition duration-300 hidden md:block"
            style={{
                opacity,
                background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgb(var(--hack-primary) / 0.4), transparent 40%)`,
                maskImage: 'linear-gradient(black, black), linear-gradient(black, black)',
                maskClip: 'content-box, border-box',
                maskComposite: 'exclude',
                padding: '1px'
            }} 
        />

        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative z-10 flex flex-col items-center justify-center rounded-xl px-4 py-3 transition-all duration-300 group flex-shrink-0`}
            >
              {/* Active Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="navbar-active"
                  className="absolute inset-0 bg-hack-surface border border-hack-primary/50 shadow-[0_0_15px_rgba(var(--hack-primary),0.4)] rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              {/* Active Bottom Light */}
              {isActive && (
                  <motion.div 
                    layoutId="navbar-light"
                    className="absolute -bottom-2 w-8 h-1 bg-hack-primary/50 blur-md rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
              )}

              <Icon
                className={`relative h-6 w-6 transition-colors duration-300 ${
                  isActive 
                    ? 'text-hack-text drop-shadow-[0_0_5px_rgba(var(--hack-primary),0.5)]' 
                    : 'text-hack-muted group-hover:text-hack-text'
                }`}
              />
              
              <span className={`relative text-[10px] font-mono mt-1 transition-colors duration-300 ${
                  isActive 
                    ? 'text-hack-text font-black tracking-wide' 
                    : 'text-hack-muted group-hover:text-hack-text'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
