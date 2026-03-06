# 🚀 SYNAPSE – Feature Overview

SYNAPSE is a real-time collaboration platform designed for developers to code, organize tasks, and share files together inside secure collaborative rooms.

---

# 1. Real-Time Room System

### What it does

* **Instant Workspaces** – Create or join rooms instantly using a room name and password. No account required.
* **Host Authority** – The room creator becomes the Host and can manage users, change passwords, and control encryption.
* **Live Presence** – Displays all active users currently in the room.

### How it works

* **Socket.io** manages real-time communication between users.
* The server maintains a **Map of room states** including users, tasks, and settings.
* When a user joins, the server sends the current room state (`auth:success` event).
* Updates are synchronized through events like `users:sync`.
* Room state is stored in a local JSON database (`synapse.db.json`) to survive server restarts.

---

# 2. Collaborative Code Editor

### What it does

* **Multi-User Editing** – Multiple developers can edit files simultaneously.
* **File Management** – Create, rename, delete files and folders.
* **Syntax Highlighting** – Supports JavaScript, TypeScript, Python, HTML, CSS, JSON, and Markdown.
* **Project Download** – Entire project can be downloaded as a `.zip`.

### How it works

* **Yjs CRDTs** ensure conflict-free real-time collaboration.
* **Monaco Editor** powers the code editing interface (same engine as VS Code).
* A dedicated **WebSocket server (`/yjs`)** handles document updates.
* Files are synced and saved to disk in `projects/{roomName}/`.

---

# 3. Kanban Task Board

### What it does

* Drag-and-drop task board with columns:

  * **To Do**
  * **In Progress**
  * **Done**
* Tasks can be marked with **Low, Medium, or High priority**.
* Quick entry field allows rapid task creation.

### How it works

* The board state is stored as an array of `Task` objects.
* When a task changes, the client sends a `task:update` event.
* The server broadcasts the updated list via `task:sync`.
* Uses the **HTML5 Drag & Drop API** for interaction.

---

# 4. Secure File Sharing

### What it does

* **Encrypted File Uploads** – Files are encrypted before leaving the browser.
* **Drag & Drop Uploads** for quick sharing.
* **AI Analysis** for text files.

### How it works

* Uses the **Web Crypto API** (`AES-GCM`) for client-side encryption.
* Files are uploaded via `XMLHttpRequest` to the `/upload` endpoint.
* The server stores **encrypted blobs** in an `uploads/` directory.
* Files are decrypted locally in the browser when downloaded.

---

# 5. Snippet Vault

### What it does

* Store reusable **code snippets, configs, and notes**.
* Organize snippets with tags and sections.
* AI tools can categorize snippets or detect bugs.

### How it works

* Snippets sync using socket events (`snippet:update`).
* Optional **client-side encryption** for snippet content.
* **Gemini AI API** can analyze and categorize snippets.

---

# 6. Peer-to-Peer Directory Relay

### What it does

* Share a folder directly from your local computer.
* Files remain on the host machine — no permanent cloud storage.
* Other users can access files on demand.

### How it works

1. A requester asks the server for a file.
2. The server requests it from the host client via Socket.io.
3. The host streams the file to the server.
4. The server forwards the stream to the requester.

Uses the **File System Access API** (`showDirectoryPicker()`).

---

# 7. Encryption Toggle

### What it does

* Host can switch between **Security Mode** and **Performance Mode**.

**Encryption ON**

* Files, snippets, and messages are encrypted.
* Higher security.

**Encryption OFF**

* Plaintext transfers.
* Faster performance.

### How it works

* The server stores `encryptionEnabled` in room state.
* The client checks this flag before sending data.
* Encrypted items remain readable even if encryption is later disabled.

---

# 8. Pressure Meter & Timer

### What it does

* Shared countdown timer for deadlines.
* Visual pressure indicator showing progress vs time remaining.

### How it works

Each client calculates a **Pressure Score**:

Pressure Score =
(Time Elapsed % × 0.5) + (Unfinished Tasks % × 0.5)

The host can update timer values which are broadcast to all users.

---

# 9. Admin Dashboard

### What it does

* Monitor server uptime, CPU usage, memory usage.
* Track active rooms and users.
* Force delete rooms or inspect metadata.

### How it works

* **JWT authentication** protects admin routes.
* Admin logs in through `/api/admin/login`.
* Protected APIs like `/api/stats` require a valid token.
* Server metrics are gathered using Node.js `os` and `process` modules.

---

# 🧠 Summary

SYNAPSE combines:

* Real-time collaboration
* Live coding environments
* Secure encrypted file sharing
* Task management
* Peer-to-peer file relay
* AI-assisted development tools

All inside a single collaborative workspace.

