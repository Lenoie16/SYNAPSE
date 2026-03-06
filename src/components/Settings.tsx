import React, { useEffect } from 'react';
import { User } from '@/types';
import { Settings as SettingsIcon, Users, Shield, Calendar, Save, Power, Activity } from 'lucide-react';

interface SettingsProps {
  currentUser: User | null;
  isHost: boolean;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  validateApiKey: () => Promise<void>;
  apiKeyStatus: 'idle' | 'valid' | 'invalid' | 'validating';
  editingPassword: string;
  setEditingPassword: (pass: string) => void;
  accessKey: string | null;
  handleUpdatePassword: () => void;
  passwordUpdateStatus: 'idle' | 'success';
  editingStartTime: string;
  setEditingStartTime: (time: string) => void;
  handleUpdateStartTime: (time: number) => void;
  startTime: number;
  editingEndTime: string;
  setEditingEndTime: (time: string) => void;
  handleUpdateTimer: (time: number) => void;
  endTime: number;
  handleLogout: () => void;
  activeUsers: User[];
  handleKickUser: (id: string) => void;
  currentUserId: string;
  roomName: string | null;
  localIpAddresses: string[];
  encryptionEnabled: boolean;
  onToggleEncryption: (enabled: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  currentUser,
  isHost,
  geminiApiKey,
  setGeminiApiKey,
  validateApiKey,
  apiKeyStatus,
  editingPassword,
  setEditingPassword,
  accessKey,
  handleUpdatePassword,
  passwordUpdateStatus,
  editingStartTime,
  setEditingStartTime,
  handleUpdateStartTime,
  startTime,
  editingEndTime,
  setEditingEndTime,
  handleUpdateTimer,
  endTime,
  handleLogout,
  activeUsers,
  handleKickUser,
  currentUserId,
  roomName,
  localIpAddresses,
  encryptionEnabled,
  onToggleEncryption
}) => {

  const getFormattedDateForInput = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="settings-container">
      <div className="settings-main">
        {/* CONTENT */}
        <div className="settings-content">
          {/* Page Header */}
          <div className="settings-header">
            <div className="settings-header-icon">⚙️</div>
            <div className="settings-header-text">
              <h1>System Settings</h1>
              <p>Configuration & Administration</p>
            </div>
          </div>

          {/* MY PROFILE Section */}
          <div>
            <div className="st-slabel">User Configuration</div>
            <div className="settings-section-grid">
              
              {/* Profile Card */}
              <div className="st-card accent">
                <div className="st-card-head">
                  <div className="st-ch-left">
                    <div className="st-ch-icon st-chi-a">👤</div>
                    <div>
                      <div className="st-ch-title">My Profile</div>
                      <div className="st-ch-sub">User Identity</div>
                    </div>
                  </div>
                </div>
                <div className="st-card-body">
                  <div className="st-field">
                    <div className="st-field-label">Username</div>
                    <div className="st-field-row">
                      <span>{currentUser?.name || 'Unknown'}</span>
                      <span className="st-field-row-value"></span>
                    </div>
                  </div>
                  <div className="st-field">
                    <div className="st-field-label">Role</div>
                    <div className="st-field-row">
                      <span style={{ color: isHost ? 'var(--st-red)' : 'var(--st-t3)' }}>
                        {isHost ? 'HOST' : 'MEMBER'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Configuration Card */}
              <div className="st-card teal">
                <div className="st-card-head">
                  <div className="st-ch-left">
                    <div className="st-ch-icon st-chi-t">⚡</div>
                    <div>
                      <div className="st-ch-title">AI Configuration</div>
                      <div className="st-ch-sub">Gemini API Key</div>
                    </div>
                  </div>
                </div>
                <div className="st-card-body">
                  <div className="st-field">
                    <div className="st-field-label">Gemini API Key</div>
                    <input 
                      type="password" 
                      className="st-input" 
                      value={geminiApiKey} 
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••" 
                    />
                  </div>
                  <button 
                    className="st-btn st-btn-primary" 
                    onClick={validateApiKey}
                    disabled={apiKeyStatus === 'validating'}
                  >
                    {apiKeyStatus === 'validating' ? 'VALIDATING...' : 'SAVE & VALIDATE'}
                  </button>
                  {apiKeyStatus === 'valid' && <p className="text-green-500 text-[10px] mt-2 font-mono">API KEY VALID</p>}
                  {apiKeyStatus === 'invalid' && <p className="text-red-500 text-[10px] mt-2 font-mono">API KEY INVALID</p>}
                </div>
              </div>

            </div>
          </div>

          {/* HOST CONTROLS Section */}
          {isHost && (
            <div>
              <div className="st-slabel">Host Controls</div>
              <div className="settings-section-grid full">

                {/* Host Controls Card */}
                <div className="st-card amber">
                  <div className="st-card-head">
                    <div className="st-ch-left">
                      <div className="st-ch-icon st-chi-am">🎛️</div>
                      <div>
                        <div className="st-ch-title">Host Controls</div>
                        <div className="st-ch-sub">Room Access & Timing</div>
                      </div>
                    </div>
                  </div>
                  <div className="st-card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                      
                      {/* Room Access Key */}
                      <div>
                        <div className="st-field-label">Room Access Key</div>
                        <input 
                          type="text" 
                          className="st-input" 
                          value={editingPassword} 
                          onChange={(e) => setEditingPassword(e.target.value)}
                          placeholder="Enter key" 
                        />
                        <button 
                          className="st-btn st-btn-primary" 
                          style={{ marginTop: '0.8rem' }}
                          onClick={handleUpdatePassword}
                          disabled={editingPassword === accessKey}
                        >
                          {passwordUpdateStatus === 'success' ? 'SAVED' : 'UPDATE'}
                        </button>
                      </div>

                      {/* Encryption Mode */}
                      <div>
                        <div className="st-field-label">Encryption Mode</div>
                        <div className="flex items-center gap-3 mt-2">
                            <button 
                                className={`st-btn ${encryptionEnabled ? 'st-btn-primary' : 'st-btn-secondary'}`}
                                style={{ width: 'auto', padding: '0.5rem 1rem' }}
                                onClick={() => onToggleEncryption(!encryptionEnabled)}
                            >
                                {encryptionEnabled ? 'ENABLED' : 'DISABLED'}
                            </button>
                            <div style={{ fontSize: '0.65rem', color: 'var(--st-t3)', lineHeight: 1.2 }}>
                                {encryptionEnabled ? 'Secure. Slower transfers.' : 'Fast. No encryption.'}
                            </div>
                        </div>
                      </div>

                      {/* Start Time */}
                      <div>
                        <div className="st-field-label">Start Time</div>
                        <div className="st-datetime-group">
                          <input 
                            type="datetime-local" 
                            className="st-input" 
                            value={editingStartTime} 
                            onChange={(e) => setEditingStartTime(e.target.value)}
                          />
                          <button 
                            className="st-datetime-icon"
                            onClick={() => handleUpdateStartTime(new Date(editingStartTime).getTime())}
                            disabled={getFormattedDateForInput(startTime) === editingStartTime}
                          >
                            <Save size={16} />
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* End Time */}
                    <div className="st-field" style={{ marginTop: '1rem' }}>
                      <div className="st-field-label">End Time</div>
                      <div className="st-datetime-group">
                        <input 
                          type="datetime-local" 
                          className="st-input" 
                          value={editingEndTime} 
                          onChange={(e) => setEditingEndTime(e.target.value)}
                        />
                        <button 
                          className="st-datetime-icon"
                          onClick={() => handleUpdateTimer(new Date(editingEndTime).getTime())}
                          disabled={getFormattedDateForInput(endTime) === editingEndTime}
                        >
                          <Save size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Duration Adjustment */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end', marginTop: '1rem' }}>
                      <div>
                        <div className="st-field-label">Duration Offset</div>
                        <div style={{ fontFamily: 'var(--st-mono)', fontSize: '0.75rem', color: 'var(--st-t3)', letterSpacing: '0.05em' }}>+1 HOUR</div>
                      </div>
                      <div className="flex gap-2">
                         <button 
                            className="st-btn st-btn-secondary" 
                            style={{ width: 'auto' }}
                            onClick={() => handleUpdateTimer(endTime + 3600000)}
                         >
                            +1 HR
                         </button>
                         <button 
                            className="st-btn st-btn-secondary" 
                            style={{ width: 'auto' }}
                            onClick={() => { const now = Date.now(); handleUpdateStartTime(now); handleUpdateTimer(now + 86400000); }}
                         >
                            RESET 24H
                         </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SESSION CONTROL Section */}
          <div>
            <div className="st-slabel">Session Control</div>
            <div className="settings-section-grid full">

              {/* Session Control Card */}
              <div className="st-card red">
                <div className="st-card-body" style={{ padding: '1.5rem' }}>
                  <button 
                    className="st-btn st-btn-secondary" 
                    style={{ fontSize: '0.65rem', letterSpacing: '0.2em' }}
                    onClick={handleLogout}
                  >
                    DISCONNECT / SWITCH ROOM
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ACTIVE UNITS Section */}
          <div>
            <div className="st-slabel">Active Units</div>
            <div className="settings-section-grid full">

              {/* Active Units Card */}
              <div className="st-card">
                <div className="st-card-head">
                  <div className="st-ch-left">
                    <div className="st-ch-icon st-chi-t">👥</div>
                    <div>
                      <div className="st-ch-title">Connected Users</div>
                      <div className="st-ch-sub">{activeUsers.length} Active</div>
                    </div>
                  </div>
                  <span className="st-badge"><span className="st-badge-dot"></span>{activeUsers.length} Online</span>
                </div>
                <div className="st-card-body">
                  <div className="units-list flex flex-col gap-3">
                    {activeUsers.map((u, i) => (
                        <div key={i} className="st-unit-item group relative">
                            <div className="st-unit-icon">👤</div>
                            <div className="unit-info flex-1">
                                <div className="st-unit-name">{u.name}</div>
                                <div className="st-unit-detail">{u.name === currentUser?.name ? '(YOU)' : 'CONNECTED'}</div>
                            </div>
                            {u.isHost && <div className="st-unit-badge">HOST</div>}
                            {isHost && !u.isHost && u.id !== currentUserId && (
                                <button 
                                    onClick={() => handleKickUser(u.id)}
                                    className="opacity-0 group-hover:opacity-100 text-[10px] bg-red-900/40 text-red-400 border border-red-900/60 px-2 py-1 rounded hover:bg-red-900/80 transition-all font-bold tracking-widest absolute right-2"
                                >
                                    KICK
                                </button>
                            )}
                        </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* SIDEBAR */}
        <div className="settings-sidebar">
          <div>
            <div className="st-sb-label">System Pressure Analysis</div>
            <div className="st-sidebar-card">
              <div style={{ fontFamily: 'var(--st-mono)', fontSize: '0.65rem', color: 'var(--st-teal)', letterSpacing: '0.08em', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 500 }}>Status</div>
              <div style={{ fontFamily: 'var(--st-sans)', fontSize: '0.85rem', color: 'var(--st-t2)', lineHeight: 1.5 }}>Just started. Brainstorm & Prototype.</div>
            </div>
          </div>

          <div>
            <div className="st-sb-label">Room Diagnostics</div>
            <div className="st-sidebar-card">
              <div className="st-field" style={{ marginBottom: '0.8rem' }}>
                <div className="st-field-label">Room ID</div>
                <div className="st-value-display">{roomName}</div>
              </div>
              <div className="st-field">
                <div className="st-field-label">Host IPs</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {localIpAddresses.length > 0 ? (
                      localIpAddresses.map((ip, index) => (
                        <div key={index} style={{ fontFamily: 'var(--st-mono)', fontSize: '0.65rem', color: 'var(--st-t3)', letterSpacing: '0.05em' }}>
                            http://{ip}:{window.location.port}
                        </div>
                      ))
                  ) : (
                      <div style={{ fontFamily: 'var(--st-mono)', fontSize: '0.65rem', color: 'var(--st-t3)', letterSpacing: '0.05em' }}>N/A</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="st-sb-label">System Status</div>
            <div className="st-sidebar-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--st-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--st-teal)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--st-teal)', display: 'block' }}></span>
                Optimal — Latency: Low.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
