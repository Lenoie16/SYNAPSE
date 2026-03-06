<div align="center">

# SYNAPSE

Real-time collaboration workspace for teams and developers.

</div>

---

## Overview

This repository contains everything required to run the **Synapse collaboration platform** locally.

The application allows multiple users on the same network to collaborate in real time using shared rooms.

> ⚠️ Make sure port **3000** is available before starting the application.

If needed, you can change the port inside:

- `vite.config.js`
- `server.ts`

The application can also work through **port forwarding or tunneling** if remote access is required.

---

## Requirements

Before running the application, install:

- **Node.js** (https://nodejs.org)

---

## Run the Application

1. Download or clone this repository.
2. Ensure **Node.js is installed**.
3. Double-click:[start.bat](start.bat)

  
The script will automatically:

- Install dependencies (`npm install`)
- Start the server (`npm start server`)

---

## Network Requirement

For real-time collaboration:

- All users must be connected to the **same network (LAN / WiFi)**  
- Or the host must expose the server using **port forwarding or tunneling**

---

## Documentation

- 📌 [Features](FEATURES.md)
- 📘 [User Manual](User_Manual.md)

---

## Notes

- Ensure **port 3000 is free** before starting the application.
- If another application is using port 3000, update the port in:
  - `vite.config.js`
  - `server.ts`

---

**Good luck and happy collaborating 🚀**
3. Ensure **Node.js is installed**.
4. Double-click:
