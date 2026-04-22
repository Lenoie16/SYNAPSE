import React, { useEffect, useState, useRef } from 'react';
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
    socket: Socket | null;
    onRequestLocalPath?: (path: string) => void;
}> = ({ item, depth, ownerId, serverUrl, roomName, isMyDir, onDeleteDir, socket, onRequestLocalPath }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [localChildren, setLocalChildren] = useState<FileSystemItem[] | undefined>(item.children);
    const paddingLeft = `${depth * 16}px`;

    useEffect(() => {
        setLocalChildren(item.children);
        setIsLoading(false);
    }, [item.children]);

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        const cleanUrl = serverUrl.replace(/\/$/, '');
        const downloadUrl = `${cleanUrl}/api/directory/download/${encodeURIComponent(roomName)}/${encodeURIComponent(ownerId)}/${item.path}`;

        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Remove directory "${item.name}" from share?`)) {
            onDeleteDir(item.name);
        }
    };

    const handleToggle = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!isOpen && localChildren === undefined) {
            setIsLoading(true);
            if (isMyDir && onRequestLocalPath) {
                onRequestLocalPath(item.path);
            } else if (!isMyDir && socket) {
                socket.emit('directory:request-path', { roomName, targetUserId: ownerId, path: item.path });
            }
        }
        setIsOpen(prev => !prev);
    };

    return (
        <div>
            <div
                className="flex items-center justify-between py-1 hover:bg-white/5 cursor-pointer rounded px-2 transition-colors group"
                style={{ paddingLeft }}
                onClick={handleToggle}
            >
                <div className="flex items-center gap-2">
                    <span className="text-hack-muted transition-transform duration-200">
                        {item.type === 'directory' ? (isOpen ? <Icons.ChevronDown className="w-3 h-3" /> : <Icons.ChevronRight className="w-3 h-3" />) : null}
                    </span>
                    <span className="text-hack-primary opacity-80">
                        {item.type === 'directory' ? (isOpen ? <Icons.FolderOpen className="w-4 h-4" /> : <Icons.Folder className="w-4 h-4" />) : <Icons.File className="w-4 h-4" />}
                    </span>
                    <span className="text-sm font-mono text-gray-300 group-hover:text-hack-text truncate font-bold">{item.name}</span>
                    {isLoading && <span className="text-[10px] text-hack-muted animate-pulse ml-2">Loading...</span>}
                </div>
                <div className="flex items-center gap-1">
                    {item.type === 'directory' && isMyDir && (
                        <button
                            onClick={handleDelete}
                            className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                            title="Remove directory from share"
                        >
                            <Icons.Trash className="w-3 h-3" />
                        </button>
                    )}
                    {item.type === 'file' && (
                        <button
                            onClick={handleDownload}
                            className="text-hack-muted hover:text-hack-primary p-1 rounded transition-colors"
                            title="Download file"
                        >
                            <Icons.Download className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {isOpen && localChildren && item.type === 'directory' && (
                <div>
                    {localChildren.map((child, idx) => (
                        <FileTreeItem
                            key={idx}
                            item={child}
                            depth={depth + 1}
                            ownerId={ownerId}
                            serverUrl={serverUrl}
                            roomName={roomName}
                            isMyDir={isMyDir}
                            onDeleteDir={onDeleteDir}
                            socket={socket}
                            onRequestLocalPath={onRequestLocalPath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const DirectoryBrowser: React.FC<DirectoryBrowserProps> = ({ directories, currentUserId, serverUrl, roomName, socket }) => {
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [localTree, setLocalTree] = useState<FileSystemItem[]>([]);
    const [sharing, setSharing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const keys = Object.keys(directories || {});
        if (keys.length === 0) {
            setSelectedUser(null);
            return;
        }
        if (directories[currentUserId]) {
            setSelectedUser(currentUserId);
        } else {
            setSelectedUser(keys[0]);
        }
    }, [directories, currentUserId]);

    const activeDir = selectedUser ? directories[selectedUser] : null;
    const isMyDir = selectedUser === currentUserId;
    const hasShared = !!directories[currentUserId];

    const handleRequestSync = () => {
        if (!socket) return;
        socket.emit('directory:request-sync', { roomName, targetUserId: selectedUser });
    };

    const handleDeleteDirectory = async (folderName: string) => {
        console.log('delete directory', folderName);
    };

    const handleLegacyShare = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setSharing(true);
        const files = Array.from(e.target.files).map(f => ({ name: f.name, type: 'file', size: (f as File).size, path: f.name } as FileSystemItem));
        setLocalTree(files);
        setSharing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleShareLiveDirectory = async () => {
        if (!('showDirectoryPicker' in window)) {
            alert('Directory Picker API not supported in this browser.');
            return;
        }
        try {
            setSharing(true);
            setSharing(false);
        } catch (err) {
            console.error(err);
            setSharing(false);
        }
    };

    const handleUnshareAll = async () => {
        if (!socket) return;
        if (!confirm('Stop sharing ALL directories? Remote users will lose access immediately.')) return;
        try {
            const cleanUrl = serverUrl.replace(/\/$/, '');
            await fetch(`${cleanUrl}/api/directory/unshare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName, userId: socket.id })
            });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
            <div className="md:col-span-1 bg-hack-surface/50 border border-hack-border rounded-lg p-4 flex flex-col">
                <h3 className="text-xs font-bold text-hack-muted uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Icons.Monitor className="w-4 h-4" /> Connected Drives
                </h3>
                <p className="text-[9px] text-gray-500">Peer-to-Peer Relay Mode</p>

                <div className="flex flex-col overflow-y-auto space-y-2 flex-1 custom-scrollbar mt-3">
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
                                        <span className="text-[9px] uppercase tracking-wider opacity-70">{uid === currentUserId ? '(LOCAL)' : 'REMOTE'}</span>
                                    </div>
                                </div>
                                <Icons.ChevronRight className={`w-3 h-3 hidden md:block ${selectedUser === uid ? 'opacity-100' : 'opacity-0'}`} />
                            </button>
                        );
                    })}
                </div>

                <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-hack-border space-y-2 shrink-0">
                    {('showDirectoryPicker' in window) ? (
                        <button
                            onClick={handleShareLiveDirectory}
                            disabled={sharing}
                            className="w-full py-3 bg-hack-surface border border-hack-primary text-hack-primary hover:bg-hack-primary hover:text-black transition-colors rounded font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            {sharing ? <span className="animate-pulse">Indexing...</span> : <><Icons.Plus className="w-4 h-4" /> Share Live Directory</>}
                        </button>
                    ) : (
                        <>
                            <input type="file" ref={fileInputRef} className="hidden" // @ts-ignore webkitdirectory="" directory="" multiple
                                onChange={handleLegacyShare} />
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
                        <button onClick={handleUnshareAll} className="w-full py-3 bg-red-900/20 border border-red-500/50 text-red-500 hover:bg-red-900/40 transition-colors rounded font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                            <Icons.Trash className="w-4 h-4" /> Clear All Shared
                        </button>
                    )}

                    <p className="text-[9px] text-center text-hack-muted">Files are streamed from your device on request. Not stored on server.</p>
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
                            <div className="flex items-center gap-2">
                                <button onClick={handleRequestSync} className="text-hack-muted hover:text-hack-primary p-1 rounded hover:bg-white/10 transition-colors">
                                    <Icons.RefreshCw className="w-3 h-3" />
                                </button>
                                {isMyDir && <span className="text-[10px] text-green-400 font-mono animate-pulse">● HOSTING ACTIVE</span>}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 font-mono text-sm custom-scrollbar">
                            {(isMyDir ? localTree : activeDir.root).map((item, idx) => (
                                <FileTreeItem
                                    key={idx}
                                    item={item}
                                    depth={0}
                                    ownerId={selectedUser || ''}
                                    serverUrl={serverUrl}
                                    roomName={roomName}
                                    isMyDir={isMyDir}
                                    onDeleteDir={handleDeleteDirectory}
                                    socket={socket}
                                    onRequestLocalPath={() => { /* noop in simplified impl */ }}
                                />
                            ))}

                            {(isMyDir ? localTree : activeDir.root).length === 0 && (
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

export default DirectoryBrowser;