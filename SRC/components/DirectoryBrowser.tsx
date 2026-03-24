
import React, { useState, useRef, useEffect } from 'react';
import { FileSystemItem, DirectoryState } from '@/types';
import { Icons } from '@/components/Icons';
import { Socket } from 'socket.io-client';

interface DirectoryBrowserProps {
    directories: DirectoryState;
    currentUserId: string;
    serverUrl: string;
    roomName: string;
    socket: Socket | null;
}

const FileTreeItem: React.FC<{ 
    item: FileSystemItem; 
    depth: number; 
    ownerId: string; 
    serverUrl: string; 
    roomName: string;
    isMyDir: boolean;
    onDeleteDir: (path: string) => void;
}> = ({ item, depth, ownerId, serverUrl, roomName, isMyDir, onDeleteDir }) => {
    const [isOpen, setIsOpen] = useState(false);
    const paddingLeft = `${depth * 16}px`;

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const cleanUrl = serverUrl.replace(/\/$/, '');
        const downloadUrl = `${cleanUrl}/api/directory/download/${encodeURIComponent(roomName)}/${encodeURIComponent(ownerId)}/${item.path}`;
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Remove directory "${item.name}" from share?`)) {
            onDeleteDir(item.name); // Delete by top-level folder name
        }
    };

    if (item.type === 'directory') {
        return (
            <div className="select-none">
                <div 
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between py-1 hover:bg-white/5 cursor-pointer rounded px-2 transition-colors group"
                    style={{ paddingLeft }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-hack-muted transition-transform duration-200">
                            {isOpen ? <Icons.ChevronDown className="w-3 h-3" /> : <Icons.ChevronRight className="w-3 h-3" />}
                        </span>
                        {/* Use hack-primary for folder color to be theme-aware (Amber in Light, Violet in Dark) */}
                        <span className="text-hack-primary opacity-80">
                            {isOpen ? <Icons.FolderOpen className="w-4 h-4" /> : <Icons.Folder className="w-4 h-4" />}
                        </span>
                        <span className="text-sm font-mono text-gray-300 group-hover:text-hack-text truncate font-bold">{item.name}</span>
                    </div>
                    
                    {/* Only show delete for top-level directories owned by user */}
                    {isMyDir && depth === 0 && (
                        <button 
                            onClick={handleDelete}
                            className="text-hack-muted hover:text-hack-danger opacity-0 group-hover:opacity-100 p-1 hover:bg-red-900/20 rounded transition-all"
                            title="Remove Directory"
                        >
                            <Icons.Trash className="w-3 h-3" />
                        </button>
                    )}
                </div>
                {isOpen && item.children && (
                    <div className="border-l border-white/10 ml-4">
                        {item.children.map((child, idx) => (
                            <FileTreeItem 
                                key={idx} 
                                item={child} 
                                depth={depth + 1} 
                                ownerId={ownerId}
                                serverUrl={serverUrl}
                                roomName={roomName}
                                isMyDir={isMyDir}
                                onDeleteDir={onDeleteDir}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div 
            className="flex items-center justify-between py-1 hover:bg-white/5 cursor-pointer rounded px-2 group"
            style={{ paddingLeft }}
            onClick={handleDownload}
        >
            <div className="flex items-center gap-2 overflow-hidden">
                <Icons.File className="w-3 h-3 text-blue-400 flex-shrink-0" />
                <span className="text-sm font-mono text-gray-400 group-hover:text-hack-primary truncate" title={item.name}>{item.name}</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Icons.Download className="w-3 h-3 text-hack-muted hover:text-white" />
            </div>
        </div>
    );
};

export const DirectoryBrowser: React.FC<DirectoryBrowserProps> = ({ directories, currentUserId, serverUrl, roomName, socket }) => {
    const [sharing, setSharing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [isApiSupported, setIsApiSupported] = useState(true);
    
    // Store actual File objects in memory for relay
    const localFilesRef = useRef<Map<string, File>>(new Map());
    // Store directory handles for live sync
    const directoryHandlesRef = useRef<Map<string, FileSystemDirectoryHandle>>(new Map());

    // Auto-select user if none selected
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsApiSupported('showDirectoryPicker' in window);
    }, []);

    useEffect(() => {
        if (!selectedUser && Object.keys(directories).length > 0) {
            // Prefer selecting self if available
            if (directories[currentUserId]) {
                setSelectedUser(currentUserId);
            } else {
                setSelectedUser(Object.keys(directories)[0]);
            }
        }
    }, [directories, currentUserId, selectedUser]);

    // --- FILE REQUEST RELAY LISTENER ---
    useEffect(() => {
        if (!socket) return;

        const handleFileRequest = async ({ requestId, path }: { requestId: string, path: string }) => {
            console.log(`Received request for file: ${path} (ID: ${requestId})`);
            const file = localFilesRef.current.get(path);
            
            if (!file) {
                console.warn("Requested file not found in local memory:", path);
                return;
            }

            try {
                // Stream file to server relay endpoint
                const cleanUrl = serverUrl.replace(/\/$/, '');
                await fetch(`${cleanUrl}/api/directory/relay/${requestId}`, {
                    method: 'POST',
                    headers: {
                        'x-filename': file.name
                    },
                    body: file // Browser streams this body
                });
                console.log("File relayed successfully");
            } catch (e) {
                console.error("Error relaying file:", e);
            }
        };

        socket.on('file:request', handleFileRequest);

        const handleResyncRequest = () => {
            if (localFilesRef.current.size > 0) {
                console.log("Received resync request from server, sending full tree.");
                syncTreeToServer();
            }
        };
        socket.on('directory:resync-request', handleResyncRequest);

        return () => {
            socket.off('file:request', handleFileRequest);
            socket.off('directory:resync-request', handleResyncRequest);
        };
    }, [socket, serverUrl]);

    const syncTreeToServer = async () => {
        if (!socket) return;
        
        // Rebuild Tree from map
        const root: FileSystemItem[] = [];
        
        const findOrCreateNode = (level: FileSystemItem[], name: string): FileSystemItem => {
            let node = level.find(n => n.name === name);
            if (!node) {
                node = { name, type: 'directory', children: [], path: '' }; 
                level.push(node);
            }
            return node;
        };

        // Iterate all local files to build tree
        localFilesRef.current.forEach((file, relPath) => {
             const parts = relPath.split('/');
             let currentLevel = root;
             
             parts.forEach((part, i) => {
                if (i === parts.length - 1) {
                    currentLevel.push({
                        name: part,
                        type: 'file',
                        size: file.size,
                        path: relPath
                    });
                } else {
                    const node = findOrCreateNode(currentLevel, part);
                    currentLevel = node.children!;
                }
            });
        });

        // Sync to server
        try {
            const cleanUrl = serverUrl.replace(/\/$/, '');
            const userState = JSON.parse(localStorage.getItem('synapse_session') || '{}');

            await fetch(`${cleanUrl}/api/directory/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomName: roomName,
                    userId: socket.id,
                    userName: userState.user || 'Anon',
                    tree: root
                })
            });
            // Auto select myself
            setSelectedUser(socket.id!);
        } catch (err) {
            console.error(err);
            alert("Failed to sync directory.");
        }
    };



    const handleRequestSync = () => {
        if (!socket) return;
        socket.emit('directory:request-sync', { roomName, targetUserId: selectedUser });
    };

    const handleUnshareAll = async () => {
        if(!socket) return;
        if(!confirm("Stop sharing ALL directories? Remote users will lose access immediately.")) return;

        try {
            const cleanUrl = serverUrl.replace(/\/$/, '');
            await fetch(`${cleanUrl}/api/directory/unshare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName, userId: socket.id })
            });
            localFilesRef.current.clear();
        } catch(e) {
            console.error(e);
        }
    };

    const handleDeleteDirectory = async (folderName: string) => {
        // Remove all files that start with folderName/
        const keysToDelete: string[] = [];
        localFilesRef.current.forEach((_, key) => {
            // Check if key starts with folder name + /
            if (key.startsWith(folderName + '/')) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(k => localFilesRef.current.delete(k));
        await syncTreeToServer();
    };


    const processDirectory = async (handle: FileSystemDirectoryHandle, path: string = '') => {
        const files = new Map<string, File>();
        const tree: FileSystemItem[] = [];

        for await (const entry of handle.values()) {
            const entryPath = path ? `${path}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
                const file = await entry.getFile();
                files.set(entryPath, file);
                tree.push({ name: entry.name, type: 'file', size: file.size, path: entryPath });
            } else if (entry.kind === 'directory') {
                const { files: childFiles, tree: childTree } = await processDirectory(entry, entryPath);
                childFiles.forEach((file, p) => files.set(p, file));
                tree.push({ name: entry.name, type: 'directory', children: childTree, path: entryPath });
            }
        }
        return { files, tree };
    };

    const handleLegacyShare = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!socket) return;

        setSharing(true);
        const fileList = Array.from(e.target.files);

        fileList.forEach(file => {
            const currentFile = file as File & { webkitRelativePath: string };
            const relPath: string = currentFile.webkitRelativePath || currentFile.name;
            if(relPath.split('/').some(p => p === '.git' || p === 'node_modules')) return;

            localFilesRef.current.set(relPath, currentFile);
        });

        await syncTreeToServer();
        setSharing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleShareLiveDirectory = async () => {

        try {
            const dirHandle = await window.showDirectoryPicker();
            setSharing(true);

            const { files, tree } = await processDirectory(dirHandle);
            
            directoryHandlesRef.current.set(dirHandle.name, dirHandle);
            // Prepend the root directory name to all paths
            files.forEach((file, path) => localFilesRef.current.set(`${dirHandle.name}/${path}`, file));

            await syncTreeToServer(); 

        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                console.error('Error selecting directory:', err);
                alert('An error occurred while trying to share the directory.');
            }
        } finally {
            setSharing(false);
        }
    };

    const activeDir = selectedUser ? directories[selectedUser] : null;
    const isMyDir = selectedUser === currentUserId;
    const hasShared = !!directories[currentUserId];

    // --- LIVE SYNC LOGIC ---
    useEffect(() => {
        const syncInterval = setInterval(() => {
            if (directoryHandlesRef.current.size > 0) {
                checkForUpdates();
            }
        }, 5000); // Check for updates every 5 seconds

        return () => clearInterval(syncInterval);
    }, []);

    const checkForUpdates = async () => {
        let hasChanges = false;

        for (const [dirName, dirHandle] of directoryHandlesRef.current.entries()) {
            try {
                const { files: newFiles } = await processDirectory(dirHandle);
                
                // Filter for keys belonging to the current directory being checked
                const currentFilePaths = Array.from(localFilesRef.current.keys()).filter(p => p.startsWith(dirName + '/'));
                // Create new paths with the root directory name prepended
                const newFilePaths = Array.from(newFiles.keys()).map(p => `${dirName}/${p}`);

                if (currentFilePaths.length !== newFilePaths.length) {
                    hasChanges = true;
                } else {
                    for (const path of newFilePaths) {
                        const existingFile = localFilesRef.current.get(path);
                        const newFile = newFiles.get(path)!;
                        if (!existingFile || existingFile.size !== newFile.size || existingFile.lastModified !== newFile.lastModified) {
                            hasChanges = true;
                            break;
                        }
                    }
                }

                if (hasChanges) {
                    console.log(`Changes detected in ${dirName}. Resyncing...`);
                    // Remove all old file entries for this directory
                    currentFilePaths.forEach(p => localFilesRef.current.delete(p));
                    // Add the new file entries with the correct full path
                    newFiles.forEach((file, path) => localFilesRef.current.set(`${dirName}/${path}`, file));
                    break; 
                }
            } catch (err) {
                if ((err as Error).name === 'NotAllowedError') {
                    console.warn(`Permission to directory '${dirName}' was revoked. Removing from live sync.`);
                    directoryHandlesRef.current.delete(dirName);
                    handleDeleteDirectory(dirName);
                } else {
                    console.error(`Error checking directory ${dirName}:`, err);
                }
            }
        }

        if (hasChanges) {
            await syncTreeToServer();
        }
    };

    return (
        <div className="h-full flex flex-col md:grid md:grid-cols-4 gap-6">
            <div className="bg-hack-surface border border-hack-border rounded-lg p-4 flex flex-col md:col-span-1 h-48 md:h-full shrink-0">
                <div className="mb-2 md:mb-4">
                    <h3 className="text-xs font-bold text-hack-muted uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Icons.Monitor className="w-4 h-4"/> Connected Drives
                    </h3>
                    <p className="text-[9px] text-gray-500">Peer-to-Peer Relay Mode</p>
                </div>
                
                <div className="flex flex-col overflow-y-auto space-y-2 flex-1 custom-scrollbar">
                    {Object.keys(directories).map(uid => {
                        const dir = directories[uid];
                        return (
                            <button
                                key={uid}
                                onClick={() => setSelectedUser(uid)}
                                className={`w-full shrink-0 text-left p-3 rounded border transition-all flex items-center justify-between gap-4 ${
                                    selectedUser === uid 
                                    ? 'bg-hack-primary/10 border-hack-primary text-hack-text shadow-[0_0_10px_rgba(var(--hack-primary),0.2)]' 
                                    : 'bg-hack-bg border-hack-border text-gray-400 hover:border-gray-500'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${dir.isOnline ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-red-500'}`} />
                                    <div className="flex flex-col">
                                        <span className="font-mono text-xs font-bold whitespace-nowrap">{dir.userName}</span>
                                        <span className="text-[9px] uppercase tracking-wider opacity-70">
                                            {uid === currentUserId ? '(LOCAL)' : 'REMOTE'}
                                        </span>
                                    </div>
                                </div>
                                <Icons.ChevronRight className={`w-3 h-3 hidden md:block ${selectedUser === uid ? 'opacity-100' : 'opacity-0'}`} />
                            </button>
                        );
                    })}
                </div>

                <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-hack-border space-y-2 shrink-0">
                    {isApiSupported ? (
                        <button 
                            onClick={handleShareLiveDirectory}
                            disabled={sharing}
                            className="w-full py-3 bg-hack-surface border border-hack-primary text-hack-primary hover:bg-hack-primary hover:text-black transition-colors rounded font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            {sharing ? <span className="animate-pulse">Indexing...</span> : <><Icons.Plus className="w-4 h-4" /> Share Live Directory</>}
                        </button>
                    ) : (
                        <>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden"
                                // @ts-ignore
                                webkitdirectory="" 
                                directory="" 
                                multiple 
                                onChange={handleLegacyShare}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={sharing}
                                className="w-full py-3 bg-hack-surface border border-hack-primary text-hack-primary hover:bg-hack-primary hover:text-black transition-colors rounded font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                {sharing ? <span className="animate-pulse">Indexing...</span> : <><Icons.Plus className="w-4 h-4" /> {hasShared ? 'Resync Directory' : 'Add Directory'}</>}
                            </button>
                        </>
                    )}

                    {hasShared && (
                         <button 
                            onClick={handleUnshareAll}
                            className="w-full py-3 bg-red-900/20 border border-red-500/50 text-red-500 hover:bg-red-900/40 transition-colors rounded font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <Icons.Trash className="w-4 h-4" /> Clear All Shared
                        </button>
                    )}
                    
                    <p className="text-[9px] text-center text-hack-muted">
                        Files are streamed from your device on request. Not stored on server.
                    </p>
                </div>
            </div>

            <div className="bg-hack-surface/50 border border-hack-border rounded-lg md:col-span-3 h-full overflow-hidden flex flex-col holo-border relative">
                {!activeDir ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-hack-muted opacity-50">
                        <Icons.Folder className="w-16 h-16 mb-4" />
                        <p>Select a drive to browse file system.</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-hack-bg border-b border-hack-border p-3 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-hack-primary font-mono text-sm">root@{activeDir.userName}:~/</span>
                                <span className="bg-hack-border px-2 py-0.5 rounded text-[10px] text-hack-text">READ ONLY</span>
                            </div>
                            <button onClick={handleRequestSync} className="text-hack-muted hover:text-hack-primary p-1 rounded hover:bg-white/10 transition-colors">
                                <Icons.RefreshCw className="w-3 h-3" />
                            </button>
                            {isMyDir && <span className="text-[10px] text-green-400 font-mono animate-pulse">● HOSTING ACTIVE</span>}
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 font-mono text-sm custom-scrollbar">
                            {activeDir.root.map((item, idx) => (
                                <FileTreeItem 
                                    key={idx} 
                                    item={item} 
                                    depth={0} 
                                    ownerId={selectedUser!} 
                                    serverUrl={serverUrl}
                                    roomName={roomName}
                                    isMyDir={isMyDir}
                                    onDeleteDir={handleDeleteDirectory}
                                />
                            ))}
                            {activeDir.root.length === 0 && (
                                <div className="p-4 text-gray-500 italic">Empty directory listing.</div>
                            )}
                        </div>
                    </>
                )}
                
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-hack-primary/50 to-transparent opacity-50 pointer-events-none" />
            </div>
        </div>
    );
};