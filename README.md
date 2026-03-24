<div align="center">

# 🚀 SYNAPSE

### Real-Time Collaboration Platform for Developers

Live coding • Task management • Secure file sharing • AI assistance

</div>

---

## 📌 Overview

**Synapse** is a real-time collaboration platform designed for developers, hackathon teams, and rapid prototyping environments.

It combines multiple tools into a **single collaborative workspace**, allowing teams to:

* Write code together in real time
* Manage tasks using a Kanban board
* Share encrypted files
* Store reusable code snippets
* Communicate instantly
* Track project pressure and deadlines

---

## ✨ Core Features

* 🧑‍💻 **Collaborative Code Editor** – Multi-user live coding powered by Monaco Editor
* 📋 **Kanban Task Board** – Track tasks with drag-and-drop workflow
* 📁 **Secure File Sharing** – Upload and download encrypted files
* 🧠 **AI Integration** – Analyze snippets and files using Gemini AI
* 🔐 **Encryption Mode** – Optional client-side encryption for data security
* 📂 **Live Directory Sharing** – Stream files directly from a user's computer
* 💬 **Built-in Chat** – Real-time messaging inside collaboration rooms
* ⏱ **Timer & Pressure Meter** – Monitor project deadlines and progress

👉 Full feature list:
[Features Documentation](FEATURES.md)

---

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

* **Node.js**
* Modern browser (Chrome / Edge recommended)

Download Node.js:
https://nodejs.org

---

## ▶️ Run the Application

1. Clone or download the repository

2. Ensure **Node.js is installed**

3. Double click:

```
Start.bat
```

This script will automatically:

* Install dependencies
* Start the Synapse server

---

## 🌐 Network Requirements

For collaboration to work:

* All users must be connected to the **same LAN / WiFi network**

OR

* Use **port forwarding or tunneling** to expose the server.

---

## 📚 Documentation

| Document                      | Description                      |
| ----------------------------- | -------------------------------- |
| [Features](FEATURES.md)       | Full technical feature breakdown |
| [User Manual](User_Manual.md) | Guide for using the platform     |

---

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

* Yjs CRDT

Security

* Web Crypto API (AES-GCM encryption)

AI Integration

* Google Gemini API

---

## 📊 Project Goals

Synapse aims to provide:

* A **lightweight alternative to complex collaboration tools**
* A **secure real-time development environment**
* A platform optimized for **hackathons and team coding sessions**

---



## ⭐ Support

If you find this project useful, consider giving the repository a **star ⭐**.

known issues - code editor error in low network
               mobile UI is flikering
will be solved shortly


Admin Console - Username and password - admin1
