import React, { useState, useEffect, useRef } from 'react';
import { ServerStats } from '@/components/ServerStats';

interface LoginProps {
  onJoin: (roomName: string, key: string, isCreating: boolean, username: string) => void;
  error?: string | null;
  themeMode: 'dark' | 'warm';
  toggleTheme: () => void;
}

// ─── Space Canvas Component ───
const SpaceCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext('2d');
    if (!cx) return;

    let W: number, H: number;
    let animationFrameId: number;

    interface Star {
      x: number;
      y: number;
      r: number;
      alpha: number;
      twinkleSpd: number;
      twinkleOff: number;
      color: string;
    }

    interface Nebula {
      x: number;
      y: number;
      rx: number;
      ry: number;
      col: string;
    }

    let stars: Star[] = [];
    let nebulas: Nebula[] = [];

    const buildStars = () => {
      stars = [];
      const count = Math.floor((W * H) / 3200);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() < 0.92 ? Math.random() * 0.9 + 0.2 : Math.random() * 1.6 + 0.8,
          alpha: 0.2 + Math.random() * 0.8,
          twinkleSpd: 0.4 + Math.random() * 1.4,
          twinkleOff: Math.random() * Math.PI * 2,
          color: Math.random() < 0.15 ? (Math.random() < 0.5 ? '#c0b0ff' : '#ffb0d0') : '#ffffff'
        });
      }
      nebulas = [
        { x: W * 0.15, y: H * 0.25, rx: W * 0.28, ry: H * 0.22, col: 'rgba(80,30,180,0.065)' },
        { x: W * 0.78, y: H * 0.65, rx: W * 0.22, ry: H * 0.18, col: 'rgba(180,30,100,0.055)' },
        { x: W * 0.50, y: H * 0.50, rx: W * 0.35, ry: H * 0.35, col: 'rgba(30,20,80,0.04)' },
        { x: W * 0.85, y: H * 0.18, rx: W * 0.18, ry: H * 0.14, col: 'rgba(40,100,200,0.045)' },
      ];
    };

    const resize = () => {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
      buildStars();
    };

    let resizeTimeout: any;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (W !== window.innerWidth || H !== window.innerHeight) {
          resize();
        }
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    resize();

    const render = (ts: number) => {
      const t = ts * 0.001;
      cx.clearRect(0, 0, W, H);
      
      // Deep background
      const bg = cx.createRadialGradient(W * 0.4, H * 0.35, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.85);
      bg.addColorStop(0, '#07081a');
      bg.addColorStop(0.4, '#04050e');
      bg.addColorStop(1, '#01020a');
      cx.fillStyle = bg;
      cx.fillRect(0, 0, W, H);

      // Nebulas
      nebulas.forEach(n => {
        const g = cx.createRadialGradient(n.x, n.y, 0, n.x, n.y, Math.max(n.rx, n.ry));
        g.addColorStop(0, n.col);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        cx.save();
        cx.scale(1, n.ry / n.rx);
        cx.beginPath();
        cx.arc(n.x, n.y * (n.rx / n.ry), n.rx, 0, Math.PI * 2);
        cx.fillStyle = g;
        cx.fill();
        cx.restore();
      });

      // Milky way band
      const mw = cx.createLinearGradient(0, H * 0.2, W, H * 0.8);
      mw.addColorStop(0, 'rgba(80,60,140,0.0)');
      mw.addColorStop(0.35, 'rgba(80,60,140,0.045)');
      mw.addColorStop(0.5, 'rgba(100,80,160,0.06)');
      mw.addColorStop(0.65, 'rgba(80,60,140,0.045)');
      mw.addColorStop(1, 'rgba(80,60,140,0.0)');
      cx.fillStyle = mw;
      cx.fillRect(0, 0, W, H);

      // Stars
      stars.forEach(s => {
        const twinkle = 0.55 + 0.45 * Math.sin(t * s.twinkleSpd + s.twinkleOff);
        cx.save();
        cx.globalAlpha = s.alpha * twinkle;
        cx.shadowColor = s.color;
        cx.shadowBlur = s.r > 1.2 ? 6 : 2;
        cx.fillStyle = s.color;
        cx.beginPath();
        cx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        cx.fill();
        cx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, width: '100%', height: '100%' }} />;
};

// ─── Wave Canvas Component ───
const WaveCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext('2d');
    if (!cx) return;

    let W: number, H: number;
    let animationFrameId: number;

    const N_BARS = 12, WAVE_SPD = 0.7, WAVE_FREQ = 1.4, AMP_Y = 0.12, AMP_H = 0.055, BASE_H = 0.72;
    const bars = Array.from({ length: N_BARS }, (_, i) => ({ i, isLight: i % 2 === 1 }));

    const resize = () => {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
    };

    let resizeTimeout: any;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (W !== window.innerWidth || H !== window.innerHeight) {
          resize();
        }
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    resize();

    const render = (ts: number) => {
      const t = ts * 0.001;
      cx.clearRect(0, 0, W, H);
      const barW = W / N_BARS, centerY = H * 0.5, restH = H * BASE_H;

      bars.forEach(b => {
        const x = b.i * barW, xc = x + barW * 0.5;
        const phase = (xc / W) * Math.PI * 2 * WAVE_FREQ - t * WAVE_SPD;
        const wave = Math.sin(phase), wave2 = Math.sin(phase * 1.7 + 0.8) * 0.35, wTotal = wave + wave2;
        const midY = centerY + wTotal * H * AMP_Y, halfH = (restH + wTotal * H * AMP_H) * 0.5;
        const top = midY - halfH, bottom = midY + halfH;
        const normWave = (wTotal + 1.35) / 2.7;
        const alpha = b.isLight ? 0.08 + normWave * 0.20 : 0.02 + normWave * 0.09;
        const r = Math.round(6 + normWave * 22), g = Math.round(5 + normWave * 6), bv = Math.round(20 + normWave * 28);
        
        const grad = cx.createLinearGradient(x, top, x, bottom);
        grad.addColorStop(0, `rgba(${r + 18},${g + 10},${bv + 30},${alpha * 0.4})`);
        grad.addColorStop(0.25, `rgba(${r},${g},${bv},${alpha})`);
        grad.addColorStop(0.5, `rgba(${r + 8},${g + 4},${bv + 18},${alpha * 1.15})`);
        grad.addColorStop(0.75, `rgba(${r},${g},${bv},${alpha})`);
        grad.addColorStop(1, `rgba(${r + 18},${g + 10},${bv + 30},${alpha * 0.4})`);
        
        cx.fillStyle = grad;
        cx.beginPath();
        // @ts-ignore
        if (cx.roundRect) cx.roundRect(x + 0.5, top, barW - 1, bottom - top, [3, 3, 3, 3]);
        else cx.rect(x + 0.5, top, barW - 1, bottom - top);
        cx.fill();

        const edgeAlpha = alpha * (b.isLight ? 1.8 : 1.1);
        const edgeCol = normWave > 0.6 ? `rgba(200,140,255,${edgeAlpha})` : `rgba(155,107,255,${edgeAlpha * 0.7})`;
        cx.beginPath();
        cx.moveTo(x + 0.5, top + 4);
        cx.lineTo(x + 0.5, bottom - 4);
        cx.strokeStyle = edgeCol;
        cx.lineWidth = 1;
        cx.stroke();

        if (normWave > 0.55) {
          const glowAmt = (normWave - 0.55) / 0.45;
          const cg = cx.createLinearGradient(x, top - 2, x + barW, top - 2);
          cg.addColorStop(0, 'rgba(155,107,255,0)');
          cg.addColorStop(0.5, `rgba(200,160,255,${0.45 * glowAmt})`);
          cg.addColorStop(1, 'rgba(155,107,255,0)');
          cx.fillStyle = cg;
          cx.fillRect(x, top - 1, barW, 3);

          const tg = cx.createLinearGradient(x, bottom, x + barW, bottom);
          tg.addColorStop(0, 'rgba(255,79,163,0)');
          tg.addColorStop(0.5, `rgba(255,120,180,${0.3 * glowAmt})`);
          tg.addColorStop(1, 'rgba(255,79,163,0)');
          cx.fillStyle = tg;
          cx.fillRect(x, bottom - 1, barW, 3);
        }
      });

      // Top line
      cx.beginPath();
      let first = true;
      for (let px = 0; px <= W; px += 3) {
        const phase = (px / W) * Math.PI * 2 * WAVE_FREQ - t * WAVE_SPD;
        const wave = Math.sin(phase) + Math.sin(phase * 1.7 + 0.8) * 0.35;
        const y = H * 0.5 + wave * H * AMP_Y - (H * BASE_H * 0.5 + wave * H * AMP_H * 0.5);
        if (first) { cx.moveTo(px, y); first = false; } else cx.lineTo(px, y);
      }
      const cl = cx.createLinearGradient(0, 0, W, 0);
      cl.addColorStop(0, 'rgba(155,107,255,0)');
      cl.addColorStop(0.15, 'rgba(180,130,255,0.35)');
      cl.addColorStop(0.5, 'rgba(210,160,255,0.55)');
      cl.addColorStop(0.85, 'rgba(255,100,180,0.35)');
      cl.addColorStop(1, 'rgba(255,79,163,0)');
      cx.strokeStyle = cl;
      cx.lineWidth = 1.5;
      cx.shadowColor = 'rgba(180,130,255,0.6)';
      cx.shadowBlur = 8;
      cx.stroke();
      cx.shadowBlur = 0;

      // Bottom line
      cx.beginPath();
      first = true;
      for (let px = 0; px <= W; px += 3) {
        const phase = (px / W) * Math.PI * 2 * WAVE_FREQ - t * WAVE_SPD;
        const wave = Math.sin(phase) + Math.sin(phase * 1.7 + 0.8) * 0.35;
        const y = H * 0.5 + wave * H * AMP_Y + (H * BASE_H * 0.5 + wave * H * AMP_H * 0.5);
        if (first) { cx.moveTo(px, y); first = false; } else cx.lineTo(px, y);
      }
      const tl2 = cx.createLinearGradient(0, 0, W, 0);
      tl2.addColorStop(0, 'rgba(255,79,163,0)');
      tl2.addColorStop(0.15, 'rgba(255,100,180,0.25)');
      tl2.addColorStop(0.5, 'rgba(255,130,190,0.38)');
      tl2.addColorStop(0.85, 'rgba(200,130,255,0.25)');
      tl2.addColorStop(1, 'rgba(155,107,255,0)');
      cx.strokeStyle = tl2;
      cx.lineWidth = 1.2;
      cx.shadowColor = 'rgba(255,79,163,0.5)';
      cx.shadowBlur = 6;
      cx.stroke();
      cx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 1, width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

// ─── Floating Icons Component ───
const FloatingIcons: React.FC = () => {
  const ICONS = ['⬡', '◈', '⊛', '◉', '⊗', '◎', '⬟', '⊕', '∿', '⋮', '✦', '⊹'];
  const [icons, setIcons] = useState<any[]>([]);

  useEffect(() => {
    const newIcons = Array.from({ length: 22 }).map((_, i) => {
      const isPink = Math.random() < 0.32;
      const isTeal = Math.random() < 0.18;
      const op = (0.03 + Math.random() * 0.08).toFixed(2);
      const dur = 15 + Math.random() * 20;
      const col = isTeal ? `rgba(61,255,208,${op})` : isPink ? `rgba(255,79,163,${op})` : `rgba(155,107,255,${op})`;
      
      return {
        id: i,
        char: ICONS[Math.floor(Math.random() * ICONS.length)],
        style: {
          left: `${Math.random() * 94}%`,
          top: `${Math.random() * 94}%`,
          '--dur': `${dur}s`,
          '--dx': `${(Math.random() - 0.5) * 32}px`,
          '--dy': `${(Math.random() - 0.5) * 32}px`,
          '--op': op,
          animationDelay: `${-(Math.random() * 18)}s`,
          color: col,
          fontSize: `${0.38 + Math.random() * 0.65}rem`,
          filter: 'blur(0.3px)'
        } as React.CSSProperties
      };
    });
    setIcons(newIcons);
  }, []);

  return (
    <div className="float-icons">
      {icons.map(icon => (
        <div key={icon.id} className="fi" style={icon.style}>
          {icon.char}
        </div>
      ))}
    </div>
  );
};

export const Login: React.FC<LoginProps> = ({ onJoin, error }) => {
  const [activeTab, setActiveTab] = useState<'join' | 'host'>('join');
  const [roomName, setRoomName] = useState('');
  const [username, setUsername] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [view, setView] = useState<'login' | 'admin'>('login');
  const [isSwitching, setIsSwitching] = useState(false);
  
  // Password strength state
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    const s = Math.min(4, Math.floor(accessKey.length / 3));
    setStrength(s);
  }, [accessKey]);

  const handleTabSwitch = (tab: 'join' | 'host') => {
    if (tab === activeTab) return;
    setIsSwitching(true);
    setActiveTab(tab);
    setTimeout(() => setIsSwitching(false), 120);
  };

  const handleSubmit = () => {
    if (!roomName || !username || !accessKey) return;
    onJoin(roomName.toUpperCase(), accessKey, activeTab === 'host', username);
  };

  // Mouse parallax
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let tY = -0.5, tX = 0.3, cY = -0.5, cX = 0.3;
    
    const handleMouseMove = (e: MouseEvent) => {
      const cx2 = window.innerWidth / 2;
      const cy2 = window.innerHeight / 2;
      tY = -0.5 + (e.clientX - cx2) / cx2 * -2.2;
      tX = 0.3 + (e.clientY - cy2) / cy2 * -1.5;
    };

    let frameId: number;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    
    const loop = () => {
      if (window.innerWidth >= 768) {
        cY = lerp(cY, tY, 0.03);
        cX = lerp(cX, tX, 0.03);
        if (cardRef.current) {
          cardRef.current.style.transform = `perspective(900px) rotateY(${cY}deg) rotateX(${cX}deg) translateZ(6px)`;
        }
      } else if (cardRef.current) {
        cardRef.current.style.transform = 'none';
      }
      frameId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', handleMouseMove);
    loop();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  const strengthColors = ['#ff4444', '#ffaa00', '#9b6bff', '#3dffd0'];

  if (view === 'admin') {
    return (
      <div className="login-scene">
        <SpaceCanvas />
        <WaveCanvas />
        <div className="vignette"></div>
        <div className="grain"></div>
        <div className="relative z-20 w-full h-full p-8">
           <ServerStats onBack={() => setView('login')} />
        </div>
      </div>
    );
  }

  return (
    <>
      <SpaceCanvas />
      <WaveCanvas />
      <div className="vignette"></div>
      <div className="orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
      </div>
      <div className="grain"></div>
      <FloatingIcons />

      <div className="login-scene">
        <div className="login-page-grid">
          <div className="login-brand">
            <div className="status-badge"><span className="sdot"></span>NETWORK ONLINE</div>
            <div className="logo-wrap">
              <div className="login-logo">SYNAPSE</div>
              <div className="logo-ghost" aria-hidden="true">SYNAPSE</div>
            </div>
            <span className="logo-sub">DECENTRALIZED COLLABORATION LAYER</span>
            <p className="login-tagline">A decentralized workbench,<br />for teams off the grid.</p>
            <div className="login-divider">
              <div className="dline"></div>
              <div className="ddot"></div>
              <div className="dline r"></div>
            </div>
          </div>

          <div>
            <div className="card-wrap">
              <div className="login-card" ref={cardRef}>
                <div className="cb tl"></div>
                <div className="cb tr"></div>
                <div className="cb bl"></div>
                <div className="cb br"></div>
                
                <div className="login-tabs">
                  <button 
                    className={`login-tab ${activeTab === 'join' ? 'active' : ''}`}
                    onClick={() => handleTabSwitch('join')}
                  >
                    <span className="tidot"></span>◉ JOIN UPLINK
                  </button>
                  <button 
                    className={`login-tab ${activeTab === 'host' ? 'active' : ''}`}
                    onClick={() => handleTabSwitch('host')}
                  >
                    <span className="tidot"></span>⊳ INITIATE HOST
                  </button>
                </div>

                <div className={`fields-wrap ${isSwitching ? 'switching' : ''}`}>
                  <div className="login-field">
                    <label className="field-label">TARGET SYSTEM (ROOM ID)</label>
                    <div className="input-wrap">
                      <span className="input-icon">⬡</span>
                      <input 
                        type="text" 
                        placeholder="ENTER NETWORK ID" 
                        spellCheck={false}
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="login-field">
                    <label className="field-label">OPERATOR ALIAS</label>
                    <div className="input-wrap">
                      <span className="input-icon">◎</span>
                      <input 
                        type="text" 
                        placeholder="IDENTIFY YOURSELF" 
                        spellCheck={false}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="login-field">
                    <label className="field-label">ACCESS TOKEN</label>
                    <div className="input-wrap">
                      <span className="input-icon">⊛</span>
                      <input 
                        type="password" 
                        placeholder="ENCRYPTED KEY" 
                        spellCheck={false}
                        value={accessKey}
                        onChange={(e) => setAccessKey(e.target.value)}
                      />
                    </div>
                    <div className="sbar">
                      {[0, 1, 2, 3].map(i => (
                        <div 
                          key={i} 
                          className="sseg" 
                          style={{ 
                            background: i < strength ? strengthColors[Math.min(strength - 1, 3)] : 'rgba(255,255,255,0.06)' 
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs font-mono flex items-center gap-2">
                       <span>⚠ ACCESS_DENIED: {error}</span>
                    </div>
                  )}

                  <button className="login-cta" onClick={handleSubmit}>
                    <span className="pdot"></span>ESTABLISH CONNECTION →
                  </button>
                </div>
              </div>

              <div className="admin-card">
                <button className="admin-cta" onClick={() => setView('admin')}>
                  <span>⊗</span>ADMIN CONSOLE →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};



