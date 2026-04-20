import React, { useState, useMemo, useEffect } from 'react';
import { Snippet, Section } from '@/types';
import { Icons } from '@/components/Icons';
import { useEncryption } from '@/utils/crypto';

interface SnippetVaultProps {
  snippets: Snippet[];
  setSnippets: React.Dispatch<React.SetStateAction<Snippet[]>>;
  sections: Section[];
  setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  geminiApiKey: string;
  categorizeSnippets: (snippets: Snippet[]) => Promise<Record<string, string[]>>;
  debugCode: (code: string) => Promise<{ error: string; fix: string }>;
  analyzeCode: (code: string) => Promise<{ type: 'code' | 'prompt' | 'natural_language'; summary?: string; error?: string; fix?: string; }>;
  roomPassword?: string;
  encryptionEnabled?: boolean;
}

const DebugModal: React.FC<{ 
    code: string; 
    onClose: () => void; 
    debugCode: (code: string) => Promise<{ error: string; fix: string }>;
    geminiApiKey: string;
}> = ({ code, onClose, debugCode, geminiApiKey }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [debugResult, setDebugResult] = useState<{ error: string; fix: string } | null>(null);

    useEffect(() => {
        const getDebugInfo = async () => {
            try {
                const result = await debugCode(code);
                setDebugResult(result);
            } catch (error) {
                console.error("Failed to debug code:", error);
                setDebugResult({ error: "Failed to analyze code.", fix: "" });
            }
            setIsLoading(false);
        };
        getDebugInfo();
    }, [code, geminiApiKey]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-hack-surface p-6 rounded-lg max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">AI Code Debugger</h3>
                {isLoading ? (
                    <p>Analyzing code...</p>
                ) : debugResult ? (
                    <div>
                        <h4 className="font-bold text-red-500">Detected Issue:</h4>
                        <p className="mb-4">{debugResult.error}</p>
                        <h4 className="font-bold text-green-500">Suggested Fix:</h4>
                        <pre className="bg-hack-bg p-4 rounded font-mono text-sm">{debugResult.fix}</pre>
                    </div>
                ) : (
                    <p>No issues found.</p>
                )}
                <button onClick={onClose} className="mt-4 bg-hack-primary text-black px-4 py-2 rounded">Close</button>
            </div>
        </div>
    );
};
const SnippetItem: React.FC<{ 
    snippet: Snippet; 
    onEdit: (e: React.MouseEvent, s: Snippet) => void;
    onDelete: (e: React.MouseEvent, id: string) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, snippetId: string) => void;
    onDebug: (code: string) => void;
    roomPassword?: string;
}> = ({ snippet, onEdit, onDelete, onDragStart, onDebug, roomPassword }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [decryptedCode, setDecryptedCode] = useState<string>(snippet.code);
    const { decrypt } = useEncryption(roomPassword || '');

    useEffect(() => {
        const decryptContent = async () => {
            if (snippet.encrypted && snippet.iv && roomPassword) {
                try {
                    const decrypted = await decrypt(snippet.code, snippet.iv);
                    setDecryptedCode(decrypted);
                } catch (error) {
                    console.error("Failed to decrypt snippet:", error);
                    setDecryptedCode("Error: Could not decrypt snippet. Check password.");
                }
            } else {
                setDecryptedCode(snippet.code);
            }
        };
        decryptContent();
    }, [snippet, roomPassword, decrypt]);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const textToCopy = decryptedCode;

        if (navigator.clipboard && window.isSecureContext) {
            // Modern, secure context method
            navigator.clipboard.writeText(textToCopy).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }).catch(err => {
                console.warn('Clipboard API failed, falling back.', err);
                fallbackCopy(textToCopy);
            });
        } else {
            // Fallback for non-secure contexts (e.g., http, IP addresses)
            fallbackCopy(textToCopy);
        }
    };

    const fallbackCopy = (text: string) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Make the textarea invisible
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }
        } catch (err) {
            console.error('Fallback copy failed', err);
        }

        document.body.removeChild(textArea);
    };

    return (
        <div 
            draggable
            onDragStart={(e) => onDragStart(e, snippet.id)}
            className={`bg-hack-surface border border-hack-border rounded p-4 hover:border-hack-accent transition-all group flex flex-col cursor-grab`}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg truncate pr-2 flex items-center gap-2" title={snippet.title}>
                    {snippet.encrypted && <Icons.Lock className="w-4 h-4 text-hack-accent" />}
                    {snippet.title}
                </h3>
                <div className="flex gap-1">
                    <button 
                        type="button"
                        onClick={(e) => onEdit(e, snippet)} 
                        className="p-1 text-hack-muted hover:text-hack-accent hover:bg-hack-bg rounded transition-colors"
                        title="Edit Code"
                    >
                        <Icons.Edit className="w-4 h-4"/>
                    </button>
                    <button 
                        type="button"
                        onClick={(e) => onDelete(e, snippet.id)} 
                        className="p-1 text-hack-muted hover:text-hack-danger hover:bg-hack-bg rounded transition-colors"
                        title="Delete"
                    >
                        <Icons.Trash className="w-4 h-4"/>
                    </button>
                    <button 
                        type="button"
                        onClick={() => onDebug(snippet.code)}
                        className="p-1 text-hack-muted hover:text-blue-500 hover:bg-hack-bg rounded transition-colors"
                        title="Debug Code"
                    >
                        <Icons.Bug className="w-4 h-4"/>
                    </button>
                </div>
            </div>
            
            <div className="relative flex-1 bg-hack-bg rounded overflow-hidden">
                {snippet.analysis && snippet.analysis.type !== 'natural_language' && (
                  <div className="p-2 bg-hack-surface border-b border-hack-border text-xs">
                    <p className="text-hack-muted italic">{snippet.analysis.summary}</p>
                    {snippet.analysis.type === 'code' && snippet.analysis.error && <p className="text-red-500 mt-1">Error: {snippet.analysis.error}</p>}
                  </div>
                )}
                <div className={`p-3 text-xs font-mono text-gray-400 ${isExpanded ? '' : 'line-clamp-4 max-h-[6em] overflow-hidden'}`}>
                    <pre className="whitespace-pre-wrap break-all font-mono">{decryptedCode}</pre>
                </div>
                
                {!isExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-hack-bg to-transparent pointer-events-none"></div>
                )}

                <button 
                    type="button"
                    onClick={handleCopy}
                    className={`absolute top-1 right-1 px-2 py-1 rounded shadow-sm transition-all text-[10px] uppercase font-bold tracking-wider ${
                        isCopied 
                        ? 'bg-green-500 text-black opacity-100' 
                        : 'bg-hack-surface text-hack-primary opacity-0 group-hover:opacity-100 hover:bg-hack-primary hover:text-black'
                    }`}
                >
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-[10px] flex items-center justify-center gap-1 text-center text-hack-muted mt-2 opacity-70 hover:opacity-100 transition-all uppercase tracking-widest py-1 hover:bg-white/5 rounded"
            >
                {isExpanded ? (
                    <>
                        Collapse <Icons.ChevronDown className="w-3 h-3 transform rotate-180 transition-transform" />
                    </>
                ) : (
                    <>
                        Expand <Icons.ChevronDown className="w-3 h-3 transition-transform" />
                    </>
                )}
            </button>
        </div>
    );
};

const SectionNavItem: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    // FIX: Changed DragEvent from HTMLDivElement to HTMLButtonElement to match the element it's attached to.
    onDrop: (e: React.DragEvent<HTMLButtonElement>) => void;
    snippetCount: number;
    isDropTarget?: boolean;
}> = ({ label, isActive, onClick, onDrop, snippetCount, isDropTarget = true }) => {
    const [isOver, setIsOver] = useState(false);

    // FIX: Changed DragEvent from HTMLDivElement to HTMLButtonElement to match the element it's attached to.
    const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
        if (isDropTarget) {
            e.preventDefault();
            setIsOver(true);
        }
    };

    // FIX: Changed DragEvent from HTMLDivElement to HTMLButtonElement to match the element it's attached to.
    const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
        if (isDropTarget) {
            onDrop(e);
            setIsOver(false);
        }
    };

    return (
        <button
            onClick={onClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setIsOver(false)}
            className={`w-full shrink-0 text-left p-3 rounded-lg border text-sm font-mono transition-all flex items-center justify-between gap-2 ${
                isActive 
                ? 'bg-hack-primary/10 border-hack-primary text-hack-text shadow-[0_0_10px_rgba(var(--hack-primary),0.2)]' 
                : 'bg-hack-bg border-hack-border text-gray-400 hover:border-gray-500'
            } ${isOver ? 'border-hack-accent ring-2 ring-hack-accent' : ''}`}
        >
            <span className="truncate font-bold">{label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-hack-primary/20 text-hack-primary' : 'bg-hack-surface text-hack-muted'}`}>{snippetCount}</span>
        </button>
    );
};


export const SnippetVault: React.FC<SnippetVaultProps> = ({ snippets, setSnippets, sections, setSections, geminiApiKey, categorizeSnippets, debugCode, analyzeCode, roomPassword, encryptionEnabled }) => {
  const [newSnippet, setNewSnippet] = useState<Partial<Snippet>>({ title: '', code: '', language: 'javascript', sectionId: null });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null | 'all'>('all');
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [debuggingCode, setDebuggingCode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { encrypt } = useEncryption(roomPassword || '');

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, snippetId: string) => {
    e.dataTransfer.setData('snippetId', snippetId);
  };

  // FIX: Changed DragEvent from HTMLDivElement to HTMLButtonElement to match the event source.
  const handleDrop = (e: React.DragEvent<HTMLButtonElement>, targetSectionId: string | null) => {
    e.preventDefault();
    const snippetId = e.dataTransfer.getData('snippetId');
    if (snippetId) {
      setSnippets(prev => prev.map(s => 
        s.id === snippetId ? { ...s, sectionId: targetSectionId } : s
      ));
    }
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    const newSection: Section = {
        id: Date.now().toString(),
        name: newSectionName.trim()
    };
    setSections(prev => [...prev, newSection]);
    setNewSectionName('');
    setIsAddingSection(false);
  };

  const handleAiCategorize = async () => {
    if (!geminiApiKey) {
      alert('Please set your Gemini API key in the settings.');
      return;
    }
    setIsCategorizing(true);
    try {
      const snippetsToAnalyze = snippets.filter(s => !s.analysis);
      let updatedSnippets = [...snippets];

      if (snippetsToAnalyze.length > 0) {
        for (const snippet of snippetsToAnalyze) {
          try {
            const analysis = await analyzeCode(snippet.code);
            updatedSnippets = updatedSnippets.map(s => s.id === snippet.id ? { ...s, analysis } : s);
          } catch (error) {
            console.error(`Failed to analyze snippet ${snippet.title}:`, error);
            // Optionally, set a placeholder analysis to avoid re-attempting
            updatedSnippets = updatedSnippets.map(s => s.id === snippet.id ? { ...s, analysis: { type: 'natural_language', summary: 'Analysis failed.' } } : s);
          }
        }
        setSnippets(updatedSnippets);
      }

      const uncategorizedSnippets = updatedSnippets.filter(s => !s.sectionId);
      if (uncategorizedSnippets.length === 0) {
        alert("No uncategorized snippets to analyze or categorize.");
        setIsCategorizing(false);
        return;
      }
      const categorized = await categorizeSnippets(uncategorizedSnippets);
      const newSections = [...sections];
      const newSnippets = [...updatedSnippets];

      for (const sectionName in categorized) {
        let section = newSections.find(s => s.name === sectionName);
        if (!section) {
          section = { id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name: sectionName };
          newSections.push(section);
        }

        for (const snippetTitle of categorized[sectionName]) {
          const snippet = newSnippets.find(s => s.title === snippetTitle);
          if (snippet) {
            snippet.sectionId = section.id;
          }
        }
      }

      setSections(newSections);
      setSnippets(newSnippets);
    } catch (error) {
      console.error('AI categorization failed:', error);
      alert('AI categorization failed. See console for details.');
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleSaveSnippet = async () => {
    if (!newSnippet.title || !newSnippet.code) return;

    setIsSaving(true);
    try {
      let codeToSave = newSnippet.code;
      let isEncrypted = false;
      let iv = undefined;

      if (roomPassword && encryptionEnabled) {
          try {
              const encryptedData = await encrypt(newSnippet.code);
              codeToSave = encryptedData.data;
              iv = encryptedData.iv;
              isEncrypted = true;
          } catch (e) {
              console.error("Failed to encrypt snippet:", e);
              alert("Failed to encrypt snippet. Saving as plain text.");
          }
      }

      if (editingId) {
        setSnippets(prev => prev.map(s => 
          s.id === editingId 
            ? { 
                ...s, 
                title: newSnippet.title!, 
                code: codeToSave!, 
                language: newSnippet.language || 'text', 
                sectionId: newSnippet.sectionId,
                encrypted: isEncrypted,
                iv: iv
              } 
            : s
        ));
      } else {
        const s: Snippet = {
          id: Date.now().toString(),
          title: newSnippet.title,
          code: codeToSave,
          language: newSnippet.language || 'text',
          tags: [],
          sectionId: newSnippet.sectionId || 'all' ? null : selectedSectionId, // Assign to current section if not 'all'
          encrypted: isEncrypted,
          iv: iv
        };
        setSnippets([s, ...snippets]);
      }
      setNewSnippet({ title: '', code: '', language: 'javascript', sectionId: null });
      setEditingId(null);
      setShowForm(false);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSnippet = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setSnippets(prev => prev.filter(s => s.id !== id));
  };

  const editSnippet = (e: React.MouseEvent, snippet: Snippet) => {
    e.stopPropagation();
    setNewSnippet({ title: snippet.title, code: snippet.code, language: snippet.language, sectionId: snippet.sectionId });
    setEditingId(snippet.id);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setShowForm(false);
    setEditingId(null);
    setNewSnippet({ title: '', code: '', language: 'javascript', sectionId: null });
  };
  
  const handleAddSectionBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsAddingSection(false);
        setNewSectionName('');
    }
  };

  const filteredSnippetsBySearch = useMemo(() => snippets.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  ), [snippets, searchQuery]);
  
  const displayedSnippets = useMemo(() => {
    if (selectedSectionId === 'all') {
      return filteredSnippetsBySearch;
    }
    if (selectedSectionId === null) {
      return filteredSnippetsBySearch.filter(s => !s.sectionId);
    }
    return filteredSnippetsBySearch.filter(s => s.sectionId === selectedSectionId);
  }, [filteredSnippetsBySearch, selectedSectionId]);

  const uncategorizedCount = useMemo(() => snippets.filter(s => !s.sectionId).length, [snippets]);
  
  const countsBySection = useMemo(() => {
    const counts: Record<string, number> = {};
    sections.forEach(sec => {
        counts[sec.id] = snippets.filter(s => s.sectionId === sec.id).length;
    });
    return counts;
  }, [snippets, sections]);


  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-hack-primary flex items-center gap-2 drop-shadow-lg">
            <Icons.Code className="w-6 h-6" /> Snippet Vault
        </h2>
        
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-hack-muted" />
                <input 
                    type="text"
                    placeholder="Search snippets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full cyber-input pl-9 pr-4 py-2 rounded-full text-sm focus:ring-2 focus:ring-hack-primary/50"
                />
            </div>
            <button
                type="button"
                onClick={handleAiCategorize}
                disabled={isCategorizing}
                className="px-4 py-2 rounded-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-lg transition-all hover:scale-105"
            >
                {isCategorizing ? 'Categorizing...' : 'AI Categorize'}
            </button>
            <button 
                type="button"
                onClick={() => {
                    if (showForm) cancelEdit();
                    else {
                        setEditingId(null);
                        setNewSnippet({ title: '', code: '', language: 'javascript', sectionId: selectedSectionId === 'all' ? null : selectedSectionId });
                        setShowForm(true);
                    }
                }}
                className={`px-4 py-2 rounded-lg font-bold hover:bg-opacity-90 whitespace-nowrap transition-all hover:scale-105 shadow-lg ${showForm ? 'bg-gray-700 text-white' : 'bg-hack-accent text-black shadow-hack-accent/20'}`}
            >
                {showForm ? 'Cancel' : 'New Snippet'}
            </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 p-6 glass-panel rounded-xl animate-fade-in shadow-2xl border border-hack-primary/20">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-xl text-hack-text">{editingId ? 'Edit Snippet' : 'New Snippet'}</h3>
          </div>
          <input 
            className="w-full cyber-input p-3 rounded-lg mb-3 text-white focus:ring-2 focus:ring-hack-primary/50" 
            placeholder="Title (e.g., 'API Key', 'Docker Setup')"
            value={newSnippet.title}
            onChange={e => setNewSnippet({...newSnippet, title: e.target.value})}
          />
          <textarea 
            className="w-full cyber-input p-3 rounded-lg mb-3 font-mono text-sm h-48 text-gray-300 focus:ring-2 focus:ring-hack-primary/50" 
            placeholder="Paste code or secret here..."
            value={newSnippet.code}
            onChange={e => setNewSnippet({...newSnippet, code: e.target.value})}
          />
           <select
                className="w-full cyber-input p-3 rounded-lg mb-4 text-white focus:ring-2 focus:ring-hack-primary/50"
                value={newSnippet.sectionId || ''}
                onChange={e => setNewSnippet({...newSnippet, sectionId: e.target.value || null })}
            >
                <option value="">Uncategorized</option>
                {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                ))}
            </select>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={handleSaveSnippet} disabled={isSaving} className="flex-1 bg-hack-primary text-black font-bold py-3 rounded-lg hover:bg-white transition-all shadow-lg hover:shadow-hack-primary/30 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? 'Saving...' : (editingId ? 'Update Snippet' : 'Save to Vault')}
            </button>
            <button type="button" onClick={cancelEdit} className="px-6 py-3 bg-transparent border border-hack-border rounded-lg text-hack-muted hover:text-white hover:border-white/20 transition-all">
                Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col md:grid md:grid-cols-5 gap-6 overflow-hidden pb-2">
        {/* Navigator Sidebar */}
        <div className="md:col-span-1 glass-panel rounded-xl p-4 flex flex-col h-48 md:h-full shrink-0">
            <h3 className="text-xs font-bold text-hack-muted uppercase tracking-widest mb-2 md:mb-4 px-1">Sections</h3>
            <div className="flex flex-col overflow-y-auto space-y-2 pr-1 custom-scrollbar flex-1">
                <SectionNavItem 
                    label="All Snippets"
                    isActive={selectedSectionId === 'all'}
                    onClick={() => setSelectedSectionId('all')}
                    onDrop={() => {}} // No drop action for 'all'
                    snippetCount={snippets.length}
                    isDropTarget={false}
                />
                 <SectionNavItem 
                    label="Uncategorized"
                    isActive={selectedSectionId === null}
                    onClick={() => setSelectedSectionId(null)}
                    onDrop={(e) => handleDrop(e, null)}
                    snippetCount={uncategorizedCount}
                />
                <div className="hidden md:block my-3 border-t border-white/10"></div>
                {sections.map(section => (
                    <SectionNavItem 
                        key={section.id}
                        label={section.name || ''}
                        isActive={selectedSectionId === section.id}
                        onClick={() => setSelectedSectionId(section.id)}
                        onDrop={(e) => handleDrop(e, section.id)}
                        snippetCount={countsBySection[section.id] || 0}
                    />
                ))}
            </div>
            <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-white/10 shrink-0">
                {isAddingSection ? (
                    <div onBlur={handleAddSectionBlur} className="p-1 animate-fade-in">
                        <input
                            type="text"
                            autoFocus
                            placeholder="New section name..."
                            value={newSectionName}
                            onChange={(e) => setNewSectionName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                            className="w-full cyber-input p-2 rounded text-white text-sm"
                        />
                        <button onClick={handleAddSection} className="w-full mt-2 bg-hack-primary text-black font-bold py-2 rounded text-sm hover:bg-white transition-colors">Add</button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAddingSection(true)}
                        className="w-full h-10 flex items-center justify-center gap-2 bg-white/5 border-2 border-dashed border-white/10 hover:bg-white/10 text-hack-muted hover:text-white transition-all rounded-lg text-sm hover:border-white/20"
                    >
                        <Icons.Plus className="w-4 h-4" /> Add Section
                    </button>
                )}
            </div>
        </div>

        {/* Snippet Grid */}
        <div className="md:col-span-4 h-full overflow-y-auto pb-4 pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {displayedSnippets.map(snippet => (
                  <SnippetItem
                      key={snippet.id}
                      snippet={snippet}
                      onEdit={editSnippet}
                      onDelete={deleteSnippet}
                      onDragStart={handleDragStart}
                      onDebug={setDebuggingCode}
                      roomPassword={roomPassword}
                  />
              ))}
            </div>
            {displayedSnippets.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-hack-muted opacity-50 min-h-[300px]">
                <Icons.Code className="w-20 h-20 mb-4 opacity-20" />
                <p className="text-lg">No snippets in this sector.</p>
                {searchQuery && <p className="text-sm mt-2 opacity-70">Clear search query to reset.</p>}
              </div>
            )}
        </div>
      </div>
      {debuggingCode && <DebugModal code={debuggingCode} onClose={() => setDebuggingCode(null)} debugCode={debugCode} geminiApiKey={geminiApiKey} />}
    </div>
  );
};