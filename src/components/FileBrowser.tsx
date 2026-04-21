import React, { useState, useMemo, useRef } from 'react';
import { 
    File as FileIcon, Folder, Plus, MoreVertical, Trash2, Edit, X, 
    Search, UploadCloud, Clock, Tag, FileCode, FileJson, FileType, FileImage, 
    ArrowUp, ArrowDown, Filter, Download, FolderPlus, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section, SharedFile } from '@/types';
import { Icons } from '@/components/Icons';
import { encryptFile, decryptFile } from '@/utils/crypto';

type SortOption = 'newest' | 'oldest' | 'name' | 'size';
type FileTypeFilter = 'All' | 'TypeScript' | 'JavaScript' | 'Python' | 'JSON' | 'PDF';

<<<<<<< HEAD
export interface UploadControlRef {
    uploadFiles: (files: File[]) => void;
}

interface UploadTask {
    id: string;
    file: File;
    status: 'pending' | 'encrypting' | 'uploading' | 'done' | 'error';
    progress: number;
    loaded: number;
    total: number;
    error?: string;
}

const UploadControl = React.forwardRef<UploadControlRef, { serverUrl: string, roomName: string, roomPassword?: string, encryptionEnabled?: boolean }>(({ serverUrl, roomName, roomPassword, encryptionEnabled }, ref) => {
    const [tasks, setTasks] = useState<UploadTask[]>([]);
    const [showPopup, setShowPopup] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
=======
const UploadControl: React.FC<{ serverUrl: string, roomName: string, roomPassword?: string, encryptionEnabled?: boolean }> = ({ serverUrl, roomName, roomPassword, encryptionEnabled }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [encryptionStatus, setEncryptionStatus] = useState<'idle' | 'encrypting'>('idle');
    const [uploadProgress, setUploadProgress] = useState<{ loaded: number; total: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastProgressUpdate = useRef<number>(0);
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d

    const cleanServerUrl = serverUrl.replace(/\/$/, '');
    const bytesToMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);

<<<<<<< HEAD
    React.useImperativeHandle(ref, () => ({
        uploadFiles: (files: File[]) => {
            handleFiles(files);
        }
    }));

    const handleFiles = (files: File[]) => {
        const newTasks = files.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            status: 'pending' as const,
            progress: 0,
            loaded: 0,
            total: file.size
        }));
        
        setTasks(prev => [...prev, ...newTasks]);
        setShowPopup(true);
        
        // Start processing them
        newTasks.forEach(task => processTask(task));
    };

    const processTask = async (task: UploadTask) => {
        if (roomPassword && encryptionEnabled) {
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'encrypting' } : t));
            try {
                // Small delay to allow UI to update
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const buffer = await task.file.arrayBuffer();
                const encryptedBuffer = await encryptFile(buffer, roomPassword);
                const encryptedFile = new File([encryptedBuffer], task.file.name, { type: task.file.type });
                
                startUpload(task.id, encryptedFile);
            } catch (error) {
                console.error("Encryption failed:", error);
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'error', error: 'Encryption failed' } : t));
            }
        } else {
            startUpload(task.id, task.file);
        }
    };

    const startUpload = (taskId: string, file: File) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'uploading' } : t));
=======
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (roomPassword && encryptionEnabled) {
            try {
                setEncryptionStatus('encrypting');
                // Small delay to allow UI to update
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const buffer = await file.arrayBuffer();
                const encryptedBuffer = await encryptFile(buffer, roomPassword);
                const encryptedFile = new File([encryptedBuffer], file.name, { type: file.type });
                
                setEncryptionStatus('idle');
                startUpload(encryptedFile);
            } catch (error) {
                console.error("Encryption failed:", error);
                alert("Failed to encrypt file before upload.");
                setEncryptionStatus('idle');
            }
        } else {
            startUpload(file);
        }
    };

    const startUpload = (file: File) => {
        setIsUploading(true);
        setUploadProgress({ loaded: 0, total: file.size });
        lastProgressUpdate.current = Date.now();
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
        
        const formData = new FormData();
        formData.append('roomName', roomName); 
        formData.append('file', file);
<<<<<<< HEAD
        formData.append('password', roomPassword || '');
=======
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d

        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
<<<<<<< HEAD
              setTasks(prev => prev.map(t => t.id === taskId ? { 
                  ...t, 
                  loaded: event.loaded, 
                  total: event.total,
                  progress: (event.loaded / event.total) * 100
              } : t));
=======
            const now = Date.now();
            if (now - lastProgressUpdate.current >= 200 || event.loaded === event.total) {
                setUploadProgress({
                    loaded: event.loaded,
                    total: event.total
                });
                lastProgressUpdate.current = now;
            }
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
          }
        });

        xhr.addEventListener("load", () => {
<<<<<<< HEAD
          if (xhr.status >= 200 && xhr.status < 300) {
              setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'done', progress: 100 } : t));
              // Remove done tasks after a delay
              setTimeout(() => {
                  setTasks(prev => {
                      const updated = prev.filter(t => t.id !== taskId);
                      if (updated.length === 0) setShowPopup(false);
                      return updated;
                  });
              }, 3000);
          } else {
              setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error', error: `Server error ${xhr.status}` } : t));
=======
          setTimeout(() => {
              setIsUploading(false);
              setUploadProgress(null);
          }, 500);
          
          if (xhr.status >= 200 && xhr.status < 300) {
             if (fileInputRef.current) fileInputRef.current.value = '';
          } else {
             console.error('Upload failed:', xhr.responseText);
             alert(`Upload failed: Server responded with ${xhr.status}`);
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
          }
        });

        xhr.addEventListener("error", () => {
<<<<<<< HEAD
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error', error: 'Network error' } : t));
        });

        xhr.addEventListener("abort", () => {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'error', error: 'Aborted' } : t));
=======
          setIsUploading(false);
          setUploadProgress(null);
          console.error('Upload error');
          alert("Upload failed due to a network error.");
        });

        xhr.addEventListener("abort", () => {
          setIsUploading(false);
          setUploadProgress(null);
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
        });

        xhr.open("POST", `${cleanServerUrl}/upload`);
        xhr.send(formData);
    };

<<<<<<< HEAD
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        handleFiles(files);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'error');
    const isUploading = activeTasks.length > 0;
    const totalProgress = tasks.length > 0 ? tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length : 0;
=======
    // Expose drop handler to parent if needed, or handle here. 
    // For this design, the drop zone is separate. We'll reuse the input ref.
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d

    return (
        <div className="relative">
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleUpload}
                className="hidden"
                id="file-upload"
<<<<<<< HEAD
                multiple
            />
            <label 
                htmlFor="file-upload"
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold cursor-pointer transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] whitespace-nowrap relative overflow-hidden ${isUploading ? 'bg-gray-800 text-white cursor-default w-48 justify-center' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110'}`}
            >
                {isUploading ? (
                    <>
                        <div 
                            className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-200" 
                            style={{ width: `${totalProgress}%` }}
                        />
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                        <span className="relative z-10 text-xs font-mono animate-pulse">Uploading {activeTasks.length}...</span>
=======
            />
            <label 
                htmlFor={isUploading || encryptionStatus === 'encrypting' ? undefined : "file-upload"}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold cursor-pointer transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] whitespace-nowrap relative overflow-hidden ${isUploading || encryptionStatus === 'encrypting' ? 'bg-gray-800 text-white cursor-default w-48 justify-center' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110'}`}
            >
                {encryptionStatus === 'encrypting' ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-xs font-mono animate-pulse">Encrypting...</span>
                    </>
                ) : isUploading && uploadProgress ? (
                    <>
                       <div 
                            className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-200" 
                            style={{ width: `${(uploadProgress.loaded / uploadProgress.total) * 100}%` }}
                       />
                       <span className="relative z-10 text-xs font-mono animate-pulse">
                           {bytesToMB(uploadProgress.loaded)} / {bytesToMB(uploadProgress.total)} MB
                       </span>
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
                    </>
                ) : (
                    <>
                        <ArrowUp className="w-5 h-5" />
                        Upload Data
                    </>
                )}
            </label>
<<<<<<< HEAD

            {/* Status Popup */}
            {showPopup && tasks.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-[rgb(var(--hack-surface))] border border-[rgb(var(--hack-border))] rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="flex justify-between items-center p-3 border-b border-[rgb(var(--hack-border))] bg-[rgb(var(--hack-surface))]/50 font-bold text-sm">
                        <span>Uploads ({tasks.filter(t => t.status === 'done').length}/{tasks.length})</span>
                        <button onClick={() => setShowPopup(false)} className="p-1 hover:bg-[rgb(var(--hack-text))]/10 rounded-lg text-[rgb(var(--hack-text))]/50 hover:text-[rgb(var(--hack-text))] transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {tasks.map(task => (
                            <div key={task.id} className="bg-[rgb(var(--hack-surface))]/50 border border-[rgb(var(--hack-border))]/50 rounded-lg p-2 text-xs">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="truncate max-w-[180px] font-medium" title={task.file.name}>{task.file.name}</span>
                                    <span className="text-[10px] uppercase font-bold">
                                        {task.status === 'pending' && <span className="text-gray-400">Pending</span>}
                                        {task.status === 'encrypting' && <span className="text-purple-400 animate-pulse">Encrypting</span>}
                                        {task.status === 'uploading' && <span className="text-blue-400">{Math.round(task.progress)}%</span>}
                                        {task.status === 'done' && <span className="text-green-400">Done</span>}
                                        {task.status === 'error' && <span className="text-red-400" title={task.error}>Error</span>}
                                    </span>
                                </div>
                                {(task.status === 'uploading' || task.status === 'encrypting') && (
                                    <div className="h-1.5 w-full bg-[rgb(var(--hack-border))] rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-200 ${task.status === 'encrypting' ? 'bg-purple-500 w-full animate-pulse' : 'bg-blue-500'}`}
                                            style={{ width: task.status === 'uploading' ? `${task.progress}%` : '100%' }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});
=======
        </div>
    );
};
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d

// Helper to get file icon and type label
const getFileInfo = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'ts': return { icon: FileCode, label: 'TypeScript', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
        case 'tsx': return { icon: FileCode, label: 'React TS', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
        case 'js': return { icon: FileCode, label: 'JavaScript', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' };
        case 'jsx': return { icon: FileCode, label: 'React JS', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' };
        case 'py': return { icon: FileCode, label: 'Python', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' };
        case 'json': return { icon: FileJson, label: 'JSON', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' };
        case 'pdf': return { icon: FileType, label: 'PDF', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' };
        case 'png': 
        case 'jpg': 
        case 'jpeg': 
        case 'gif': return { icon: FileImage, label: 'Image', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' };
        default: return { icon: FileIcon, label: ext?.toUpperCase() || 'FILE', color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20' };
    }
};

interface FileBrowserProps {
  files: SharedFile[];
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
  onFileDelete: (fileName: string) => void;
  serverUrl: string;
  roomName: string;
  analyzeFileContent: (content: string) => Promise<{ summary: string }>;
  categorizeFiles: (files: { name: string; content: string }[]) => Promise<Record<string, string[]>>;
  geminiApiKey: string;
  roomPassword?: string;
  encryptionEnabled?: boolean;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({ files = [], sections = [], onSectionsChange, onFileDelete, serverUrl, roomName, analyzeFileContent, categorizeFiles, geminiApiKey, roomPassword, encryptionEnabled }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOption>('newest');
  const [activeFilter, setActiveFilter] = useState<FileTypeFilter>('All');
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
<<<<<<< HEAD
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const uploadControlRef = useRef<UploadControlRef>(null);
=======
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
  
  // Section State
  const [selectedSectionId, setSelectedSectionId] = useState<string | null | 'all'>('all');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const handleDownload = async (fileName: string) => {
      setDownloadingFile(fileName);
<<<<<<< HEAD
      setDownloadProgress(0);
      try {
          const response = await fetch(`${serverUrl}/uploads/${roomName}/${fileName}?password=${encodeURIComponent(roomPassword || '')}`);
          if (!response.ok) throw new Error('Download failed');
          
          const reader = response.body!.getReader();
          const contentLength = +(response.headers.get('Content-Length') || 0);
          let received = 0;
          const chunks: Uint8Array[] = [];

          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              received += value.length;
              if (contentLength > 0) {
                  setDownloadProgress(Math.round((received / contentLength) * 100));
              }
          }
          
          const buffer = new Uint8Array(received);
          let offset = 0;
          for (const chunk of chunks) {
              buffer.set(chunk, offset);
              offset += chunk.length;
          }
          
          let downloadBlob = new Blob([buffer], { type: response.headers.get('Content-Type') || 'application/octet-stream' });
          if (roomPassword && encryptionEnabled) {
              try {
                  const decryptedBuffer = await decryptFile(buffer.buffer, roomPassword);
                  downloadBlob = new Blob([decryptedBuffer], { type: response.headers.get('Content-Type') || 'application/octet-stream' });
=======
      try {
          const response = await fetch(`${serverUrl}/uploads/${roomName}/${fileName}`);
          if (!response.ok) throw new Error('Download failed');
          
          const blob = await response.blob();
          
          let downloadBlob = blob;
          if (roomPassword) {
              try {
                  const buffer = await blob.arrayBuffer();
                  const decryptedBuffer = await decryptFile(buffer, roomPassword);
                  downloadBlob = new Blob([decryptedBuffer], { type: blob.type });
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
              } catch (e) {
                  console.error("Decryption failed, downloading raw file", e);
                  // Fallback to raw file if decryption fails (e.g. file wasn't encrypted)
              }
          }

          const url = URL.createObjectURL(downloadBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
      } catch (error) {
          console.error('Download error:', error);
          alert('Failed to download file');
      } finally {
          setDownloadingFile(null);
<<<<<<< HEAD
          setDownloadProgress(0);
      }
  };

  const handleRevert = async (sourceFileName: string, targetFileName: string) => {
      if (!confirm(`Are you sure you want to revert ${targetFileName} to the version ${sourceFileName}?`)) return;
      
      try {
          const response = await fetch(`${serverUrl}/upload/${roomName}/${sourceFileName}/revert`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': roomPassword || ''
              },
              body: JSON.stringify({ targetFilename: targetFileName })
          });
          
          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(errorText || 'Failed to revert file');
          }
      } catch (error) {
          console.error('Revert error:', error);
          alert('Failed to revert file: ' + (error instanceof Error ? error.message : String(error)));
      }
  };

  const groupedFiles = useMemo(() => {
      const groups: Record<string, SharedFile[]> = {};
      
      files.forEach(file => {
          const lastDotIndex = file.name.lastIndexOf('.');
          const hasExt = lastDotIndex !== -1 && lastDotIndex !== 0;
          const ext = hasExt ? file.name.substring(lastDotIndex) : '';
          const nameWithoutExt = hasExt ? file.name.substring(0, lastDotIndex) : file.name;
          
          let baseName = file.name;
          const match = nameWithoutExt.match(/(.*)(_v\d+)$/);
          
          if (match) {
              baseName = `${match[1]}${ext}`;
          }
          
          if (!groups[baseName]) {
              groups[baseName] = [];
          }
          groups[baseName].push(file);
      });
      
      return Object.values(groups).map(group => {
          group.sort((a, b) => b.uploadedAt - a.uploadedAt);
          return {
              mainFile: group[0],
              versions: group.slice(1)
          };
      });
  }, [files]);

  const processedFiles = useMemo(() => {
    let result = [...groupedFiles];

    if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        result = result.filter(g => g.mainFile.name.toLowerCase().includes(lowerQ));
    }

    if (activeFilter !== 'All') {
        result = result.filter(g => {
            const info = getFileInfo(g.mainFile.name);
=======
      }
  };

  const processedFiles = useMemo(() => {
    let result = [...files];

    if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        result = result.filter(f => f.name.toLowerCase().includes(lowerQ));
    }

    if (activeFilter !== 'All') {
        result = result.filter(f => {
            const info = getFileInfo(f.name);
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
            return info.label === activeFilter || (activeFilter === 'TypeScript' && info.label === 'React TS') || (activeFilter === 'JavaScript' && info.label === 'React JS');
        });
    }

    result.sort((a, b) => {
        switch(sortOrder) {
<<<<<<< HEAD
            case 'newest': return b.mainFile.uploadedAt - a.mainFile.uploadedAt;
            case 'oldest': return a.mainFile.uploadedAt - b.mainFile.uploadedAt;
            case 'name': return a.mainFile.name.localeCompare(b.mainFile.name);
            case 'size': return b.mainFile.size - a.mainFile.size;
=======
            case 'newest': return b.uploadedAt - a.uploadedAt;
            case 'oldest': return a.uploadedAt - b.uploadedAt;
            case 'name': return a.name.localeCompare(b.name);
            case 'size': return b.size - a.size;
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
            default: return 0;
        }
    });

    return result;
<<<<<<< HEAD
  }, [groupedFiles, searchQuery, sortOrder, activeFilter]);
=======
  }, [files, searchQuery, sortOrder, activeFilter]);
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d

  // Filter by Section
  const displayedFiles = useMemo(() => {
      if (selectedSectionId === 'all') return processedFiles;
      
      if (selectedSectionId === null) {
          // Uncategorized: files not in any section
          const categorizedFileNames = new Set(sections.flatMap(s => s.itemIds || []));
<<<<<<< HEAD
          return processedFiles.filter(g => !categorizedFileNames.has(g.mainFile.name));
=======
          return processedFiles.filter(f => !categorizedFileNames.has(f.name));
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
      }

      const section = sections.find(s => s.id === selectedSectionId);
      if (!section || !section.itemIds) return [];
      
<<<<<<< HEAD
      return processedFiles.filter(g => section.itemIds?.includes(g.mainFile.name));
=======
      return processedFiles.filter(f => section.itemIds?.includes(f.name));
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
  }, [processedFiles, selectedSectionId, sections]);

  const handleAiCategorize = async () => {
    if (!geminiApiKey) {
      alert('Please set your Gemini API key in the settings.');
      return;
    }
    setIsCategorizing(true);
    try {
      const sectionedFileNames = new Set(sections.flatMap(s => s.itemIds || []));
      const uncategorizedFiles = files.filter(f => !sectionedFileNames.has(f.name));

      if (uncategorizedFiles.length === 0) {
        alert("No new uncategorized files to analyze.");
        return;
      }

      const filesWithContent = await Promise.all(uncategorizedFiles.map(async (file) => {
        try {
<<<<<<< HEAD
            const response = await fetch(`${serverUrl}/uploads/${roomName}/${file.name}?password=${encodeURIComponent(roomPassword || '')}`);
            let text = '';
            if (roomPassword && encryptionEnabled) {
                try {
                    const buffer = await response.arrayBuffer();
                    try {
                        const decryptedBuffer = await decryptFile(buffer, roomPassword);
                        text = new TextDecoder().decode(decryptedBuffer);
                    } catch (e) {
                        console.error("Decryption failed for analysis", e);
                        text = new TextDecoder().decode(buffer);
                    }
                } catch (e) {
                    console.error("Failed to read response buffer", e);
                }
            } else {
                text = await response.text();
            }
=======
            const response = await fetch(`${serverUrl}/uploads/${roomName}/${file.name}`);
            const text = await response.text();
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
            // Truncate content to avoid token limits (approx 2k tokens)
            const content = text.slice(0, 8000);
            return { ...file, content };
        } catch (e) {
            console.error(`Failed to fetch content for ${file.name}`, e);
            return { ...file, content: '' };
        }
      }));

      const analyzedFiles = [];
      for (const file of filesWithContent) {
        if (file.analysis) {
            analyzedFiles.push(file);
            continue;
        }
        try {
            // Add small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
            const analysis = await analyzeFileContent(file.content);
            analyzedFiles.push({ ...file, analysis });
        } catch (error) {
            console.error(`Analysis failed for ${file.name}:`, error);
            analyzedFiles.push(file);
        }
      }

      const categorized = await categorizeFiles(analyzedFiles.map(f => ({ name: f.name, content: f.content })));

      const newSections = [...sections];
      for (const sectionName in categorized) {
        let section = newSections.find(s => s.title === sectionName);
        if (!section) {
          section = { id: `section-${Date.now()}-${Math.random()}`, title: sectionName, itemIds: [] };
          newSections.push(section);
        }
        const newIds = categorized[sectionName].filter(id => !(section!.itemIds || []).includes(id));
        section.itemIds = [...(section!.itemIds || []), ...newIds];
      }

      onSectionsChange(newSections);

    } catch (error) {
      console.error('AI categorization failed:', error);
      alert('AI categorization failed. See console for details.');
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
          setDragActive(true);
      } else if (e.type === "dragleave") {
          setDragActive(false);
      }
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
<<<<<<< HEAD
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          uploadControlRef.current?.uploadFiles(Array.from(e.dataTransfer.files));
=======
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) {
              alert("Please use the Upload Data button for now. Drag and drop logic needs hoisting.");
          }
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
      }
  };

  const formatTimeAgo = (timestamp: number) => {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) return `${seconds}s ago`;
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
  };

  // Section Management Handlers
  const handleAddSection = () => {
      if (!newSectionName.trim()) return;
      const newSection: Section = {
          id: `section-${Date.now()}`,
          title: newSectionName.trim(),
          itemIds: []
      };
      onSectionsChange([...sections, newSection]);
      setNewSectionName('');
      setIsAddingSection(false);
  };

  const handleDeleteSection = (sectionId: string) => {
      if (confirm('Are you sure you want to delete this section? Files will remain but become uncategorized.')) {
          onSectionsChange(sections.filter(s => s.id !== sectionId));
          if (selectedSectionId === sectionId) setSelectedSectionId('all');
      }
  };

  const handleFileDragStart = (e: React.DragEvent, fileName: string) => {
      e.dataTransfer.setData('fileName', fileName);
  };

  const handleSectionDrop = (e: React.DragEvent, sectionId: string | null) => {
      e.preventDefault();
      const fileName = e.dataTransfer.getData('fileName');
      if (!fileName) return;

      // Remove from all other sections first
      const newSections = sections.map(s => ({
          ...s,
          itemIds: (s.itemIds || []).filter(id => id !== fileName)
      }));

      // Add to target section if not null (uncategorized)
      if (sectionId) {
          const targetSection = newSections.find(s => s.id === sectionId);
          if (targetSection) {
              targetSection.itemIds = [...(targetSection.itemIds || []), fileName];
          }
      }

      onSectionsChange(newSections);
  };

  const handleSectionDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  return (
    <div className="h-full flex flex-col p-6 bg-[rgb(var(--hack-bg))] text-[rgb(var(--hack-text))] font-sans overflow-hidden">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="relative w-full md:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--hack-text))]/50 group-focus-within:text-[rgb(var(--hack-primary))] transition-colors" />
                <input 
                    type="text"
                    placeholder="Scan archives..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[rgb(var(--hack-surface))] border border-[rgb(var(--hack-border))] rounded-xl pl-12 pr-4 py-3 text-sm focus:border-[rgb(var(--hack-primary))]/50 focus:ring-1 focus:ring-[rgb(var(--hack-primary))]/50 focus:outline-none transition-all placeholder-[rgb(var(--hack-text))]/40"
                />
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                    onClick={handleAiCategorize}
                    disabled={isCategorizing}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-[rgb(var(--hack-surface))] border border-[rgb(var(--hack-primary))]/30 text-[rgb(var(--hack-primary))] hover:bg-[rgb(var(--hack-primary))]/10 hover:border-[rgb(var(--hack-primary))]/60 transition-all shadow-[0_0_15px_rgba(var(--hack-primary),0.1)] disabled:opacity-50"
                >
                    <Icons.Zap className="w-4 h-4" />
                    {isCategorizing ? 'Analyzing...' : 'AI Categorize'}
                </button>
<<<<<<< HEAD
                <UploadControl ref={uploadControlRef} serverUrl={serverUrl} roomName={roomName} roomPassword={roomPassword} encryptionEnabled={encryptionEnabled} />
            </div>
        </div>

        <div className="flex-1 flex flex-col md:grid md:grid-cols-4 gap-6 overflow-hidden">
            {/* Sidebar - Sections */}
            <div className="md:col-span-1 bg-[rgb(var(--hack-surface))]/50 border border-[rgb(var(--hack-border))] rounded-2xl p-4 flex flex-col h-48 md:h-full shrink-0">
                <h3 className="text-xs font-bold text-[rgb(var(--hack-text))]/50 uppercase tracking-widest mb-2 md:mb-4 px-2">Data Sections</h3>
                
                <div className="flex flex-col overflow-y-auto space-y-2 pr-2 custom-scrollbar flex-1">
                    <button
                        onClick={() => setSelectedSectionId('all')}
                        className={`w-full shrink-0 text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between gap-2 group ${
=======
                <UploadControl serverUrl={serverUrl} roomName={roomName} roomPassword={roomPassword} encryptionEnabled={encryptionEnabled} />
            </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-hidden">
            {/* Sidebar - Sections */}
            <div className="md:col-span-1 bg-[rgb(var(--hack-surface))]/50 border border-[rgb(var(--hack-border))] rounded-2xl p-4 flex flex-col h-full overflow-hidden">
                <h3 className="text-xs font-bold text-[rgb(var(--hack-text))]/50 uppercase tracking-widest mb-4 px-2">Data Sections</h3>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    <button
                        onClick={() => setSelectedSectionId('all')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
                            selectedSectionId === 'all' 
                            ? 'bg-[rgb(var(--hack-primary))]/10 text-[rgb(var(--hack-primary))] border border-[rgb(var(--hack-primary))]/30' 
                            : 'text-[rgb(var(--hack-text))]/60 hover:bg-[rgb(var(--hack-text))]/5 hover:text-[rgb(var(--hack-text))]'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Folder className="w-4 h-4" /> All Files
                        </span>
                        <span className="text-xs opacity-50">{files.length}</span>
                    </button>

                    <button
                        onClick={() => setSelectedSectionId(null)}
                        onDrop={(e) => handleSectionDrop(e, null)}
                        onDragOver={handleSectionDragOver}
<<<<<<< HEAD
                        className={`w-full shrink-0 text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between gap-2 group ${
=======
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
                            selectedSectionId === null 
                            ? 'bg-[rgb(var(--hack-primary))]/10 text-[rgb(var(--hack-primary))] border border-[rgb(var(--hack-primary))]/30' 
                            : 'text-[rgb(var(--hack-text))]/60 hover:bg-[rgb(var(--hack-text))]/5 hover:text-[rgb(var(--hack-text))]'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Icons.File className="w-4 h-4" /> Uncategorized
                        </span>
                        <span className="text-xs opacity-50">
                            {files.filter(f => !sections.some(s => s.itemIds?.includes(f.name))).length}
                        </span>
                    </button>

<<<<<<< HEAD
                    <div className="hidden md:block h-px bg-[rgb(var(--hack-border))] my-2 mx-2 shrink-0"></div>
=======
                    <div className="h-px bg-[rgb(var(--hack-border))] my-2 mx-2"></div>
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d

                    {sections.map(section => (
                        <div 
                            key={section.id}
                            onDrop={(e) => handleSectionDrop(e, section.id)}
                            onDragOver={handleSectionDragOver}
<<<<<<< HEAD
                            className={`w-full shrink-0 group relative flex items-center rounded-xl transition-all ${
=======
                            className={`group relative flex items-center rounded-xl transition-all ${
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
                                selectedSectionId === section.id 
                                ? 'bg-[rgb(var(--hack-primary))]/10 border border-[rgb(var(--hack-primary))]/30' 
                                : 'hover:bg-[rgb(var(--hack-text))]/5'
                            }`}
                        >
                            <button
                                onClick={() => setSelectedSectionId(section.id)}
                                className={`flex-1 text-left px-4 py-3 text-sm font-bold flex items-center justify-between ${
                                    selectedSectionId === section.id ? 'text-[rgb(var(--hack-primary))]' : 'text-[rgb(var(--hack-text))]/60 group-hover:text-[rgb(var(--hack-text))]'
                                }`}
                            >
                                <span className="truncate pr-2">{section.title || section.name}</span>
                                <span className="text-xs opacity-50">{section.itemIds?.length || 0}</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                                className="p-2 mr-1 text-[rgb(var(--hack-text))]/40 hover:text-[rgb(var(--hack-danger))] opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Delete Section"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>

<<<<<<< HEAD
                <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-[rgb(var(--hack-border))] shrink-0">
=======
                <div className="mt-4 pt-4 border-t border-[rgb(var(--hack-border))]">
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
                    {isAddingSection ? (
                        <div className="bg-[rgb(var(--hack-surface))] p-2 rounded-xl border border-[rgb(var(--hack-border))]">
                            <input
                                type="text"
                                autoFocus
                                placeholder="Section Name..."
                                value={newSectionName}
                                onChange={(e) => setNewSectionName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                                onBlur={() => { if(!newSectionName) setIsAddingSection(false); }}
                                className="w-full bg-transparent text-sm text-[rgb(var(--hack-text))] placeholder-[rgb(var(--hack-text))]/40 focus:outline-none mb-2"
                            />
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleAddSection}
                                    className="flex-1 py-1 bg-[rgb(var(--hack-primary))]/20 text-[rgb(var(--hack-primary))] rounded text-xs font-bold hover:bg-[rgb(var(--hack-primary))]/30"
                                >
                                    Add
                                </button>
                                <button 
                                    onClick={() => setIsAddingSection(false)}
                                    className="flex-1 py-1 bg-[rgb(var(--hack-text))]/5 text-[rgb(var(--hack-text))]/60 rounded text-xs font-bold hover:bg-[rgb(var(--hack-text))]/10"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAddingSection(true)}
                            className="w-full py-3 border border-dashed border-[rgb(var(--hack-border))] rounded-xl text-[rgb(var(--hack-text))]/50 text-sm font-bold hover:border-[rgb(var(--hack-primary))]/50 hover:text-[rgb(var(--hack-primary))] hover:bg-[rgb(var(--hack-primary))]/5 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Create Section
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3 flex flex-col h-full overflow-hidden">
                {/* Sort & Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex bg-[rgb(var(--hack-surface))] p-1 rounded-xl border border-[rgb(var(--hack-border))]">
                        {(['newest', 'oldest', 'name', 'size'] as SortOption[]).map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setSortOrder(opt)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${sortOrder === opt ? 'bg-[rgb(var(--hack-border))] text-[rgb(var(--hack-primary))] shadow-sm' : 'text-[rgb(var(--hack-text))]/50 hover:text-[rgb(var(--hack-text))]/70'}`}
                            >
                                {opt === 'newest' && <ArrowDown className="w-3 h-3" />}
                                {opt === 'oldest' && <ArrowUp className="w-3 h-3" />}
                                {opt === 'name' && <span className="text-[10px]">A-Z</span>}
                                {opt === 'size' && <Filter className="w-3 h-3" />}
                                {opt}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                         {(['All', 'TypeScript', 'JavaScript', 'Python', 'JSON', 'PDF'] as FileTypeFilter[]).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${activeFilter === filter ? 'bg-[rgb(var(--hack-primary))]/10 border-[rgb(var(--hack-primary))]/50 text-[rgb(var(--hack-primary))]' : 'bg-[rgb(var(--hack-surface))] border-[rgb(var(--hack-border))] text-[rgb(var(--hack-text))]/50 hover:border-[rgb(var(--hack-border))]/80'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Drop Zone (Only show if 'all' or 'uncategorized' is selected, or just always show it?) */}
                {/* Let's keep it but make it smaller or collapsible? For now, keep as is but maybe less padding */}
                <div 
                    className={`mb-6 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${dragActive ? 'border-[rgb(var(--hack-primary))] bg-[rgb(var(--hack-primary))]/10' : 'border-[rgb(var(--hack-border))] bg-[rgb(var(--hack-surface))]/30 hover:border-[rgb(var(--hack-border))]/50'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[rgb(var(--hack-border))] rounded-xl flex items-center justify-center shadow-inner border border-[rgb(var(--hack-border))]">
                            <UploadCloud className="w-5 h-5 text-[rgb(var(--hack-text))]/40" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-[rgb(var(--hack-text))]">Drop files to upload</h3>
                            <p className="text-[rgb(var(--hack-text))]/50 text-xs">or click "Upload Data" above</p>
                        </div>
                    </div>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
<<<<<<< HEAD
                        {displayedFiles.map((group) => {
                            const file = group.mainFile;
                            const info = getFileInfo(file.name);
                            const Icon = info.icon;
                            const hasVersions = group.versions.length > 0;
                            return (
                                <div key={file.name} className="flex flex-col gap-2">
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        draggable
                                        onDragStart={(e) => handleFileDragStart(e as any, file.name)}
                                        className="group flex items-center gap-4 p-3 bg-[rgb(var(--hack-surface))] border border-[rgb(var(--hack-border))] rounded-xl hover:border-[rgb(var(--hack-primary))]/30 transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.2)] cursor-grab active:cursor-grabbing"
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${info.bg} border ${info.border}`}>
                                            <Icon className={`w-5 h-5 ${info.color}`} />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-[rgb(var(--hack-text))] truncate text-sm mb-0.5">{file.name}</h4>
                                            <div className="flex items-center gap-3 text-[10px] text-[rgb(var(--hack-text))]/50 font-mono">
                                                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                <span className={`px-1.5 py-0.5 rounded ${info.bg} ${info.color} border ${info.border} uppercase`}>
                                                    {info.label}
                                                </span>
                                                <span className="hidden sm:inline">{formatTimeAgo(file.uploadedAt)}</span>
                                                {hasVersions && (
                                                    <span className="px-1.5 py-0.5 rounded bg-[rgb(var(--hack-primary))]/10 text-[rgb(var(--hack-primary))] border border-[rgb(var(--hack-primary))]/30">
                                                        {group.versions.length} older version{group.versions.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleDownload(file.name)}
                                                disabled={downloadingFile === file.name}
                                                className="p-2 rounded-lg bg-[rgb(var(--hack-text))]/5 hover:bg-[rgb(var(--hack-text))]/10 text-[rgb(var(--hack-text))]/40 hover:text-[rgb(var(--hack-text))] transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                title="Download"
                                            >
                                                {downloadingFile === file.name ? (
                                                    <div className="flex items-center gap-2 text-xs font-mono">
                                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                        {downloadProgress > 0 && <span>{downloadProgress}%</span>}
                                                    </div>
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                            </button>
                                            
                                            <button 
                                                onClick={() => onFileDelete(file.name)} 
                                                className="p-2 rounded-lg bg-[rgb(var(--hack-danger))]/10 hover:bg-[rgb(var(--hack-danger))]/20 text-[rgb(var(--hack-danger))] hover:text-[rgb(var(--hack-danger))]/80 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>

                                    {hasVersions && (
                                        <div className="pl-12 space-y-2 mb-2">
                                            {group.versions.map(v => (
                                                <div key={v.name} className="flex items-center gap-4 p-2 bg-[rgb(var(--hack-surface))]/50 border border-[rgb(var(--hack-border))]/50 rounded-lg text-sm">
                                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                                        <span className="text-[rgb(var(--hack-text))]/70 truncate">{v.name}</span>
                                                        <span className="text-[10px] text-[rgb(var(--hack-text))]/40 font-mono">{formatTimeAgo(v.uploadedAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleRevert(v.name, file.name)} 
                                                            className="px-2 py-1 text-[10px] font-bold bg-[rgb(var(--hack-primary))]/10 text-[rgb(var(--hack-primary))] rounded hover:bg-[rgb(var(--hack-primary))]/20 transition-colors"
                                                        >
                                                            Revert
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDownload(v.name)} 
                                                            disabled={downloadingFile === v.name}
                                                            className="p-1.5 rounded bg-[rgb(var(--hack-text))]/5 hover:bg-[rgb(var(--hack-text))]/10 text-[rgb(var(--hack-text))]/40 hover:text-[rgb(var(--hack-text))] transition-colors disabled:opacity-50"
                                                            title="Download"
                                                        >
                                                            {downloadingFile === v.name ? (
                                                                <div className="flex items-center gap-1 text-[10px] font-mono">
                                                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                    {downloadProgress > 0 && <span>{downloadProgress}%</span>}
                                                                </div>
                                                            ) : (
                                                                <Download className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                        <button 
                                                            onClick={() => onFileDelete(v.name)} 
                                                            className="p-1.5 rounded bg-[rgb(var(--hack-danger))]/10 hover:bg-[rgb(var(--hack-danger))]/20 text-[rgb(var(--hack-danger))] hover:text-[rgb(var(--hack-danger))]/80 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
=======
                        {displayedFiles.map((file) => {
                            const info = getFileInfo(file.name);
                            const Icon = info.icon;
                            return (
                                <motion.div
                                    key={file.name}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    draggable
                                    onDragStart={(e) => handleFileDragStart(e as any, file.name)}
                                    className="group flex items-center gap-4 p-3 bg-[rgb(var(--hack-surface))] border border-[rgb(var(--hack-border))] rounded-xl hover:border-[rgb(var(--hack-primary))]/30 transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.2)] cursor-grab active:cursor-grabbing"
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${info.bg} border ${info.border}`}>
                                        <Icon className={`w-5 h-5 ${info.color}`} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-[rgb(var(--hack-text))] truncate text-sm mb-0.5">{file.name}</h4>
                                        <div className="flex items-center gap-3 text-[10px] text-[rgb(var(--hack-text))]/50 font-mono">
                                            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                            <span className={`px-1.5 py-0.5 rounded ${info.bg} ${info.color} border ${info.border} uppercase`}>
                                                {info.label}
                                            </span>
                                            <span className="hidden sm:inline">{formatTimeAgo(file.uploadedAt)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleDownload(file.name)}
                                            disabled={downloadingFile === file.name}
                                            className="p-2 rounded-lg bg-[rgb(var(--hack-text))]/5 hover:bg-[rgb(var(--hack-text))]/10 text-[rgb(var(--hack-text))]/40 hover:text-[rgb(var(--hack-text))] transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                            title="Download"
                                        >
                                            {downloadingFile === file.name ? (
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                        </button>
                                        
                                        {/* Move to Section Dropdown could go here, but Drag & Drop is implemented */}
                                        
                                        <button 
                                            onClick={() => onFileDelete(file.name)} 
                                            className="p-2 rounded-lg bg-[rgb(var(--hack-danger))]/10 hover:bg-[rgb(var(--hack-danger))]/20 text-[rgb(var(--hack-danger))] hover:text-[rgb(var(--hack-danger))]/80 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
>>>>>>> c25ba38898c417e80d080ff38887c14811f9c69d
                            );
                        })}
                    </AnimatePresence>
                    
                    {displayedFiles.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-[rgb(var(--hack-text))]/40 border border-dashed border-[rgb(var(--hack-border))] rounded-2xl">
                            <FolderPlus className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-bold">No files in this section.</p>
                            <p className="text-xs mt-1">Drag files here or upload new ones.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

