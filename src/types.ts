

export enum TaskStatus {
  TODO = 'TODO',
  DOING = 'DOING',
  DONE = 'DONE'
}

export interface Task {
  id: string;
  title: string;
  author: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  tags: string[];
  progress: number;
  assignee?: string;
}

export interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  tags: string[];
  sectionId?: string | null;
  analysis?: {
    type: 'code' | 'prompt' | 'natural_language';
    summary?: string;
    error?: string;
    fix?: string;
  };
  encrypted?: boolean;
  iv?: string;
}

export interface Section {
  id: string;
  name?: string; // Used by SnippetVault
  title?: string; // Used by FileBrowser
  itemIds?: string[]; // Used by FileBrowser
}

export interface SharedFile {
  name: string;
  realName?: string;
  size: number;
  uploadedAt: number;
  type: string;
  analysis?: {
    summary: string;
  };
}

export interface User {
  id: string;
  name: string;
  isHost?: boolean;
}

export interface BoilerplateConfig {
  stack: 'MERN' | 'Flask+React' | 'Next.js' | 'Go+Vue';
  features: {
    auth: boolean;
    db: boolean;
    tailwind: boolean;
    docker: boolean;
  };
}

export type View = 'kanban' | 'snippets' | 'boilerplate' | 'settings' | 'files' | 'directory' | 'admin' | 'code-editor';

export interface PressureAnalysis {
  level: number; // 0-100
  message: string;
  color: string;
}

export interface ServerStatsData {
  uptime: number;
  totalRooms: number;
  totalUsers: number;
  activeRooms: { name: string; userCount: number; host: string; password?: string }[];
  adminUsername?: string;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
}

// Directory Mode Types
export interface FileSystemItem {
  name: string;
  path: string; // Relative path
  type: 'file' | 'directory';
  size?: number;
  children?: FileSystemItem[];
  owner?: string; // User ID
}

export interface DirectoryState {
  [userId: string]: {
    userName: string;
    isOnline: boolean;
    root: FileSystemItem[];
  }
}

// Collaborative Editor Types
export interface EditorFile {
  id: string;
  name: string;
  type: 'file';
  parentId: string | null;
  content: string;
  language: string;
}

export interface EditorFolder {
  id: string;
  name: string;
  type: 'directory';
  parentId: string | null;
  children: (EditorFile | EditorFolder)[];
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  encrypted?: boolean;
  iv?: string;
  replyTo?: {
    id: string;
    sender: string;
    text: string;
  };
}

export type EditorNode = EditorFile | EditorFolder;