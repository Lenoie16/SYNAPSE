import React, { useRef, useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import Editor, { OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { Save } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface CollaborativeCodeEditorProps {
  roomName: string;
  documentId: string;
  initialContent?: string;
  language?: string;
  socket: Socket;
}

const CollaborativeCodeEditor: React.FC<CollaborativeCodeEditorProps> = ({
  roomName,
  documentId,
  initialContent,
  language = 'typescript',
  socket
}) => {
  const [status, setStatus] = useState('Connecting...');
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);

  useEffect(() => {
    // Cleanup previous provider/binding
    if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
    }
    if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
    }
    if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
    }

    if (!documentId) return;

    const doc = new Y.Doc();
    ydocRef.current = doc;
    const yText = doc.getText('monaco');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Construct WebSocket URL
    const wsUrl = `${protocol}//${window.location.host}/yjs`;
    
    // Room name for Yjs (must match server logic)
    // The server expects the room name in the path or query param
    // We use a query param approach for flexibility if the server supports it, 
    // or path based: /yjs/synapse-code-{roomName}-{documentId}
    const room = `synapse-code-${roomName}-${documentId}`;

    const provider = new WebsocketProvider(
      wsUrl, 
      room,
      doc,
      { 
          connect: true,
          params: {
              roomName: roomName,
              filePath: documentId
          }
      }
    );
    
    providerRef.current = provider;

    provider.on('status', (event: any) => {
        setStatus(event.status);
    });

    // If editor is already mounted, bind it
    if (editorRef.current) {
        const binding = new MonacoBinding(
            yText,
            editorRef.current.getModel()!,
            new Set([editorRef.current]),
            provider.awareness
        );
        bindingRef.current = binding;
    }

    return () => {
      if (providerRef.current) providerRef.current.destroy();
      if (bindingRef.current) bindingRef.current.destroy();
      if (ydocRef.current) ydocRef.current.destroy();
    };
  }, [roomName, documentId]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor
    editor.updateOptions({
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 14,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        theme: 'vs-dark',
        automaticLayout: true,
    });

    // If provider exists (re-mount scenario), bind immediately
    if (providerRef.current && ydocRef.current) {
        const yText = ydocRef.current.getText('monaco');
        const binding = new MonacoBinding(
            yText,
            editor.getModel()!,
            new Set([editor]),
            providerRef.current.awareness
        );
        bindingRef.current = binding;
    }
  };

  const handleSave = () => {
      setIsSaving(true);
      socket.emit('editor:save', { roomName, documentId });
      setTimeout(() => setIsSaving(false), 1000);
  };

  // Keyboard shortcut for save
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
              e.preventDefault();
              handleSave();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roomName, documentId]);

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col relative bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#333] bg-[#252526] text-[#cccccc]">
          <div className="flex items-center gap-2 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="opacity-70">{status.toUpperCase()}</span>
              <span className="opacity-50 mx-2">|</span>
              <span className="opacity-70">{language.toUpperCase()}</span>
          </div>
          <button 
            onClick={handleSave}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                isSaving 
                ? 'bg-green-600 text-white' 
                : 'bg-[#333] hover:bg-[#444] text-white'
            }`}
          >
              <Save size={14} />
              {isSaving ? 'Saved' : 'Save'}
          </button>
      </div>
      
      <div className="flex-1 relative">
          <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            theme="vs-dark"
            onMount={handleEditorDidMount}
            options={{
                wordWrap: 'on',
                padding: { top: 16 },
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                contextmenu: true,
                formatOnPaste: true,
                formatOnType: true,
            }}
          />
      </div>
    </div>
  );
};

export default CollaborativeCodeEditor;
