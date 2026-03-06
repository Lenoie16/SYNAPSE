
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';
import os from 'os';
import fs from 'fs';
import multer, { FileFilterCallback } from 'multer';
import { fileURLToPath } from 'url';
import session, { Session, SessionData } from 'express-session';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { SharedFile, Task, Snippet, Section, User, DirectoryState, EditorNode, EditorFile, EditorFolder, ChatMessage } from './src/types';
import * as Y from 'yjs';
import { WebSocketServer, WebSocket } from 'ws';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import archiver from 'archiver';

declare module 'express-session' {
    interface SessionData {
        isAdmin?: boolean;
    }
}

interface CustomRequest extends Request {
    session: Session & SessionData & { isAdmin?: boolean };
    file?: Express.Multer.File;
}

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'synapse-jwt-secret-key-change-in-prod';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const messageSync = 0;
const messageAwareness = 1;

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Setup WebSocket Server for Yjs
  const wss = new WebSocketServer({ noServer: true });
  const ydocs = new Map<string, Y.Doc>();
  const awarenesses = new Map<string, awarenessProtocol.Awareness>();
  const docConns = new Map<string, Set<WebSocket>>();

  // --- ROOM & ADMIN STATE MANAGEMENT ---
  let rooms = new Map();
  let adminCredentials = {
      username: 'admin1',
      passwordHash: '' // Will be set on first load
  };
  const socketRoomMap = new Map(); // socketId -> roomName
  const relayRequests = new Map();

  // --- PERSISTENCE & SECURITY HELPERS ---
  const SALT_ROUNDS = 10;
  const DB_FILE = path.join(__dirname, 'synapse.db.json');
  const PROJECTS_DIR = path.join(__dirname, 'projects');

  if (!fs.existsSync(PROJECTS_DIR)) {
      fs.mkdirSync(PROJECTS_DIR);
  }

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

  const readFileContent = (filePath: string): string => {
      try {
          const buffer = fs.readFileSync(filePath);
          // Check for UTF-16LE BOM (FF FE)
          if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
              return buffer.toString('utf16le');
          }
          // Check for UTF-8 BOM (EF BB BF)
          if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
              return buffer.toString('utf8').slice(1); // Strip BOM
          }
          return buffer.toString('utf8');
      } catch (e) {
          return '';
      }
  };

  const getFileTree = (roomName: string): EditorNode[] => {
      const rootPath = path.join(PROJECTS_DIR, roomName);
      if (!fs.existsSync(rootPath)) return [];

      const buildTree = (dir: string): EditorNode[] => {
          const items = fs.readdirSync(dir, { withFileTypes: true });
          return items.map(item => {
              const fullPath = path.join(dir, item.name);
              const relativePath = path.relative(rootPath, fullPath);
              // Use forward slashes for IDs to be consistent across platforms
              const id = relativePath.split(path.sep).join('/'); 
              const parentRelative = path.relative(rootPath, path.dirname(fullPath));
              const parentId = parentRelative === '' ? null : parentRelative.split(path.sep).join('/');

              if (item.isDirectory()) {
                  return {
                      id,
                      name: item.name,
                      type: 'directory',
                      parentId: parentId === '.' ? null : parentId,
                      children: buildTree(fullPath)
                  } as EditorFolder;
              } else {
                  const content = readFileContent(fullPath);
                  return {
                      id,
                      name: item.name,
                      type: 'file',
                      parentId: parentId === '.' ? null : parentId,
                      content,
                      language: getLanguageFromExt(item.name)
                  } as EditorFile;
              }
          });
      };
      
      return buildTree(rootPath);
  };

  const ensureProjectDir = (roomName: string) => {
      const dir = path.join(PROJECTS_DIR, roomName);
      if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
      }
  };

  const saveDatabase = () => {
      try {
          const dataToSave = {
              rooms: Array.from(rooms.entries()),
              admin: adminCredentials
          };
          fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2));
          console.log("[DB] Database saved successfully.");
      } catch (e) {
          console.error("Failed to save database:", e);
      }
  };

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    if (url.pathname.startsWith('/yjs')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    
    // y-websocket client puts the room name in the path: /yjs/roomName
    // We need to extract it.
    let docName = url.pathname.split('/').pop();
    
    // Fallback to query param if path extraction fails or is just 'yjs'
    if (!docName || docName === 'yjs') {
        docName = url.searchParams.get('docName') || undefined;
    }

    if (docName) {
        try {
            docName = decodeURIComponent(docName);
        } catch (e) {
            console.error("Error decoding docName:", docName, e);
        }
    }

    if (!docName) {
      ws.close();
      return;
    }

    console.log(`[Yjs] Connection for doc: ${docName}`);

    if (!ydocs.has(docName)) {
      const doc = new Y.Doc();
      ydocs.set(docName, doc);
      
    // Initialize doc content from FS if available
      // docName format: synapse-code-{roomName}-{fileId}
      // fileId is now the relative path (e.g. "src/App.tsx")
      let roomName: string | null = url.searchParams.get('roomName');
      let filePath: string | null = url.searchParams.get('filePath');

      if (!roomName || !filePath) {
          // Fallback to parsing docName if params are missing
          if (docName.startsWith('synapse-code-')) {
              const prefix = 'synapse-code-';
              const rest = docName.substring(prefix.length);
              
              for (const [name, _] of rooms) {
                  if (rest.startsWith(name + '-')) {
                      roomName = name;
                      filePath = rest.substring(name.length + 1);
                      break;
                  }
              }
          }
      } else {
          console.log(`[Yjs] Using query params: roomName="${roomName}", filePath="${filePath}"`);
      }

      if (roomName && filePath) {
          const fullPath = path.join(PROJECTS_DIR, roomName, filePath);
          if (fs.existsSync(fullPath)) {
             try {
                 const content = readFileContent(fullPath);
                 const yText = doc.getText('monaco');
                 if (yText.toString() === '') {
                     doc.transact(() => {
                         yText.insert(0, content);
                     });
                     console.log(`[Yjs] Initialized doc from FS: ${fullPath}`);
                 }
             } catch (e) {
                 console.error(`[Yjs] Error reading file ${fullPath}:`, e);
             }
          } else {
              console.log(`[Yjs] File not found on disk: ${fullPath}`);
          }
      }

      doc.on('update', (update: Uint8Array, origin: any) => {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.writeUpdate(encoder, update);
        const message = encoding.toUint8Array(encoder);

        docConns.get(docName!)?.forEach(client => {
          if (client !== origin && client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });

        // Persist content to Disk
        if (roomName && filePath) {
            const fullPath = path.join(PROJECTS_DIR, roomName!, filePath!);
            const content = doc.getText('monaco').toString();
            
            // Ensure directory exists (it should, but safety first)
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // Explicitly use utf8 encoding
            fs.writeFile(fullPath, content, { encoding: 'utf8' }, (err) => {
                if (err) console.error(`[Yjs] Error saving file ${fullPath}:`, err);
            });
        }
      });
    }
    const doc = ydocs.get(docName)!;

    if (!awarenesses.has(docName)) {
        const awareness = new awarenessProtocol.Awareness(doc);
        awarenesses.set(docName, awareness);
        
        awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
            const changedClients = added.concat(updated).concat(removed);
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageAwareness);
            encoding.writeVarUint8Array(
                encoder,
                awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
            );
            const message = encoding.toUint8Array(encoder);
            
            docConns.get(docName)?.forEach(client => {
                if (client !== origin && client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        });
    }
    const awareness = awarenesses.get(docName)!;

    if (!docConns.has(docName)) {
        docConns.set(docName, new Set());
    }
    docConns.get(docName)!.add(ws);

    // Setup connection
    ws.binaryType = 'arraybuffer';
    
    // Send sync step 1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    ws.send(encoding.toUint8Array(encoder));

    // Send awareness
    if (awareness.getLocalState() !== null) {
        const encoderAwarenessState = encoding.createEncoder();
        encoding.writeVarUint(encoderAwarenessState, messageAwareness);
        encoding.writeVarUint8Array(
            encoderAwarenessState,
            awarenessProtocol.encodeAwarenessUpdate(awareness, [doc.clientID])
        );
        ws.send(encoding.toUint8Array(encoderAwarenessState));
    }

    ws.on('message', (message: ArrayBuffer) => {
        const encoder = encoding.createEncoder();
        const decoder = decoding.createDecoder(new Uint8Array(message));
        const messageType = decoding.readVarUint(decoder);

        switch (messageType) {
            case messageSync:
                encoding.writeVarUint(encoder, messageSync);
                syncProtocol.readSyncMessage(decoder, encoder, doc, ws);
                if (encoding.length(encoder) > 1) {
                    ws.send(encoding.toUint8Array(encoder));
                }
                break;
            case messageAwareness:
                awarenessProtocol.applyAwarenessUpdate(
                    awareness,
                    decoding.readVarUint8Array(decoder),
                    ws
                );
                break;
        }
    });

    ws.on('close', () => {
        docConns.get(docName)?.delete(ws);
        if (docConns.get(docName)?.size === 0) {
            docConns.delete(docName);
            ydocs.delete(docName);
            awarenesses.delete(docName);
        }
    });
  });

  app.use(cors());
  app.use(express.json({limit: '50mb'})); // For parsing application/json
  app.use(cookieParser());
  
  // Trust proxy for secure cookies behind nginx
  app.set('trust proxy', true);

  // Force HTTPS/Secure properties for session cookies behind proxy
  app.use((req, res, next) => {
      // In the AI Studio environment, we are always behind an HTTPS ingress.
      // We force these properties to ensure secure cookies are sent.
      Object.defineProperty(req, 'protocol', { value: 'https', writable: true });
      Object.defineProperty(req, 'secure', { value: true, writable: true });
      next();
  });

  // Debug middleware to check protocol and headers
  app.use((req, res, next) => {
      if (req.path.startsWith('/api/admin')) {
          console.log(`[${req.method}] ${req.path}`);
          console.log('  Secure (forced):', req.secure);
          console.log('  Session ID:', req.sessionID);
      }
      next();
  });

  // --- DATABASE CONFIGURATION ---
  // const DB_FILE = path.join(__dirname, 'synapse.db.json'); // Moved up

  // --- ADMIN & SESSION CONFIGURATION ---
  const sessionMiddleware = session({
      secret: process.env.SESSION_SECRET || 'your-default-super-secret-key',
      resave: false,
      saveUninitialized: false, // Changed to false to reduce empty sessions
      proxy: true, // Trust the proxy settings
      cookie: { 
          secure: true, // Required for SameSite=None
          sameSite: 'none', // Required for cross-origin iframe context
          httpOnly: true, 
          maxAge: 24 * 60 * 60 * 1000 
      } 
  });
  app.use(sessionMiddleware);

  // Middleware to check if admin is authenticated via JWT
  const requireAdminLogin = (req: CustomRequest, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      if (authHeader) {
          const token = authHeader.split(' ')[1];
          jwt.verify(token, JWT_SECRET, (err, user) => {
              if (err) {
                  return res.status(403).json({ error: 'Forbidden: Invalid token.' });
              }
              (req as any).user = user;
              next();
          });
      } else {
          res.status(401).json({ error: 'Unauthorized: Admin access required.' });
      }
  };

  // --- FILE UPLOAD CONFIGURATION ---
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir);
  }

  const storage = multer.diskStorage({
    destination: function (req: CustomRequest, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
      cb(null, uploadDir)
    },
    filename: function (req: CustomRequest, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, 'TEMP-' + uniqueSuffix + '-' + file.originalname)
    }
  });

  const upload = multer({ storage: storage });
  app.use('/uploads', express.static(uploadDir));

  // --- ROOM & ADMIN STATE MANAGEMENT ---
  // let rooms = new Map(); // Moved up
  // let adminCredentials = ... // Moved up
  // const socketRoomMap = new Map(); // Moved up
  // const relayRequests = new Map(); // Moved up

  // --- PERSISTENCE & SECURITY HELPERS ---
  // const SALT_ROUNDS = 10; // Moved up

  // const saveDatabase = ... // Moved up

  const loadDatabase = async () => {
      let shouldSave = false;
      if (fs.existsSync(DB_FILE)) {
          try {
              const data = fs.readFileSync(DB_FILE, 'utf8');
              const dbContent = JSON.parse(data);
              rooms = new Map(dbContent.rooms || []);
              if (dbContent.admin && dbContent.admin.username) {
                  adminCredentials = dbContent.admin;
                  // Check for corrupted/missing hash
                  if (!adminCredentials.passwordHash || adminCredentials.passwordHash.length < 10) {
                     console.warn("Admin password hash missing or corrupt. Resetting to default 'admin1'.");
                     adminCredentials.passwordHash = await bcrypt.hash('admin1', SALT_ROUNDS);
                     shouldSave = true; // Mark DB for saving
                 }
              } else {
                  // First time setup or migration from a DB without admin
                  console.log("No admin found in DB, setting up default 'admin1' user.");
                  adminCredentials.passwordHash = await bcrypt.hash('admin1', SALT_ROUNDS);
                  shouldSave = true; // Mark DB for saving
              }
              console.log(`\n💾 Database loaded. Restored ${rooms.size} rooms.`);
          } catch (e) {
              console.error("Failed to load database, resetting to defaults:", e);
              rooms = new Map();
              adminCredentials.passwordHash = await bcrypt.hash('admin1', SALT_ROUNDS);
              shouldSave = true; // Mark DB for saving
          }
      } else {
          // First time running the server
          console.log("No database file found. Creating new one with default admin 'admin1'.");
          adminCredentials.passwordHash = await bcrypt.hash('admin1', SALT_ROUNDS);
          shouldSave = true; // Mark DB for saving
      }

      if (shouldSave) {
          saveDatabase();
      }
  };

  await loadDatabase();

  const getInitialRoomState = (name: string, password: string, hostName: string) => {
      ensureProjectDir(name);
      return {
        name,
        password,
        host: hostName, 
        users: [] as User[], 
        tasks: [] as Task[],
        snippets: [] as Snippet[],
        sections: [] as Section[],
        fileSections: [] as Section[],
        directories: {} as DirectoryState,
        editorFiles: getFileTree(name), // Load from FS
        chatHistory: [] as ChatMessage[], // Chat History
        startTime: Date.now(),
        endTime: Date.now() + 24 * 60 * 60 * 1000,
        encryptionEnabled: true
      };
  };

  const getRoomFiles = (roomName: string): SharedFile[] => {
      try {
          const files = fs.readdirSync(uploadDir);
          const prefix = `${roomName}---`;
          
          return files
              .filter(f => f.startsWith(prefix))
              .map(filename => {
                  const stats = fs.statSync(path.join(uploadDir, filename));
                  const displayName = filename.substring(prefix.length);
                  return {
                      name: displayName, 
                      realName: filename, 
                      size: stats.size,
                      uploadedAt: stats.mtimeMs,
                      type: path.extname(filename)
                  };
              });
      } catch (e) {
          console.error("Error reading uploads:", e);
          return [];
      }
  };

  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "DELETE"] },
    maxHttpBufferSize: 1e8 // 100 MB
  });

  // Share session middleware with Socket.IO
  io.use((socket, next) => {
      sessionMiddleware(socket.request as express.Request, {} as express.Response, next as express.NextFunction);
  });

  // --- API ROUTES ---

  // --- EDITOR ZIP DOWNLOAD ---
  app.get('/api/editor/download-zip/:roomName', (req, res) => {
      const { roomName } = req.params;
      const room = rooms.get(roomName);
      
      if (!room) return res.status(404).send("Room not found");

      const archive = archiver('zip', {
          zlib: { level: 9 } // Sets the compression level.
      });

      res.attachment(`${roomName}-project.zip`);

      archive.on('error', function(err) {
        res.status(500).send({error: err.message});
      });

      archive.pipe(res);

      const appendNodesToArchive = (nodes: EditorNode[], parentPath: string) => {
          for (const node of nodes) {
              const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
              if (node.type === 'file') {
                  archive.append((node as EditorFile).content || '', { name: currentPath });
              } else if (node.type === 'directory') {
                  archive.append(Buffer.from(''), { name: currentPath + '/' });
                  appendNodesToArchive((node as EditorFolder).children, currentPath);
              }
          }
      };

      if (room.editorFiles) {
          appendNodesToArchive(room.editorFiles, '');
      }

      archive.finalize();
  });

  // --- ADMIN AUTH API ---
  app.post('/api/admin/login', async (req: Request, res: Response) => {
      const { username, password } = req.body;
      if (username === adminCredentials.username && await bcrypt.compare(password, adminCredentials.passwordHash)) {
          // Generate JWT
          const token = jwt.sign({ username: adminCredentials.username, isAdmin: true }, JWT_SECRET, { expiresIn: '24h' });
          res.json({ success: true, token });
      } else {
          res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
  });

  app.post('/api/admin/logout', (req: Request, res: Response) => {
      // Client-side token removal handles logout
      res.json({ success: true });
  });

  app.get('/api/admin/status', (req: CustomRequest, res: Response) => {
      const authHeader = req.headers.authorization;
      if (authHeader) {
          const token = authHeader.split(' ')[1];
          jwt.verify(token, JWT_SECRET, (err, user) => {
              if (err) {
                  return res.json({ isAdmin: false });
              }
              return res.json({ isAdmin: true });
          });
      } else {
          res.json({ isAdmin: false });
      }
  });

  // Public endpoint for local IP addresses
  app.get('/api/local-ips', (req, res) => {
      res.json({ localIpAddresses: getLocalIpAddresses() });
  });

  app.post('/api/admin/update-credentials', requireAdminLogin, async (req, res) => {
      const { newUsername, newPassword } = req.body;
      console.log(`[Admin] Attempting credential update for user: ${newUsername}`);
      
      if (!newUsername || !newPassword) {
          return res.status(400).json({ error: 'New username and password are required.' });
      }
      try {
          const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
          adminCredentials.username = newUsername;
          adminCredentials.passwordHash = hash;
          
          console.log(`[Admin] Credentials updated in memory. Saving to DB...`);
          saveDatabase();
          
          res.json({ success: true });
      } catch (error) {
          console.error("Credential update error:", error);
          res.status(500).json({ error: 'Failed to update credentials.' });
      }
  });

  // --- ADMIN CONSOLE API ---
  app.get('/api/stats', requireAdminLogin, (req: CustomRequest, res: Response) => {
      const roomData: { name: string; userCount: number; host: string; password?: string }[] = [];
      let totalUsers = 0;

      rooms.forEach((room, name) => {
          totalUsers += room.users.length;
          roomData.push({
              name: name,
              userCount: room.users.length,
              host: room.host,
              password: room.password 
          });
      });

      res.json({
          uptime: process.uptime(),
          totalRooms: rooms.size,
          totalUsers: totalUsers,
          activeRooms: roomData,
          memoryUsage: process.memoryUsage(),
          localIpAddresses: getLocalIpAddresses(),
          adminUsername: adminCredentials.username
      });
  });

  app.delete('/api/admin/room/:roomName', requireAdminLogin, (req: CustomRequest, res: Response) => {
      const roomName = req.params.roomName as string;
      
      if (rooms.has(roomName)) {
          // 1. Notify and disconnect users
          io.to(roomName).emit('auth:error', 'Room deleted by server admin.');
          const roomUsers = rooms.get(roomName).users;
          roomUsers.forEach((u: User) => socketRoomMap.delete(u.id));
          io.in(roomName).socketsLeave(roomName);

          // 2. Delete Project Directory (Code Files)
          const projectPath = path.join(PROJECTS_DIR, roomName);
          if (fs.existsSync(projectPath)) {
              try {
                  fs.rmSync(projectPath, { recursive: true, force: true });
                  console.log(`[Admin] Deleted project directory: ${projectPath}`);
              } catch (e) {
                  console.error(`[Admin] Failed to delete project directory: ${projectPath}`, e);
              }
          }

          // 3. Delete Uploaded Files
          try {
              const files = fs.readdirSync(uploadDir);
              const prefix = `${roomName}---`;
              files.forEach(file => {
                  if (file.startsWith(prefix)) {
                      fs.unlinkSync(path.join(uploadDir, file));
                      console.log(`[Admin] Deleted upload: ${file}`);
                  }
              });
          } catch (e) {
              console.error(`[Admin] Failed to clean up uploads for room ${roomName}`, e);
          }

          // 4. Cleanup Yjs Docs (Memory)
          // Iterate over ydocs keys to find docs belonging to this room
          // Format: synapse-code-{roomName}-{filePath}
          const docPrefix = `synapse-code-${roomName}-`;
          for (const key of ydocs.keys()) {
              if (key.startsWith(docPrefix)) {
                  ydocs.delete(key);
                  awarenesses.delete(key);
                  docConns.delete(key);
                  console.log(`[Admin] Deleted Yjs doc: ${key}`);
              }
          }

          // 5. Remove from DB and Save
          rooms.delete(roomName);
          saveDatabase();
          
          res.json({ success: true });
      } else {
          res.status(404).json({ error: "Room not found" });
      }
  });

  // --- PUBLIC FILE API ---
  app.post('/upload', upload.single('file'), (req: CustomRequest, res: Response) => {
      if (!req.file || !req.body.roomName) {
          return res.status(400).send('Missing file or roomName');
      }
      const roomName: string = req.body.roomName;
      const tempPath = req.file.path;
      const targetName = `${roomName}---${req.file.originalname}`;
      const targetPath = path.join(uploadDir, targetName);

      fs.rename(tempPath, targetPath, (err) => {
          if (err) return res.status(500).send("Server error processing file");
          const roomFiles = getRoomFiles(roomName);
          io.to(roomName).emit('files:sync', roomFiles);
          res.status(200).send({ message: 'File uploaded successfully' });
      });
  });

  app.delete('/upload/:roomName/:filename', (req, res) => {
      const { roomName, filename } = req.params;
      const realFilename = `${roomName}---${filename}`;
      const filePath = path.join(uploadDir, realFilename);
      
      if (path.basename(realFilename) !== realFilename) return res.status(400).send("Invalid filename");
      
      if (fs.existsSync(filePath)) {
          try {
              fs.unlinkSync(filePath);
              const roomFiles = getRoomFiles(roomName);
              io.to(roomName).emit('files:sync', roomFiles);
              res.status(200).send({ message: 'Deleted' });
          } catch (err) {
              res.status(500).send('Error deleting file');
          }
      } else {
          res.status(404).send('File not found');
      }
  });

  app.get('/uploads/:roomName/:filename', (req, res) => {
      const { roomName, filename } = req.params;
      const realFilename = `${roomName}---${filename}`;
      const filePath = path.join(uploadDir, realFilename);
      
      if (path.basename(realFilename) !== realFilename) return res.status(400).send("Invalid filename");

      if (fs.existsSync(filePath)) {
          res.download(filePath, filename);
      } else {
          res.status(404).send('File not found');
      }
  });

  // --- DIRECTORY MODE ROUTES (RELAY SYSTEM) ---
  app.post('/api/directory/share', express.json({limit: '50mb'}), (req, res) => {
      try {
          const { roomName, userId, userName, tree } = req.body;
          if (!roomName || !userId || !tree) return res.status(400).send("Missing metadata");

          const room = rooms.get(roomName);
          if(!room) return res.status(404).send("Room not found");

          if (!room.directories) room.directories = {};
          
          room.directories[userId] = {
              userName: userName,
              isOnline: true,
              root: tree
          };
          
          saveDatabase();
          io.to(roomName).emit('directory:sync', room.directories);
          res.json({ success: true });

      } catch (error) {
          console.error("Directory share error:", error);
          res.status(500).send("Server Error");
      }
  });

  app.post('/api/directory/unshare', express.json(), (req, res) => {
      const { roomName, userId } = req.body;
      const room = rooms.get(roomName);
      if(room && room.directories && room.directories[userId]) {
          delete room.directories[userId];
          saveDatabase();
          io.to(roomName).emit('directory:sync', room.directories);
          res.json({ success: true });
      } else {
          res.status(404).send("Not found");
      }
  });

  app.get('/api/directory/download/:roomName/:ownerId/*', (req: Request<{ roomName: string; ownerId: string; '0': string }>, res: Response) => {
      const { roomName, ownerId } = req.params;
      const relPath: string = req.params[0];

      const room = rooms.get(roomName);
      if(!room || !room.directories[ownerId] || !room.directories[ownerId].isOnline) {
          return res.status(404).send("Host is offline or directory not available.");
      }

      const requestId = Math.random().toString(36).substring(7) + Date.now();

      relayRequests.set(requestId, {
          res: res,
          timer: setTimeout(() => {
              if(relayRequests.has(requestId)) {
                  const pending = relayRequests.get(requestId);
                  if (!pending.res.headersSent) pending.res.status(504).send("Host request timeout.");
                  relayRequests.delete(requestId);
              }
          }, 30000)
      });

      res.on('close', () => {
          if (relayRequests.has(requestId)) {
              clearTimeout(relayRequests.get(requestId).timer);
              relayRequests.delete(requestId);
              console.log(`Relay request ${requestId} closed prematurely.`);
          }
      });

      io.to(ownerId).emit('file:request', { requestId, path: relPath });
  });

  app.post('/api/directory/relay/:requestId', (req, res) => {
      const { requestId } = req.params;
      const pending = relayRequests.get(requestId);

      if(!pending) {
          return res.status(404).send("Request ID expired or invalid");
      }

      clearTimeout(pending.timer);

      const filename = req.headers['x-filename'] || 'download';
      
      pending.res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      pending.res.setHeader('Content-Type', 'application/octet-stream');

      req.pipe(pending.res);

      req.on('end', () => {
          relayRequests.delete(requestId);
          res.status(200).send("Relay Complete");
      });

      req.on('error', (e) => {
          console.error("Relay stream error:", e);
          relayRequests.delete(requestId);
          if(!res.headersSent) res.status(500).send("Stream Error");
      });
  });

  // --- SOCKET LOGIC ---
  io.on('connection', (socket: Socket) => {
    socket.on('room:join', ({ name, password, createIfMissing, username }: { name: string; password: string; createIfMissing: boolean; username: string }) => {
      let room = rooms.get(name);
      const finalUsername = username || 'Anon';

      if (!room) {
          if (createIfMissing) {
              room = getInitialRoomState(name, password, finalUsername);
              rooms.set(name, room);
              saveDatabase();
          } else {
              socket.emit('auth:error', 'Room does not exist.');
              return;
          }
      }

      if (room.password !== password) {
          socket.emit('auth:error', 'Invalid Access Key.');
          return;
      }

      socket.join(name);
      
      if (room.directories) {
          Object.keys(room.directories).forEach(key => {
              if (room.directories[key].userName === finalUsername) {
                  delete room.directories[key];
              }
          });
      }

      const isJoiningUserHost = room.host === finalUsername;
      const newUser = { id: socket.id, name: finalUsername, isHost: isJoiningUserHost };

      if (isJoiningUserHost) {
        room.host = finalUsername;
      }
      room.users = room.users.filter((u: User) => u.name !== finalUsername);
      room.users.push(newUser);
      
      saveDatabase(); 
      socketRoomMap.set(socket.id, name);

      socket.emit('auth:success', {
          name: room.name,
          tasks: room.tasks,
          snippets: room.snippets,
          sections: room.sections || [],
          fileSections: room.fileSections || [],
          files: getRoomFiles(name),
          startTime: room.startTime,
          endTime: room.endTime,
          isHost: room.host === finalUsername,
          password: room.password, 
          users: room.users,
          directories: room.directories || {},
          editorFiles: room.editorFiles || [],
          encryptionEnabled: room.encryptionEnabled ?? true
      });

      socket.emit('chat:sync', room.chatHistory || []);

      io.to(name).emit('users:sync', room.users);
      io.to(name).emit('directory:sync', room.directories || {});
      io.to(name).emit('editor:sync', room.editorFiles || []);
      io.to(name).emit('room:encryptionToggled', room.encryptionEnabled ?? true);
    });

    socket.on('room:toggleEncryption', (enabled: boolean) => {
        const roomName = socketRoomMap.get(socket.id);
        if (roomName) {
            const room = rooms.get(roomName);
            if (room) {
                // Only host should toggle? For now, let's allow any user or check host.
                // The user request didn't specify, but settings usually imply host.
                // Let's check if the user is host.
                const user = room.users.find((u: User) => u.id === socket.id);
                if (user && user.isHost) {
                    room.encryptionEnabled = enabled;
                    saveDatabase();
                    io.to(roomName).emit('room:encryptionToggled', enabled);
                }
            }
        }
    });

    socket.on('directory:request-sync', ({ roomName, targetUserId }) => {
        const room = rooms.get(roomName);
        if (room && room.directories[targetUserId]) {
            const hostSocket = io.sockets.sockets.get(targetUserId);
            if (hostSocket) {
                console.log(`Relaying sync request to ${targetUserId} for room ${roomName}`);
                hostSocket.emit('directory:resync-request');
            }
        }
    });

    socket.on('editor:save', ({ roomName, documentId }) => {
        const room = rooms.get(roomName);
        if (room) {
            // Force save immediately
            saveDatabase();
            console.log(`[Editor] Manual save triggered for room ${roomName}, doc ${documentId}`);
        }
    });

    socket.on('disconnect', () => {
        const roomName = socketRoomMap.get(socket.id);
        if (roomName && rooms.has(roomName)) {
            const room = rooms.get(roomName);
            room.users = room.users.filter((u: User) => u.id !== socket.id);
            
            if (room.directories && room.directories[socket.id]) {
                delete room.directories[socket.id];
                io.to(roomName).emit('directory:sync', room.directories);
            }

            saveDatabase(); 
            io.to(roomName).emit('users:sync', room.users);
            socketRoomMap.delete(socket.id);
        }
    });

    socket.on('task:update', ({ roomName, tasks }) => {
        if (rooms.has(roomName)) {
            rooms.get(roomName).tasks = tasks;
            saveDatabase();
            io.to(roomName).emit('task:sync', tasks);
        }
    });

    socket.on('snippet:update', ({ roomName, snippets }) => {
        if (rooms.has(roomName)) {
            rooms.get(roomName).snippets = snippets;
            saveDatabase();
            io.to(roomName).emit('snippet:sync', snippets);
        }
    });

    socket.on('section:update', ({ roomName, sections }) => {
        if (rooms.has(roomName)) {
            rooms.get(roomName).sections = sections;
            saveDatabase();
            io.to(roomName).emit('section:sync', sections);
        }
    });

    socket.on('fileSection:update', ({ roomName, sections }) => {
        if (rooms.has(roomName)) {
            rooms.get(roomName).fileSections = sections;
            saveDatabase();
            io.to(roomName).emit('fileSection:sync', sections);
        }
    });

    socket.on('timer:update', ({ roomName, endTime }) => {
        if (rooms.has(roomName)) {
            rooms.get(roomName).endTime = endTime;
            saveDatabase();
            io.to(roomName).emit('timer:sync', endTime);
        }
    });

    socket.on('timer:updateStart', ({ roomName, startTime }) => {
        if (rooms.has(roomName)) {
            rooms.get(roomName).startTime = startTime;
            saveDatabase();
            io.to(roomName).emit('timer:syncStart', startTime);
        }
    });

    socket.on('room:updatePassword', ({ roomName, newPassword }) => {
        if (rooms.has(roomName)) {
            const room = rooms.get(roomName);
            room.password = newPassword;
            saveDatabase();
            io.to(roomName).emit('auth:passwordUpdated', newPassword);
        }
    });

    socket.on('chat:send', ({ roomName, message }) => {
        if (rooms.has(roomName)) {
            const room = rooms.get(roomName);
            if (!room.chatHistory) room.chatHistory = [];
            room.chatHistory.push(message);
            // Limit history to last 100 messages
            if (room.chatHistory.length > 100) {
                room.chatHistory.shift();
            }
            saveDatabase();
            io.to(roomName).emit('chat:message', message);
        }
    });

    // --- EDITOR FILE OPERATIONS ---
    socket.on('editor:create', ({ roomName, node }: { roomName: string; node: EditorNode }) => {
        if (!rooms.has(roomName)) return;
        
        // Node comes from frontend with a temporary ID and structure
        // We need to translate this to FS operations
        
        // Construct path
        // parentId is the relative path of the parent folder
        const parentPath = node.parentId || '';
        const fullPath = path.join(PROJECTS_DIR, roomName, parentPath, node.name);
        
        try {
            if (node.type === 'directory') {
                if (!fs.existsSync(fullPath)) {
                    fs.mkdirSync(fullPath, { recursive: true });
                }
            } else {
                if (!fs.existsSync(fullPath)) {
                    fs.writeFileSync(fullPath, node.content || '');
                }
            }
            
            // Re-scan and sync
            const files = getFileTree(roomName);
            const room = rooms.get(roomName);
            room.editorFiles = files; // Update memory cache
            io.to(roomName).emit('editor:sync', files);
            
        } catch (e) {
            console.error("Error creating file/folder:", e);
            socket.emit('error', 'Failed to create file/folder');
        }
    });

    socket.on('editor:delete', ({ roomName, nodeId }: { roomName: string; nodeId: string }) => {
        if (!rooms.has(roomName)) return;
        
        // nodeId is the relative path
        const fullPath = path.join(PROJECTS_DIR, roomName, nodeId);
        
        try {
            if (fs.existsSync(fullPath)) {
                fs.rmSync(fullPath, { recursive: true, force: true });
            }
            
            // Re-scan and sync
            const files = getFileTree(roomName);
            const room = rooms.get(roomName);
            room.editorFiles = files;
            io.to(roomName).emit('editor:sync', files);
        } catch (e) {
            console.error("Error deleting file/folder:", e);
        }
    });

    socket.on('editor:rename', ({ roomName, nodeId, newName }: { roomName: string; nodeId: string; newName: string }) => {
        if (!rooms.has(roomName)) return;
        
        const oldPath = path.join(PROJECTS_DIR, roomName, nodeId);
        const dir = path.dirname(oldPath);
        const newPath = path.join(dir, newName);
        
        try {
            if (fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, newPath);
            }
            
            // Re-scan and sync
            const files = getFileTree(roomName);
            const room = rooms.get(roomName);
            room.editorFiles = files;
            io.to(roomName).emit('editor:sync', files);
        } catch (e) {
            console.error("Error renaming file/folder:", e);
        }
    });
  });

  // --- STATIC FILE SERVING ---
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      // Let API routes pass through
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads') || req.path === '/upload') {
          return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const getLocalIpAddresses = (): string[] => {
    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];
    addresses.push('127.0.0.1');
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push(iface.address);
        }
      }
    }
    return Array.from(new Set(addresses));
  };

  const PORT = parseInt(process.env.PORT || '3000', 10);
  server.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIpAddresses();
    console.log(`\n✅ SYNAPSE SERVER RUNNING`);
    ips.forEach(ip => console.log(`👉 http://${ip}:${PORT}`));
    console.log(`\n`);
  });
}

startServer().catch(console.error);