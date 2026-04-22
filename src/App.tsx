import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { View, Task, Snippet, SharedFile, User, DirectoryState, Section, EditorNode, EditorFile, EditorFolder } from '@/types';
import { Kanban } from '@/components/Kanban';

import { BoilerplateGenerator } from '@/components/BoilerplateGenerator';
import { SnippetVault } from '@/components/SnippetVault';

// FIX: DirectoryBrowser is a default export — was incorrectly imported as named export
import DirectoryBrowser from '@/components/DirectoryBrowser';
import { FileBrowser } from '@/components/FileBrowser';
import { Timer } from '@/components/Timer';
import { PressureMeter } from '@/components/PressureMeter';
import { ServerStats } from '@/components/ServerStats';
import { Users } from 'lucide-react';
import { Settings } from '@/components/Settings';
import { Login } from '@/components/Login';
import { SpotlightNavbar } from '@/components/SpotlightNavbar';
import { useIsMobile } from '@/hooks/useIsMobile';
import { motion, AnimatePresence } from 'framer-motion';
import CollaborativeCodeEditor from '@/components/CollaborativeCodeEditor';
import { ProjectSidebar } from '@/components/ProjectSidebar';

import { SubtleBackground } from '@/components/SubtleBackground';

import { ThemeToggle } from '@/components/ThemeToggle';
import ChatBox from '@/components/ChatBox';
import { Whiteboard } from '@/components/Whiteboard';
import { useGemini } from '@/hooks/useGemini';


const App: React.FC = () => {
  const isMobile = useIsMobile();
  // --- Auth & Room State ---
  const [roomName, setRoomName] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem('gemini-api-key') || '');
  const { isApiKeyValid, validateApiKey, categorizeSnippets, debugCode, analyzeCode, analyzeFileContent, categorizeFiles } = useGemini(geminiApiKey);
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'valid' | 'invalid' | 'validating'>('idle');

  
  // --- App View State ---
  const [view, setView] = useState<View>('kanban');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  // FIX: removed duplicate const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null);
  
  const [serverUrl, setServerUrl] = useState<string>(() => {
    const storedUrl = localStorage.getItem('synapse-server-url');
    if (storedUrl) {
      return storedUrl;
    }
    // Always use the current origin, as the platform routes all traffic to port 3000
    return window.location.origin;
  });
  
  // --- Theme State ---
  const [themeMode, setThemeMode] = useState<'dark' | 'warm'>(() => {
     return (localStorage.getItem('synapse-theme') as 'dark' | 'warm') || 'dark';
  });

  const toggleTheme = () => {
      setThemeMode(prev => {
          const newMode = prev === 'dark' ? 'warm' : 'dark';
          localStorage.setItem('synapse-theme', newMode);
          return newMode;
      });
  };

  // Apply Theme Class
  useEffect(() => {
     const body = document.body;
     if (themeMode === 'warm') {
         body.classList.add('warm');
     } else {
         body.classList.remove('warm');
     }
  }, [themeMode]);

  // --- Data State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [fileSections, setFileSections] = useState<Section[]>([]);
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [directories, setDirectories] = useState<DirectoryState>({});
  const [editorFiles, setEditorFiles] = useState<EditorNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<EditorFile | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [endTime, setEndTime] = useState<number>(Date.now() + 86400000);
  
  // --- Password Edit State ---
  const [editingPassword, setEditingPassword] = useState('');
  const [passwordUpdateStatus, setPasswordUpdateStatus] = useState<'idle' | 'success'>('idle');
  const [localIpAddresses, setLocalIpAddresses] = useState<string[]>([]);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);

  // --- Local State for Time Inputs ---
  const [editingStartTime, setEditingStartTime] = useState('');
  const [editingEndTime, setEditingEndTime] = useState('');

  useEffect(() => {
    setEditingStartTime(getFormattedDateForInput(startTime));
  }, [startTime]);

  useEffect(() => {
    localStorage.setItem('gemini-api-key', geminiApiKey);
    setApiKeyStatus('idle');
  }, [geminiApiKey]);

  // Fetch local IP addresses for display in Room Diagnostics
  useEffect(() => {
    const fetchIpAddresses = async () => {
      try {
        const response = await fetch('/api/local-ips');
        if (response.ok) {
          const data = await response.json();
          setLocalIpAddresses(data.localIpAddresses || []);
        } else {
          console.error('Failed to fetch local IP addresses:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching local IP addresses:', error);
      }
    };

    if (isConnected) {
      fetchIpAddresses();
    }
  }, [isConnected]);

  // --- Socket Connection Logic ---
  useEffect(() => {
    if (serverUrl.startsWith('file://')) return;

    const socket = io(serverUrl, {
      reconnectionAttempts: 5,
      timeout: 5000, 
      transports: ['websocket', 'polling']
    }); 

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setIsConnecting(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      setIsConnecting(false);
    });

    socket.on('connect_error', () => {
      setIsConnecting(false);
    });

    // --- Room Auth Events ---
    socket.on('auth:success', (data) => {
        setRoomName(data.name);
        setTasks(data.tasks || []);
        setSnippets(data.snippets || []);
        setSections(data.sections || []);
        setFileSections(data.fileSections || []);
        setFiles(data.files || []);
        if(data.startTime) setStartTime(data.startTime);
        if(data.endTime) setEndTime(data.endTime);
        if(data.directories) setDirectories(data.directories);
        
        setIsHost(data.isHost);
        if (data.password) {
            setAccessKey(data.password);
            setEditingPassword(data.password);
        }
        if (data.users) setActiveUsers(data.users);
        if (data.encryptionEnabled !== undefined) setEncryptionEnabled(data.encryptionEnabled);
        
        setAuthError(null);
    });

    socket.on('room:encryptionToggled', (enabled: boolean) => {
        setEncryptionEnabled(enabled);
    });

    socket.on('auth:error', (msg) => {
        if (msg === 'Room does not exist.') {
             setAuthError(msg);
             setRoomName(null);
             localStorage.removeItem('synapse_session');
        } else {
             console.warn("Auth warning:", msg);
        }
    });

    socket.on('auth:kicked', () => {
        setAuthError("You have been kicked from the room.");
        handleLogout();
    });
    
    socket.on('auth:passwordUpdated', (newPass) => {
        setAccessKey(newPass);
        setPasswordUpdateStatus('success');
        setTimeout(() => setPasswordUpdateStatus('idle'), 3000);
        const session = localStorage.getItem('synapse_session');
        if(session) {
            const data = JSON.parse(session);
            data.key = newPass;
            localStorage.setItem('synapse_session', JSON.stringify(data));
        }
    });

    // --- Data Sync Events ---
    socket.on('task:sync', (newTasks: Task[]) => setTasks(newTasks));
    socket.on('snippet:sync', (newSnippets: Snippet[]) => setSnippets(newSnippets));
    socket.on('section:sync', (newSections: Section[]) => setSections(newSections));
    socket.on('fileSection:sync', (newFileSections: Section[]) => setFileSections(newFileSections || []));
    socket.on('files:sync', (newFiles: SharedFile[]) => setFiles(newFiles || []));
    socket.on('timer:sync', (newEndTime: number) => setEndTime(newEndTime));
    socket.on('timer:syncStart', (newStartTime: number) => setStartTime(newStartTime));
    socket.on('users:sync', (users: User[]) => setActiveUsers(users));
    socket.on('directory:sync', (dirs: DirectoryState) => setDirectories(dirs));
    socket.on('editor:sync', (files: EditorNode[]) => setEditorFiles(files));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  // --- Auto Re-Login / Re-Join ---
  useEffect(() => {
    if (isConnected && socketRef.current) {
        if (roomName && accessKey && currentUser?.name) {
             console.log("Re-establishing connection to room:", roomName);
             socketRef.current.emit('room:join', { 
                 name: roomName, 
                 password: accessKey, 
                 createIfMissing: false, 
                 username: currentUser.name 
             });
        } 
        else if (!roomName) {
            const session = localStorage.getItem('synapse_session');
            if (session) {
                try {
                    const { name, key, user } = JSON.parse(session);
                    setCurrentUser({ id: 'pending', name: user });
                    socketRef.current.emit('room:join', { name, password: key, createIfMissing: false, username: user });
                } catch(e) {
                    console.error("Session parse error", e);
                    localStorage.removeItem('synapse_session');
                }
            }
        }
    }
  }, [isConnected]); 

  const handleJoinRoom = (name: string, key: string, isCreating: boolean, username: string) => {
      if (socketRef.current && socketRef.current.connected) {
          setSnippets([]);
          setSections([]);
          setEditorFiles([]);
          setSelectedFile(null);
          setCurrentUser({ id: 'pending', name: username });
          localStorage.setItem('synapse_session', JSON.stringify({ name, key, user: username }));
          socketRef.current.emit('room:join', { name, password: key, createIfMissing: isCreating, username });
      } else {
          setAuthError("No connection to server. Retrying...");
      }
  };

  const handleLogout = () => {
      setRoomName(null);
      setTasks([]);
      setSnippets([]);
      setFiles([]);
      setEditorFiles([]);
      setSelectedFile(null);
      setCurrentUser(null);
      localStorage.removeItem('synapse_session');
      window.location.reload(); 
  };
  
  const handleKickUser = (userId: string) => {
      if(confirm("Are you sure you want to kick this user?")) {
        if (socketRef.current && roomName) {
            socketRef.current.emit('room:kick', { roomName, userId });
        }
      }
  };

  const handleUpdatePassword = () => {
      if (editingPassword === accessKey) return;
      if (socketRef.current && roomName) {
          socketRef.current.emit('room:updatePassword', { roomName, newPassword: editingPassword });
      }
  };

  const handleSetTasks = (newTasksOrFn: React.SetStateAction<Task[]>) => {
    setTasks(prev => {
        const result = typeof newTasksOrFn === 'function' ? newTasksOrFn(prev) : newTasksOrFn;
        if (socketRef.current && roomName) {
            socketRef.current.emit('task:update', { roomName, tasks: result });
        }
        return result;
    });
  };

  const handleSetSnippets = (newSnippetsOrFn: React.SetStateAction<Snippet[]>) => {
    setSnippets(prev => {
        const result = typeof newSnippetsOrFn === 'function' ? newSnippetsOrFn(prev) : newSnippetsOrFn;
        if (socketRef.current && roomName) {
            socketRef.current.emit('snippet:update', { roomName, snippets: result });
        }
        return result;
    });
  };

  const handleSetSections = (newSectionsOrFn: React.SetStateAction<Section[]>) => {
    setSections(prev => {
        const result = typeof newSectionsOrFn === 'function' ? newSectionsOrFn(prev) : newSectionsOrFn;
        if (socketRef.current && roomName) {
            socketRef.current.emit('section:update', { roomName, sections: result });
        }
        return result;
    });
  };

  const handleUpdateFileSections = (updatedSections: Section[]) => {
    if (socketRef.current && roomName) {
        socketRef.current.emit('fileSection:update', { roomName, sections: updatedSections });
    }
    setFileSections(updatedSections);
  };

  const handleUpdateTimer = (newTime: number) => {
      setEndTime(newTime);
      if (socketRef.current && roomName) {
          socketRef.current.emit('timer:update', { roomName, endTime: newTime });
      }
  };

  const handleUpdateStartTime = (newTime: number) => {
      setStartTime(newTime);
      if (socketRef.current && roomName) {
          socketRef.current.emit('timer:updateStart', { roomName, startTime: newTime });
      }
  };

  const handleToggleEncryption = (enabled: boolean) => {
      if (socketRef.current && roomName) {
          socketRef.current.emit('room:toggleEncryption', enabled);
      }
  };

  // --- EDITOR HANDLERS ---
  const getLanguageFromExt = (name: string) => {
    const ext = name.split('.').pop();
    switch(ext) {
        case 'ts': case 'tsx': return 'typescript';
        case 'js': case 'jsx': return 'javascript';
        case 'py': return 'python';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'json': return 'json';
        case 'md': return 'markdown';
        default: return 'plaintext';
    }
  };

  const handleCreateFile = (parentId: string | null, name: string) => {
    const newNode: EditorFile = {
        id: Date.now().toString(),
        name,
        type: 'file',
        parentId,
        content: '',
        language: getLanguageFromExt(name)
    };
    socketRef.current?.emit('editor:create', { roomName, node: newNode });
  };

  const handleCreateFolder = (parentId: string | null, name: string) => {
    const newNode: EditorFolder = {
        id: Date.now().toString(),
        name,
        type: 'directory',
        parentId,
        children: []
    };
    socketRef.current?.emit('editor:create', { roomName, node: newNode });
  };

  const handleDeleteNode = (nodeId: string) => {
    socketRef.current?.emit('editor:delete', { roomName, nodeId });
    if (selectedFile?.id === nodeId) setSelectedFile(null);
  };

  const handleRenameNode = (nodeId: string, newName: string) => {
    socketRef.current?.emit('editor:rename', { roomName, nodeId, newName });
  };

  const handleDownloadZip = () => {
    window.open(`/api/editor/download-zip/${roomName}`, '_blank');
  };

  const getFormattedDateForInput = (timestamp: number) => {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (!roomName) {
      return (
          <Login 
              onJoin={handleJoinRoom} 
              error={authError} 
              themeMode={themeMode}
              toggleTheme={toggleTheme}
          />
      );
  }

  return (
    <div className="min-h-screen text-hack-text font-sans selection:bg-hack-primary selection:text-black flex flex-col animate-fade-in overflow-hidden relative pb-24 transition-colors duration-500 rounded-2xl shadow-lg">
      <SubtleBackground mode={themeMode} />
      
      <header className="border-b border-hack-border bg-hack-bg/80 backdrop-blur-md sticky top-0 z-50 rounded-b-2xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black font-sans italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-hack-primary via-hack-text to-hack-secondary drop-shadow-[0_0_15px_rgba(var(--hack-primary),0.4)]">
              SYNAPSE
            </h1>
            <div className="flex items-center gap-2 text-xs font-mono border border-hack-border px-3 py-1.5 rounded-full bg-hack-surface/50 clip-corner">
                <Users className={`w-3 h-3 ${isHost ? 'text-hack-secondary' : 'text-hack-primary'}`} />
                <span className="text-hack-muted">USER:</span>
                <span className={`${isHost ? 'text-hack-secondary' : 'text-hack-primary'} font-bold`}>{currentUser?.name || "Anon"}</span>
            </div>
            
            <div className="hidden md:flex gap-4 border-l border-hack-border pl-4">
                 <div className="flex flex-col">
                     <span className="text-[9px] text-hack-muted font-mono leading-none uppercase tracking-wider">Session ID</span>
                     <span className="text-xs font-bold text-hack-text font-mono leading-none mt-1 text-shadow-glow">{roomName}</span>
                 </div>
                 <div className="flex flex-col">
                     <span className="text-[9px] text-hack-muted font-mono leading-none uppercase tracking-wider">Network</span>
                     <div className="flex items-center gap-1 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-hack-primary shadow-[0_0_5px_rgba(var(--hack-primary), 1)]' : 'bg-red-500 shadow-[0_0_5px_red]'}`}></div>
                        <span className={`text-xs font-mono leading-none ${isConnected ? 'text-hack-primary' : 'text-red-500'}`}>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
                     </div>
                 </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Timer endTime={endTime} />
            <ThemeToggle themeMode={themeMode} toggleTheme={toggleTheme} />
          </div>
        </div>
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-hack-primary/30 to-transparent absolute bottom-0"></div>
      </header>

      <div className="flex flex-1 container mx-auto px-4 py-6 gap-6 overflow-hidden relative z-10 h-[calc(100vh-80px)]">
        
        <main className="flex-1 flex flex-col gap-6 overflow-hidden h-full pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                <div className="lg:col-span-3 h-full overflow-hidden flex flex-col relative">

                    {/* Corner Decorations */}
                    <div className="absolute top-0 left-0 w-24 h-24 border-l border-t border-hack-border rounded-tl-lg opacity-30"></div>
                    <div className="absolute top-0 right-0 w-24 h-24 border-r border-t border-hack-border rounded-tr-lg opacity-30"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 border-l border-b border-hack-border rounded-bl-lg opacity-30"></div>
                    <div className="absolute bottom-0 right-0 w-24 h-24 border-r border-b border-hack-border rounded-br-lg opacity-30"></div>

                    <div className="flex-1 backdrop-blur-sm border border-hack-border p-1 h-full overflow-hidden rounded-xl relative">
                        <AnimatePresence mode="wait">
                            {view === 'whiteboard' && (
                                <motion.div
                                    key="whiteboard"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full w-full"
                                >
                                    <Whiteboard socket={socketRef.current} roomName={roomName} />
                                </motion.div>
                            )}
                            {view === 'kanban' && (
                                <motion.div
                                    key="kanban"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full w-full"
                                >
                                    <Kanban tasks={tasks} setTasks={handleSetTasks} />
                                </motion.div>
                            )}
                            {view === 'snippets' && (
                                <motion.div
                                    key="snippets"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full w-full"
                                >
                                    <SnippetVault 
                                        snippets={snippets} 
                                        setSnippets={handleSetSnippets} 
                                        sections={sections} 
                                        setSections={handleSetSections} 
                                        geminiApiKey={geminiApiKey} 
                                        categorizeSnippets={categorizeSnippets} 
                                        debugCode={debugCode} 
                                        analyzeCode={analyzeCode} 
                                        roomPassword={accessKey || ''}
                                        encryptionEnabled={encryptionEnabled}
                                    />
                                </motion.div>
                            )}
                            {view === 'files' && (
                                <motion.div
                                    key="files"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full w-full"
                                >
                                    <FileBrowser 
                                        files={files}
                                        sections={fileSections}
                                        onSectionsChange={handleUpdateFileSections}
                                        // FIX: removed premature fetch before confirm — delete only fires after user confirms
                                        onFileDelete={(fileName) => {
                                            if (confirm(`Are you sure you want to delete ${fileName}?`)) {
                                                fetch(`/upload/${roomName}/${fileName}`, { method: 'DELETE' });
                                            }
                                        }}
                                        serverUrl={serverUrl}
                                        roomName={roomName}
                                        analyzeFileContent={analyzeFileContent}
                                        categorizeFiles={categorizeFiles}
                                        geminiApiKey={geminiApiKey}
                                        roomPassword={accessKey || ''}
                                        encryptionEnabled={encryptionEnabled}
                                    />
                                </motion.div>
                            )}
                            {view === 'boilerplate' && (
                                <motion.div
                                    key="boilerplate"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full w-full"
                                >
                                    <BoilerplateGenerator />
                                </motion.div>
                            )}
                            {view === 'directory' && (
                                <motion.div
                                    key="directory"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full w-full"
                                >
                                    <DirectoryBrowser 
                                        directories={directories} 
                                        currentUserId={socketRef.current?.id || ''}
                                        serverUrl={serverUrl}
                                        roomName={roomName}
                                        socket={socketRef.current}
                                    />
                                </motion.div>
                            )}
                            {view === 'code-editor' && (
                                <motion.div
                                    key="code-editor"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full w-full flex overflow-hidden relative"
                                >
                                    {(!isMobile || showMobileSidebar) && (
                                        <div className={`${isMobile ? 'absolute inset-0 z-20 bg-[#0D0D0D]' : ''}`}>
                                            <ProjectSidebar
                                                files={editorFiles}
                                                onSelectFile={(file) => {
                                                    setSelectedFile(file);
                                                    if (isMobile) setShowMobileSidebar(false);
                                                }}
                                                onCreateFile={handleCreateFile}
                                                onCreateFolder={handleCreateFolder}
                                                onDelete={handleDeleteNode}
                                                onRename={handleRenameNode}
                                                onDownloadZip={handleDownloadZip}
                                                selectedFileId={selectedFile?.id || null}
                                                onCloseMobile={isMobile ? () => setShowMobileSidebar(false) : undefined}
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 flex flex-col h-full w-full">
                                        {isMobile && (
                                            <div className="bg-[#252526] border-b border-[#333] p-2 flex items-center">
                                                <button 
                                                    onClick={() => setShowMobileSidebar(true)}
                                                    className="text-gray-400 hover:text-white px-3 py-1 bg-[#333] rounded text-xs font-bold"
                                                >
                                                    ☰ FILES
                                                </button>
                                            </div>
                                        )}
                                        {selectedFile ? (
                                            <CollaborativeCodeEditor 
                                                roomName={roomName} 
                                                documentId={selectedFile.id}
                                                initialContent={selectedFile.content}
                                                language={selectedFile.language}
                                                socket={socketRef.current!}
                                            />
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-gray-500 bg-[#1e1e1e]">
                                                <div className="text-center">
                                                    <p className="mb-2">Select a file to start editing</p>
                                                    <p className="text-xs opacity-50">Changes are saved automatically</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                            {view === 'admin' && (
                                <motion.div
                                    key="admin"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full w-full"
                                >
                                    <ServerStats onBack={() => setView('kanban')} />
                                </motion.div>
                            )}
                            {view === 'settings' && (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full w-full"
                                >
                                    <Settings
                                        currentUser={currentUser}
                                        isHost={isHost}
                                        geminiApiKey={geminiApiKey}
                                        setGeminiApiKey={setGeminiApiKey}
                                        validateApiKey={validateApiKey}
                                        apiKeyStatus={apiKeyStatus}
                                        editingPassword={editingPassword}
                                        setEditingPassword={setEditingPassword}
                                        accessKey={accessKey}
                                        handleUpdatePassword={handleUpdatePassword}
                                        passwordUpdateStatus={passwordUpdateStatus}
                                        editingStartTime={editingStartTime}
                                        setEditingStartTime={setEditingStartTime}
                                        handleUpdateStartTime={handleUpdateStartTime}
                                        startTime={startTime}
                                        editingEndTime={editingEndTime}
                                        setEditingEndTime={setEditingEndTime}
                                        handleUpdateTimer={handleUpdateTimer}
                                        endTime={endTime}
                                        handleLogout={handleLogout}
                                        activeUsers={activeUsers}
                                        handleKickUser={handleKickUser}
                                        currentUserId={socketRef.current?.id || ''}
                                        roomName={roomName}
                                        localIpAddresses={localIpAddresses}
                                        encryptionEnabled={encryptionEnabled}
                                        onToggleEncryption={handleToggleEncryption}
                                    />
                                </motion.div>
                            )}
                            {view === 'chat' && (
                                <motion.div
                                    key="chat"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full w-full flex flex-col gap-4"
                                >
                                    <ChatBox 
                                        socket={socketRef.current} 
                                        roomName={roomName || ''} 
                                        username={currentUser?.name || 'Anon'} 
                                        roomPassword={accessKey || ''}
                                        encryptionEnabled={encryptionEnabled}
                                        fullHeight={true}
                                    />
                                </motion.div>
                            )}
                            {view === 'diagnostics' && (
                                <motion.div
                                    key="diagnostics"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full w-full flex flex-col gap-4"
                                >
                                    <PressureMeter tasks={tasks} endTime={endTime} startTime={startTime} />
                                    <div className="bg-hack-surface/50 border border-hack-border p-4 rounded-lg flex-1 clip-corner backdrop-blur-md">
                                        <h3 className="font-bold text-hack-muted text-xs uppercase mb-4 tracking-widest border-b border-hack-border pb-2">Room Diagnostics</h3>
                                        <div className="space-y-4 font-mono text-xs">
                                            <div className="flex flex-col">
                                                <span className="text-hack-muted mb-1">ROOM ID</span>
                                                <span className="text-hack-primary text-lg bg-hack-bg p-2 rounded border border-hack-primary/20">{roomName}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-hack-muted mb-1">HOST IPs</span>
                                                {localIpAddresses.length > 0 ? (
                                                    localIpAddresses.map((ip, index) => (
                                                        <a 
                                                            key={index} 
                                                            href={`http://${ip}:${window.location.port}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-hack-text bg-hack-bg p-2 rounded border border-hack-border hover:border-hack-primary transition-colors block mb-1 last:mb-0"
                                                        >
                                                            http://{ip}:{window.location.port}
                                                        </a>
                                                    ))
                                                ) : (
                                                    <span className="text-hack-text bg-hack-bg p-2 rounded border border-hack-border">N/A</span>
                                                )}
                                            </div>
                                            <div className="mt-4 p-2 bg-yellow-900/10 border border-yellow-500/20 text-yellow-500/80 rounded">
                                                SYSTEM OPTIMAL. LATENCY: LOW.
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="hidden lg:flex lg:col-span-1 flex-col gap-4 h-full overflow-y-auto">
                    <PressureMeter tasks={tasks} endTime={endTime} startTime={startTime} />
                    <ChatBox 
                        socket={socketRef.current} 
                        roomName={roomName || ''} 
                        username={currentUser?.name || 'Anon'} 
                        roomPassword={accessKey || ''}
                        encryptionEnabled={encryptionEnabled}
                    />
                    
                    <div className="bg-hack-surface/50 border border-hack-border p-4 rounded-lg flex-1 clip-corner backdrop-blur-md">
                        <h3 className="font-bold text-hack-muted text-xs uppercase mb-4 tracking-widest border-b border-hack-border pb-2">Room Diagnostics</h3>
                        <div className="space-y-4 font-mono text-xs">
                            <div className="flex flex-col">
                                <span className="text-hack-muted mb-1">ROOM ID</span>
                                <span className="text-hack-primary text-lg bg-hack-bg p-2 rounded border border-hack-primary/20">{roomName}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-hack-muted mb-1">HOST IPs</span>
                                {localIpAddresses.length > 0 ? (
                                    localIpAddresses.map((ip, index) => (
                                        <a 
                                            key={index} 
                                            href={`http://${ip}:${window.location.port}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-hack-text bg-hack-bg p-2 rounded border border-hack-border hover:border-hack-primary transition-colors block mb-1 last:mb-0"
                                        >
                                            http://{ip}:{window.location.port}
                                        </a>
                                    ))
                                ) : (
                                    <span className="text-hack-text bg-hack-bg p-2 rounded border border-hack-border">N/A</span>
                                )}
                            </div>
                            <div className="mt-4 p-2 bg-yellow-900/10 border border-yellow-500/20 text-yellow-500/80 rounded">
                                SYSTEM OPTIMAL. LATENCY: LOW.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
      </div>

      <SpotlightNavbar currentView={view} onNavigate={setView} isMobile={isMobile} />

      {/* FIX: merged offline overlay from broken second return into the single return */}
      {!isConnecting && !isConnected && (
          <div className="fixed inset-0 z-[9999] backdrop-blur-xl bg-black/60 flex flex-col items-center justify-center p-4">
              <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center flex flex-col items-center border border-red-500/30 bg-black/40 p-12 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)]"
              >
                  <h2 className="text-6xl md:text-8xl font-black font-sans tracking-widest text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] mb-4">OFFLINE</h2>
                  <p className="text-hack-muted font-mono mb-8 max-w-md text-sm leading-relaxed">
                      Connection to Synapse server severed. Local systems isolated. Data synchronization halted.
                  </p>
                  <button 
                      onClick={() => {
                          setIsConnecting(true);
                          if (socketRef.current) {
                              socketRef.current.connect();
                          } else {
                              window.location.reload();
                          }
                      }}
                      className="px-8 py-3 bg-red-500/10 border border-red-500 text-red-500 font-bold font-mono uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] cursor-pointer"
                  >
                      Attempt Reconnection
                  </button>
              </motion.div>
          </div>
      )}
    </div>
  );
};

export default App;