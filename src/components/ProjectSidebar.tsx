import React, { useState, useEffect } from 'react';
import { EditorNode, EditorFile, EditorFolder } from '@/types';
import { Folder, File, FolderPlus, FilePlus, ChevronRight, ChevronDown, Trash2, Edit2, Download, Cloud } from 'lucide-react';

interface ProjectSidebarProps {
  files: EditorNode[];
  onSelectFile: (file: EditorFile) => void;
  onCreateFile: (parentId: string | null, name: string) => void;
  onCreateFolder: (parentId: string | null, name: string) => void;
  onDelete: (nodeId: string) => void;
  onRename: (nodeId: string, newName: string) => void;
  onDownloadZip: () => void;
  selectedFileId: string | null;
  onCloseMobile?: () => void;
}

const FileTreeNode: React.FC<{
  node: EditorNode;
  depth: number;
  onSelectFile: (file: EditorFile) => void;
  onCreateFile: (parentId: string | null, name: string) => void;
  onCreateFolder: (parentId: string | null, name: string) => void;
  onDelete: (nodeId: string) => void;
  onRename: (nodeId: string, newName: string) => void;
  selectedFileId: string | null;
}> = ({ node, depth, onSelectFile, onCreateFile, onCreateFolder, onDelete, onRename, selectedFileId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(node.name);

  const handleRename = () => {
    if (newName.trim() !== node.name) {
      onRename(node.id, newName);
    }
    setIsEditing(false);
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center group px-2 py-1 hover:bg-white/5 cursor-pointer ${selectedFileId === node.id ? 'bg-white/10 text-blue-400' : 'text-gray-400'}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (node.type === 'directory') {
            setIsOpen(!isOpen);
          } else {
            onSelectFile(node as EditorFile);
          }
        }}
      >
        <span className="mr-1 opacity-70">
          {node.type === 'directory' ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <File size={14} />
          )}
        </span>
        
        {isEditing ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            className="bg-black/50 text-white text-sm px-1 rounded border border-white/20 outline-none w-full"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-sm truncate flex-1">{node.name}</span>
        )}

        <div className="hidden group-hover:flex items-center gap-1 ml-2">
            {node.type === 'directory' && (
                <>
                    <button 
                        onClick={(e) => { e.stopPropagation(); const name = prompt("File name:"); if(name) onCreateFile(node.id, name); }}
                        className="p-1 hover:text-white"
                        title="New File"
                    >
                        <FilePlus size={12} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); const name = prompt("Folder name:"); if(name) onCreateFolder(node.id, name); }}
                        className="p-1 hover:text-white"
                        title="New Folder"
                    >
                        <FolderPlus size={12} />
                    </button>
                </>
            )}
            <button 
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="p-1 hover:text-white"
                title="Rename"
            >
                <Edit2 size={12} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) onDelete(node.id); }}
                className="p-1 hover:text-red-400"
                title="Delete"
            >
                <Trash2 size={12} />
            </button>
        </div>
      </div>

      {node.type === 'directory' && isOpen && (
        <div>
          {(node as EditorFolder).children.map(child => (
            <FileTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelectFile={onSelectFile}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onDelete={onDelete}
              onRename={onRename}
              selectedFileId={selectedFileId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ 
  files, onSelectFile, onCreateFile, onCreateFolder, onDelete, onRename, onDownloadZip, selectedFileId, onCloseMobile 
}) => {
  return (
    <div className="h-full flex flex-col bg-[#0D0D0D] border-r border-white/10 w-full md:w-64">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-medium">
            <Cloud size={16} className="text-blue-400" />
            <span>Project</span>
        </div>
        <div className="flex items-center gap-1">
            <button 
                onClick={() => { const name = prompt("File name:"); if(name) onCreateFile(null, name); }}
                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                title="New File"
            >
                <FilePlus size={16} />
            </button>
            <button 
                onClick={() => { const name = prompt("Folder name:"); if(name) onCreateFolder(null, name); }}
                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                title="New Folder"
            >
                <FolderPlus size={16} />
            </button>
            <button 
                onClick={onDownloadZip}
                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                title="Download ZIP"
            >
                <Download size={16} />
            </button>
            {onCloseMobile && (
                <button 
                    onClick={onCloseMobile}
                    className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors ml-2"
                    title="Close"
                >
                    ✕
                </button>
            )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {files.map(node => (
          <FileTreeNode
            key={node.id}
            node={node}
            depth={0}
            onSelectFile={onSelectFile}
            onCreateFile={onCreateFile}
            onCreateFolder={onCreateFolder}
            onDelete={onDelete}
            onRename={onRename}
            selectedFileId={selectedFileId}
          />
        ))}
        {files.length === 0 && (
            <div className="text-center text-gray-500 mt-10 text-sm px-4">
                No files yet. Create one to get started.
            </div>
        )}
      </div>
    </div>
  );
};
