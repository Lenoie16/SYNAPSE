<div align="center">

# SYNAPSE
# 🚀 SYNAPSE

Real-time collaboration workspace for teams and developers.
### Real-Time Collaboration Platform for Developers

Live coding • Task management • Secure file sharing • AI assistance

</div>

---

## Overview
## 📌 Overview

**Synapse** is a real-time collaboration platform designed for developers, hackathon teams, and rapid prototyping environments.

This repository contains everything required to run the **Synapse collaboration platform** locally.
It combines multiple tools into a **single collaborative workspace**, allowing teams to:

The application allows multiple users on the same network to collaborate in real time using shared rooms.
* Write code together in real time
* Manage tasks using a Kanban board
* Share encrypted files
* Store reusable code snippets
* Communicate instantly
* Track project pressure and deadlines

> ⚠️ Make sure port **3000** is available before starting the application.
---

If needed, you can change the port inside:
## ✨ Core Features

- `vite.config.js`
- `server.ts`
* 🧑‍💻 **Collaborative Code Editor** – Multi-user live coding powered by Monaco Editor
* 📋 **Kanban Task Board** – Track tasks with drag-and-drop workflow
* 📁 **Secure File Sharing** – Upload and download encrypted files
* 🧠 **AI Integration** – Analyze snippets and files using Gemini AI
* 🔐 **Encryption Mode** – Optional client-side encryption for data security
* 📂 **Live Directory Sharing** – Stream files directly from a user's computer
* 💬 **Built-in Chat** – Real-time messaging inside collaboration rooms
* ⏱ **Timer & Pressure Meter** – Monitor project deadlines and progress

The application can also work through **port forwarding or tunneling** if remote access is required.
👉 Full feature list:
[Features Documentation](Features.md)

---

## Requirements
## 🖼 System Architecture

```
Client (React + Monaco Editor)
        │
        │ WebSockets
        ▼
Node.js Server (Socket.io)
        │
        ├── Room State Manager
        ├── Task Sync Engine
        ├── Snippet Storage
        ├── File Upload System
        └── Admin Dashboard
```

---

## ⚙️ Requirements

Before running the application, install:

- **Node.js** (https://nodejs.org)
* **Node.js**
* Modern browser (Chrome / Edge recommended)

Download Node.js:
https://nodejs.org

---

## Run the Application
## ▶️ Run the Application

1. Download or clone this repository.
2. Ensure **Node.js is installed**.
3. Double-click: [start.bat](start.bat) file 
1. Clone or download the repository

  
The script will automatically:
2. Ensure **Node.js is installed**

- Install dependencies (`npm install`)
- Start the server (`npm start server`)
3. Double click:

```
Start.bat
```

This script will automatically:

* Install dependencies
* Start the Synapse server

---

## Network Requirement
## 🌐 Network Requirements

For collaboration to work:

* All users must be connected to the **same LAN / WiFi network**

OR

* Use **port forwarding or tunneling** to expose the server.

For real-time collaboration:
---

## 📚 Documentation

- All users must be connected to the **same network (LAN / WiFi)**  
- Or the host must expose the server using **port forwarding or tunneling**
| Document                      | Description                      |
| ----------------------------- | -------------------------------- |
| [Features](Features.md)       | Full technical feature breakdown |
| [User Manual](User_Manual.md) | Guide for using the platform     |

---

## Documentation
## 🛠 Technology Stack

Frontend

* React
* TypeScript
* Monaco Editor
* TailwindCSS

Backend

* Node.js
* Express
* Socket.io
* WebSockets

Collaboration Engine

- 📌 [Features](Features.md)
- 📘 [User Manual](User_Manual.md)
* Yjs CRDT

Security

* Web Crypto API (AES-GCM encryption)

AI Integration

* Google Gemini API

---

## Notes
## 📊 Project Goals

- Ensure **port 3000 is free** before starting the application.
- If another application is using port 3000, update the port in:
  - `vite.config.js`
  - `server.ts`
Synapse aims to provide:

* A **lightweight alternative to complex collaboration tools**
* A **secure real-time development environment**
* A platform optimized for **hackathons and team coding sessions**

---

**Good luck and happy collaborating 🚀**


## ⭐ Support

If you find this project useful, consider giving the repository a **star ⭐**.