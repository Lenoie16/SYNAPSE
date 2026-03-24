import React, { useState } from 'react';

interface AdminLoginProps {
    onLogin: (username: string, password: string) => void;
    error: string | null;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username && password) {
            onLogin(username, password);
        }
    };

    return (
        <div className="min-h-screen bg-[rgb(var(--hack-bg))] flex items-center justify-center font-mono relative overflow-hidden">
            {/* Background Effects matching Dashboard */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[rgb(var(--hack-primary))]/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[rgb(var(--hack-accent))]/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                <div className="absolute inset-0 opacity-[0.03]" style={{ 
                    backgroundImage: 'linear-gradient(rgba(147,130,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(147,130,255,1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            <div className="w-full max-w-md p-8 space-y-8 bg-[rgb(var(--hack-surface))]/90 border border-[rgb(var(--hack-border))] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] relative z-10 backdrop-blur-xl">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[rgb(var(--hack-text))]/5 border border-[rgb(var(--hack-border))] mb-4 text-2xl">
                        ⬡
                    </div>
                    <h1 className="text-2xl font-bold text-[rgb(var(--hack-text))] tracking-widest uppercase">Admin Console</h1>
                    <p className="mt-2 text-[rgb(var(--hack-text))]/60 text-xs tracking-widest uppercase">Secure Access Required</p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-[10px] uppercase tracking-widest text-[rgb(var(--hack-text))]/50 mb-1">Username</label>
                            <input 
                                id="username"
                                name="username"
                                type="text"
                                required 
                                className="appearance-none block w-full px-4 py-3 border border-[rgb(var(--hack-border))] bg-[rgb(var(--hack-text))]/5 text-[rgb(var(--hack-text))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--hack-primary))]/50 focus:border-[rgb(var(--hack-primary))]/50 transition-all placeholder-[rgb(var(--hack-text))]/40 text-sm"
                                placeholder="ENTER USERNAME"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="off"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-[10px] uppercase tracking-widest text-[rgb(var(--hack-text))]/50 mb-1">Password</label>
                            <input 
                                id="password"
                                name="password"
                                type="password"
                                required 
                                className="appearance-none block w-full px-4 py-3 border border-[rgb(var(--hack-border))] bg-[rgb(var(--hack-text))]/5 text-[rgb(var(--hack-text))] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(var(--hack-primary))]/50 focus:border-[rgb(var(--hack-primary))]/50 transition-all placeholder-[rgb(var(--hack-text))]/40 text-sm"
                                placeholder="ENTER PASSWORD"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-[rgb(var(--hack-danger))]/10 border border-[rgb(var(--hack-danger))]/20 text-[rgb(var(--hack-danger))] rounded-lg text-xs text-center tracking-wide">
                            ⚠️ {error}
                        </div>
                    )}

                    <div>
                        <button 
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-[rgb(var(--hack-primary))]/30 text-xs font-bold rounded-lg text-[rgb(var(--hack-primary))] bg-[rgb(var(--hack-primary))]/10 hover:bg-[rgb(var(--hack-primary))]/20 hover:border-[rgb(var(--hack-primary))]/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(var(--hack-primary))] transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(var(--hack-primary),0.1)] hover:shadow-[0_0_30px_rgba(var(--hack-primary),0.2)]"
                        >
                            Establish Uplink
                        </button>
                    </div>
                </form>
                
                <div className="text-center">
                    <p className="text-[10px] text-[rgb(var(--hack-text))]/40 uppercase tracking-widest">
                        Synapse Mainframe v2.4.1
                    </p>
                </div>
            </div>
        </div>
    );
};
