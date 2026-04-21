# Changelog

All notable changes to SYNAPSE will be documented here.

---

## [Unreleased]

### Added
- `.gitignore` to exclude `node_modules`, `dist`, `.env`, `synapse.db.json`, `uploads/`, and `projects/` from version control
- `.env.example` template so contributors know what environment variables are required
- `.gitkeep` files to preserve `uploads/` and `projects/` directory structure in the repo
- CHANGELOG.md (this file)

### Fixed
- Removed hardcoded admin credentials from `README.md`

### Security
- Ensured `.env` (containing JWT and session secrets) is never committed
- Ensured `synapse.db.json` (containing room passwords) is never committed

---

## [1.0.0] – Initial Release

### Added
- Real-time collaborative code editor (Monaco + Yjs CRDTs)
- Kanban task board with drag-and-drop and priority levels
- Secure file sharing with AES-GCM client-side encryption
- Built-in chat per collaboration room
- Snippet Vault for storing reusable code
- Live directory browser for streaming local files
- Whiteboard canvas (Konva)
- Timer and Pressure Meter for hackathon sessions
- AI-powered file/snippet analysis via Google Gemini
- Admin dashboard for room and user management
- Room-based authentication with host authority
- Socket.io-powered real-time sync
- Boilerplate generator