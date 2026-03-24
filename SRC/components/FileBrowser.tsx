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

const UploadControl: React.FC<{ serverUrl: string, roomName: string, roomPassword?: string, encryptionEnabled?: boolean }> = ({ serverUrl, roomName, roomPassword, encryptionEnabled }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [encryptionStatus, setEncryptionStatus] = useState<'idle' | 'encrypting'>('idle');
    const [uploadProgress, setUploadProgress] = useState<{ loaded: number; total: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastProgressUpdate = useRef<number>(0);

    const cleanServerUrl = serverUrl.replace(/\/$/, '');
    const bytesToMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);

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
        
        const formData = new FormData();
        formData.append('roomName', roomName); 
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const now = Date.now();
            if (now - lastProgressUpdate.current >= 200 || event.loaded === event.total) {
                setUploadProgress({
                    loaded: event.loaded,
                    total: event.total
                });
                lastProgressUpdate.current = now;
            }
          }
        });

        xhr.addEventListener("load", () => {
          setTimeout(() => {
              setIsUploading(false);
              setUploadProgress(null);
          }, 500);
          
          if (xhr.status >= 200 && xhr.status < 300) {
             if (fileInputRef.current) fileInputRef.current.value = '';
          } else {
             console.error('Upload failed:', xhr.responseText);
             alert(`Upload failed: Server responded with ${xhr.status}`);
          }
        });

        xhr.addEventListener("error", () => {
          setIsUploading(false);
          setUploadProgress(null);
          console.error('Upload error');
          alert("Upload failed due to a network error.");
        });

        xhr.addEventListener("abort", () => {
          setIsUploading(false);
          setUploadProgress(null);
        });

        xhr.open("POST", `${cleanServerUrl}/upload`);
        formData.append('password', roomPassword || '');
        xhr.send(formData);
    };

    // Expose drop handler to parent if needed, or handle here. 
    // For this design, the drop zone is separate. We'll reuse the input ref.

    return (
        <div className="relative">
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleUpload}
                className="hidden"
                id="file-upload"
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
                    </>
                ) : (
                    <>
                        <ArrowUp className="w-5 h-5" />
                        Upload Data
                    </>
                )}
            </label>
        </div>
    );
};

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
  
  // Section State
  const [selectedSectionId, setSelectedSectionId] = useState<string | null | 'all'>('all');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const handleDownload = async (fileName: string) => {
      setDownloadingFile(fileName);
      try {
          const response = await fetch(`${serverUrl}/uploads/${roomName}/${fileName}?password=${encodeURIComponent(roomPassword || '')}`);
          if (!response.ok) throw new Error('Download failed');
          
          const blob = await response.blob();
          
          let downloadBlob = blob;
          if (roomPassword) {
              try {
                  const buffer = await blob.arrayBuffer();
                  const decryptedBuffer = await decryptFile(buffer, roomPassword);
                  downloadBlob = new Blob([decryptedBuffer], { type: blob.type });
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
            return info.label === activeFilter || (activeFilter === 'TypeScript' && info.label === 'React TS') || (activeFilter === 'JavaScript' && info.label === 'React JS');
        });
    }

    result.sort((a, b) => {
        switch(sortOrder) {
            case 'newest': return b.uploadedAt - a.uploadedAt;
            case 'oldest': return a.uploadedAt - b.uploadedAt;
            case 'name': return a.name.localeCompare(b.name);
            case 'size': return b.size - a.size;
            default: return 0;
        }
    });

    return result;
  }, [files, searchQuery, sortOrder, activeFilter]);

  // Filter by Section
  const displayedFiles = useMemo(() => {
      if (selectedSectionId === 'all') return processedFiles;
      
      if (selectedSectionId === null) {
          // Uncategorized: files not in any section
          const categorizedFileNames = new Set(sections.flatMap(s => s.itemIds || []));
          return processedFiles.filter(f => !categorizedFileNames.has(f.name));
      }

      const section = sections.find(s => s.id === selectedSectionId);
      if (!section || !section.itemIds) return [];
      
      return processedFiles.filter(f => section.itemIds?.includes(f.name));
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
            const response = await fetch(`${serverUrl}/uploads/${roomName}/${file.name}?password=${encodeURIComponent(roomPassword || '')}`);
            const text = await response.text();
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
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) {
              alert("Please use the Upload Data button for now. Drag and drop logic needs hoisting.");
          }
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
                <UploadControl serverUrl={serverUrl} roomName={roomName} roomPassword={roomPassword} encryptionEnabled={encryptionEnabled} />
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
                        className={`w-full shrink-0 text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between gap-2 group ${
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

                    <div className="hidden md:block h-px bg-[rgb(var(--hack-border))] my-2 mx-2 shrink-0"></div>

                    {sections.map(section => (
                        <div 
                            key={section.id}
                            onDrop={(e) => handleSectionDrop(e, section.id)}
                            onDragOver={handleSectionDragOver}
                            className={`w-full shrink-0 group relative flex items-center rounded-xl transition-all ${
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

                <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-[rgb(var(--hack-border))] shrink-0">
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

