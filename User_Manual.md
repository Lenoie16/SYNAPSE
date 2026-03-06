# 📘 Synapse User Manual

## Table of Contents

1. Introduction
2. Getting Started
3. Interface Overview
4. Core Features
5. Host Controls & Settings
6. Advanced Features
7. Troubleshooting

---

# 1. Introduction

**Synapse** is a real-time collaboration platform designed for developers, hackathon teams, and rapid prototyping.

It combines:

* Task management
* Collaborative coding
* Secure file sharing
* Live communication
* AI-powered tools

All inside a **single real-time workspace**.

---

# 2. Getting Started

## Creating a Room

1. Open Synapse in your browser.
2. Enter a **Username**.
3. Enter a **Room Name**.
4. Create a **Room Password**.
5. Click **Initialize Protocol / Join**.

If the room does not exist, you automatically become the **Host**.

---

## Joining a Room

1. Enter your **Username**.
2. Enter the **Room Name**.
3. Enter the **Room Password**.
4. Click **Join**.

You will join the workspace as a **Member**.

---

# 3. Interface Overview

### Top Bar

Displays:

* Room name
* User status
* Connection status
* Timer
* Theme toggle

### Main Workspace

The central working area where you switch between tools.

### Bottom Navigation

A dock-like navigation bar for switching between tools.

### Right Sidebar

Displays:

* Pressure Meter
* Chat
* Room diagnostics

---

# 4. Core Features

## Kanban Board (Task Management)

Track project progress using task cards.

### Add Task

Type in the task input bar and press **Enter**.

### Set Priority

Choose:

* Low
* Medium
* High

### Move Task

Drag tasks between:

* **To Do**
* **In Progress**
* **Done**

### Delete Task

Click **X** on a task card.

---

## Collaborative Code Editor

Edit code in real time with your team.

### File Management

* Create files or folders
* Rename items
* Delete items

### Editing

Click a file to open it.

Multiple users can **type simultaneously**.

### Save

Files are **auto-saved**.

Manual save shortcut:

```
Ctrl + S
```

### Download Project

Click **Download ZIP** to export the entire project.

---

## Snippet Vault

Store reusable code blocks.

### Create Snippet

1. Click **New Snippet**
2. Enter title
3. Select language
4. Paste code

### AI Analyze

Click the **✨ Sparkle icon** to analyze the snippet using AI.

### Copy

Click **Copy** to copy code to clipboard.

---

## File Browser

Secure file sharing inside the room.

### Upload

Drag and drop files or click to select.

### Download

Click the download icon.

### Delete

Host can delete files using the trash icon.

### Encryption

If enabled by the Host:

* Files are encrypted **before upload**
* Server never sees the plaintext file

---

## Directory Sharing (Live Sync)

Share folders directly from your computer.

### Share Folder

Click **Share Live Directory** and select a folder.

### Access

Other users can open files directly from your computer.

[don't share directories with huge structure might end up crashing the browser since there is no upper limit for uploads]

### Stop Sharing

Click **Clear All Shared**.

---

## Chat & Communication

### Send Message

Type in the chat box and press **Enter**.

### Encryption

Messages are encrypted when **Encryption Mode** is enabled.

---

# 5. Host Controls & Settings

Open **Settings (⚙ Gear icon)**.

---

## Managing Users

### Kick User

1. Open **Active Units**
2. Hover on user
3. Click **KICK**

---

## Room Security (Encryption)

### Update Password

Change the room password at any time.

Existing users stay connected.

### Encryption Mode

**ENABLED (Default)**

* Chat encrypted
* Snippets encrypted
* Files encrypted

Higher security but slower.

**DISABLED**

* Plain text transfer
* Faster file sharing

---

## Timer & Pressure Meter

### Set Timer

Configure:

* Start Time
* End Time

### Pressure Meter

Shows project progress.

| Color  | Meaning           |
| ------ | ----------------- |
| Green  | Healthy progress  |
| Yellow | Falling behind    |
| Red    | Critical pressure |

---

# 6. Advanced Features

## AI Integration (Gemini)

### Setup

1. Open **Settings**
2. Go to **AI Configuration**
3. Enter your **Gemini API Key**

### Usage

**Snippets**

Click **Sparkle icon** to analyze code.

**Files**

Click **Analyze** to summarize text files.

---

## Admin Dashboard

Used by the **server administrator**.

### Access

Navigate to:

```
/admin
```

### Features

* View CPU and memory usage
* Monitor active rooms
* Force delete rooms

---

# 7. Troubleshooting

### Connection Lost

Check internet connection. Synapse will try to reconnect automatically.

---

### Decryption Failed

Usually happens if the **Room Password changed**.

Solution:

* Refresh the page
* Rejoin using the new password

---

### File Upload Failed

Large files may take time to upload and download on slow connections.

Possible solutions:

* Disable encryption
* Upload smaller files

---

### Directory Sharing Not Working

Requirements:

* Chrome or Edge browser
* Desktop device (not mobile)
* Folder permissions granted