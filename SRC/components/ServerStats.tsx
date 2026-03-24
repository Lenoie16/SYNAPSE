import React, { useEffect, useState, useRef } from 'react';
import { Icons } from '@/components/Icons';
import { ServerStatsData } from '@/types';
import { AdminLogin } from '@/components/AdminLogin';

interface ServerStatsProps {
  onBack: () => void;
}

// ─── Pressure Chart Component ───
const PressureChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext('2d');
    if (!cx) return;

    const dpr = window.devicePixelRatio || 1;
    let W: number, H: number;
    let animationFrameId: number;

    const resize = () => {
      const rect = cv.getBoundingClientRect();
      W = cv.width = (rect.width || cv.offsetWidth || 220) * dpr;
      H = cv.height = 56 * dpr;
      // cv.style.height = '56px'; // Handled by CSS/Tailwind
    };

    const pts = Array.from({ length: 60 }, () => 1.5 + Math.random() * 4);

    const draw = () => {
      if (!W || !H) return;
      cx.clearRect(0, 0, W, H);
      
      // Area
      cx.beginPath();
      pts.forEach((v, i) => {
        const x = (i / (pts.length - 1)) * W;
        const y = H - (v / 100) * H * 9;
        i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y);
      });
      cx.lineTo(W, H);
      cx.lineTo(0, H);
      cx.closePath();
      
      const fill = cx.createLinearGradient(0, 0, 0, H);
      fill.addColorStop(0, 'rgba(168,150,255,0.2)');
      fill.addColorStop(0.6, 'rgba(98,247,210,0.07)');
      fill.addColorStop(1, 'rgba(0,0,0,0)');
      cx.fillStyle = fill;
      cx.fill();

      // Line
      cx.beginPath();
      pts.forEach((v, i) => {
        const x = (i / (pts.length - 1)) * W;
        const y = H - (v / 100) * H * 9;
        i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y);
      });
      
      const stroke = cx.createLinearGradient(0, 0, W, 0);
      stroke.addColorStop(0, 'rgba(168,150,255,0.6)');
      stroke.addColorStop(0.45, 'rgba(98,247,210,0.8)');
      stroke.addColorStop(1, 'rgba(168,150,255,0.6)');
      cx.strokeStyle = stroke;
      cx.lineWidth = 1.6 * dpr;
      cx.lineJoin = 'round';
      cx.lineCap = 'round';
      cx.shadowColor = 'rgba(98,247,210,0.4)';
      cx.shadowBlur = 6;
      cx.stroke();
      cx.shadowBlur = 0;
    };

    resize();
    window.addEventListener('resize', resize);

    const interval = setInterval(() => {
      pts.shift();
      pts.push(1.5 + Math.random() * 4);
      draw();
    }, 550);

    // Initial draw
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      clearInterval(interval);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '56px', display: 'block' }} />;
};

export const ServerStats: React.FC<ServerStatsProps> = ({ onBack }) => {
  const [stats, setStats] = useState<ServerStatsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [localIps, setLocalIps] = useState<string[]>([]);

  // --- Admin Auth State ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // --- Credential Management State ---
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const usernameInitialized = useRef(false);

  // Check admin status on mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setIsAdmin(false);
        setCheckingStatus(false);
        return;
      }

      try {
        const res = await fetch('/api/admin/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          localStorage.removeItem('admin_token');
        }
      } catch (e) {
        setError('Cannot connect to server for auth check.');
        localStorage.removeItem('admin_token');
      } finally {
        setCheckingStatus(false);
      }
    };
    checkAdminStatus();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setIsAdmin(false);
          localStorage.removeItem('admin_token');
          setAuthError("Session expired. Please log in again.");
          throw new Error("Admin session expired. Please log in again.");
        }
        throw new Error(`Server Error: ${res.statusText}`);
      }
      const data = await res.json();
      setStats(data);
      // Only set username on first load to allow editing
      if (!usernameInitialized.current && data.adminUsername) {
          setNewUsername(data.adminUsername);
          usernameInitialized.current = true;
      }
      setError(null);
    } catch (err: any) {
      console.error("Stats fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchIps = async () => {
      try {
          const res = await fetch('/api/local-ips');
          if (res.ok) {
              const data = await res.json();
              setLocalIps(data.localIpAddresses || []);
          }
      } catch (e) {
          console.error("Failed to fetch IPs", e);
      }
  };

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      fetchStats();
      fetchIps();
      const interval = setInterval(fetchStats, 5000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const handleLogin = async (username: string, password: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('admin_token', data.token);
            setIsAdmin(true);
            setAuthError(null);
        } else {
            setAuthError('Login failed: No token received.');
        }
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Login failed.');
      }
    } catch (e) {
      setAuthError('Failed to connect to the server.');
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('admin_token');
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAdmin(false);
    onBack();
  };

  const handleUpdateCredentials = async () => {
    if (!newUsername || !newPassword) {
      alert('Please provide both a new username and password.');
      return;
    }
    setCredentialError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/update-credentials', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newUsername, newPassword })
      });
      if (res.ok) {
        setUpdateStatus('success');
        setNewPassword('');
        setTimeout(() => setUpdateStatus('idle'), 3000);
      } else {
        const data = await res.json();
        setCredentialError(data.error || 'Failed to update credentials.');
        setUpdateStatus('error');
        setTimeout(() => setUpdateStatus('idle'), 3000);
      }
    } catch (e) {
      setCredentialError('Failed to connect to server.');
      setUpdateStatus('error');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  };

  const handleDeleteRoom = async (roomName: string) => {
    if (!confirm(`WARNING: DELETE ROOM "${roomName}"?\n\n- All connected users will be kicked.\n- All shared files will be permanently deleted.\n- This action cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/room/${encodeURIComponent(roomName)}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchStats();
      } else {
        alert("Failed to delete room. Check console.");
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to server.");
    }
  };

  const togglePassword = (roomName: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(roomName)) newSet.delete(roomName);
    else newSet.add(roomName);
    setVisiblePasswords(newSet);
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  if (checkingStatus) {
    return <div className="min-h-screen flex items-center justify-center text-hack-primary animate-pulse font-mono">Verifying Admin Clearance...</div>;
  }

  if (!isAdmin) {
    return <AdminLogin onLogin={handleLogin} error={authError} />;
  }

  if (loading && !stats) return <div className="min-h-screen flex items-center justify-center text-hack-primary animate-pulse font-mono">Establishing Uplink...</div>;

  return (
    <div className="admin-dashboard">
      <div className="bg-wrap">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
        <div className="bg-noise"></div>
      </div>

      <div className="admin-main">
        {/* CONTENT */}
        <div className="admin-content">
          
          {/* Header / Nav (Custom addition to fit logout) */}
          <div className="flex justify-between items-center mb-4">
             <div className="slabel mb-0">MAINFRAME // {stats?.adminUsername}</div>
             <button onClick={handleLogout} className="kill" style={{ fontSize: '0.6rem', padding: '6px 12px' }}>LOGOUT</button>
          </div>

          {/* Stats */}
          <div>
            <div className="slabel">System Overview</div>
            <div className="stat-row">
              <div className="stat-card sc-a">
                <div className="stat-label-row"><span className="stat-name">Total Rooms</span><span className="stat-ico">⬡</span></div>
                <div className="stat-num c-a">{stats?.totalRooms || 0}</div>
                <div className="stat-sub">Active Networks</div>
                <div className="stat-bar-wrap"><div className="stat-bar-fill bar-a" style={{ width: '20%' }}></div></div>
              </div>
              <div className="stat-card sc-t">
                <div className="stat-label-row"><span className="stat-name">Active Users</span><span className="stat-ico">◉</span></div>
                <div className="stat-num c-t">{stats?.totalUsers || 0}</div>
                <div className="stat-sub">Operators Online</div>
                <div className="stat-bar-wrap"><div className="stat-bar-fill bar-t" style={{ width: '10%' }}></div></div>
              </div>
              <div className="stat-card sc-am">
                <div className="stat-label-row"><span className="stat-name">System Uptime</span><span className="stat-ico">○</span></div>
                <div className="stat-num c-am">{stats ? Math.floor(stats.uptime / 3600) : 0}<span>h</span></div>
                <div className="stat-sub">{stats ? formatUptime(stats.uptime) : '-'}</div>
                <div className="stat-bar-wrap"><div className="stat-bar-fill bar-am" style={{ width: '55%' }}></div></div>
              </div>
              <div className="stat-card sc-r">
                <div className="stat-label-row"><span className="stat-name">Memory RSS</span><span className="stat-ico">∿</span></div>
                <div className="stat-num c-r">{stats ? (stats.memoryUsage.rss / 1024 / 1024).toFixed(0) : 0}<span>MB</span></div>
                <div className="stat-sub">Heap: {stats ? formatBytes(stats.memoryUsage.heapUsed) : '-'}</div>
                <div className="stat-bar-wrap"><div className="stat-bar-fill bar-r" style={{ width: '43%' }}></div></div>
              </div>
            </div>
          </div>

          {/* Rooms table */}
          <div>
            <div className="slabel">Active Rooms Registry</div>
            <div className="admin-card">
              <div className="card-head">
                <div className="ch-left">
                  <div className="ch-icon chi-a">⬡</div>
                  <div>
                    <div className="ch-title">Connected Sessions</div>
                    <div className="ch-sub">Real-time Room Monitor</div>
                  </div>
                </div>
                <div className="badge badge-teal">⬤ LIVE DATA</div>
              </div>
              <div className="t-wrap">
                <div className="t-head">
                  <div className="th">Room ID</div>
                  <div className="th">Host</div>
                  <div className="th">Access Key</div>
                  <div className="th">Connected Units</div>
                  <div className="th">Action</div>
                </div>
                
                {!stats || stats.activeRooms.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 font-mono text-xs">No active rooms initialized.</div>
                ) : (
                    stats.activeRooms.map((room, idx) => (
                        <div key={idx} className="t-row">
                            <div className="t-id">{room.name}</div>
                            <div className="t-host">{room.host || 'Unknown'}</div>
                            <div className="t-key">
                                <span className="t-ct" style={{ fontFamily: 'monospace', cursor: 'pointer' }} onClick={() => togglePassword(room.name)}>
                                    {visiblePasswords.has(room.name) ? room.password : '••••••••'}
                                </span>
                            </div>
                            <div className="t-barwrap">
                                <div className="t-track"><div className="t-fill" style={{ width: `${Math.min(100, (room.userCount * 10))}%` }}></div></div>
                                <div className="t-ct">{room.userCount} / 50</div>
                            </div>
                            <button className="kill" onClick={() => handleDeleteRoom(room.name)}>TERMINATE</button>
                        </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Security + Log */}
          <div className="two-col">
            <div>
              <div className="slabel">Admin Security</div>
              <div className="admin-card">
                <div className="card-body">
                  <div className="field">
                    <label className="fl">Username</label>
                    <input 
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        type="text" 
                        placeholder="Enter new username"
                        value={newUsername} 
                        onChange={(e) => setNewUsername(e.target.value)}
                        spellCheck={false} 
                    />
                  </div>
                  <div className="field" style={{ marginBottom: '1.1rem' }}>
                    <label className="fl">New Password</label>
                    <input 
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        type="password" 
                        placeholder="Enter new password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        spellCheck={false} 
                    />
                  </div>
                  <button 
                    className="pri-btn" 
                    onClick={handleUpdateCredentials}
                    disabled={updateStatus !== 'idle'}
                  >
                    {updateStatus === 'success' ? 'UPDATED SUCCESSFULLY' : updateStatus === 'error' ? 'UPDATE FAILED' : 'UPDATE CREDENTIALS'}
                  </button>
                  {credentialError && <div className="text-red-500 text-xs mt-2 text-center font-mono">{credentialError}</div>}
                </div>
              </div>
            </div>
            <div>
              <div className="slabel">Event Log</div>
              <div className="admin-card">
                <div className="log-wrap">
                  <div className="log-item">
                    <div className="lt">00:01:39</div>
                    <div className="ldot d-g"></div>
                    <div className="lmsg">System <strong>ONLINE</strong> — Admin connected</div>
                  </div>
                  <div className="log-item">
                    <div className="lt">00:01:12</div>
                    <div className="ldot d-p"></div>
                    <div className="lmsg">Network <strong>SYNCED</strong> — {stats?.totalRooms || 0} active rooms</div>
                  </div>
                  <div className="log-item">
                    <div className="lt">00:00:48</div>
                    <div className="ldot d-a"></div>
                    <div className="lmsg">Monitoring <strong>{stats?.totalUsers || 0}</strong> active users</div>
                  </div>
                  <div className="log-item">
                    <div className="lt">00:00:01</div>
                    <div className="ldot d-r"></div>
                    <div className="lmsg">SYNAPSE mainframe <strong>BOOTED</strong> — v2.4.1 operational</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* SIDEBAR */}
        <div className="admin-sidebar">
          <div>
            <div className="sb-label">System Pressure</div>
            <div className="mini-chart-card">
              <PressureChart />
              <div className="chart-meta">Real-time Load Analysis</div>
              <div className="chart-metrics">
                <div className="cm"><div className="cm-l">Load</div><div className="cm-v c-t">{(stats?.memoryUsage.rss ? (stats.memoryUsage.rss / 1024 / 1024 / 10).toFixed(0) : '0')}%</div></div>
                <div className="cm"><div className="cm-l">Latency</div><div className="cm-v c-a">LOW</div></div>
              </div>
            </div>
          </div>
          <div>
            <div className="sb-label">Room Diagnostics</div>
            <div className="diag-section">
              <div>
                <div className="dg-l">Active Room ID</div>
                <div className="dg-v">{stats?.activeRooms[0]?.name || 'N/A'}</div>
              </div>
              <div>
                <div className="dg-l">Host IPs</div>
                <div className="ip-list">
                  {localIps.length > 0 ? localIps.map((ip, i) => (
                      <div key={i} className="ip-row"><div className="ip-pip"></div>{ip}</div>
                  )) : (
                      <div className="ip-row"><div className="ip-pip"></div>Scanning...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="sb-label">System Status</div>
            <div className="status-chip"><span className="ldot d-g"></span>Optimal — Latency: Low</div>
          </div>
          
          <div className="mt-auto">
             <button onClick={onBack} className="w-full py-3 text-xs font-mono text-hack-muted hover:text-white border border-transparent hover:border-hack-border rounded transition-colors">
                 ← RETURN TO LOGIN
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};
