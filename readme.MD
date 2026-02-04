# Terencio POS Desktop

Terencio POS is a simple Electron + React + SQLite desktop application built in a **pnpm monorepo**.

It includes:

* **Electron backend** (`apps/pos-desktop/electron`)
* **React UI (Vite)** (`apps/pos-desktop/ui`)
* **SQLite database** using `better-sqlite3`
* Packaging via **electron-builder**

---

## ✅ Requirements

Make sure you have installed:

* **Node.js** (>= 18)
* **pnpm**

Install pnpm globally if needed:

```bash
npm install -g pnpm
```

---

## 📦 Install Dependencies

From the root of the monorepo:

```bash
pnpm install
```

---

## 🚀 Run in Development Mode

This will start:

* React UI on **[http://localhost:3000](http://localhost:3000)**
* Electron app connected to it

Run:

```bash
pnpm dev
```

---

## 🏗 Build the Application

To build all packages (domain + UI + electron):

```bash
pnpm build
```

Outputs:

* `apps/pos-desktop/ui/dist`
* `apps/pos-desktop/electron/dist`

---

## 📦 Create a Distributable Installer

To package the app for your OS:

```bash
pnpm dist
```

This will:

1. Clean old builds
2. Build UI + Electron
3. Run `electron-builder`

Final installer will be inside:

```
release/
```

Targets:

* Windows → NSIS installer
* macOS → DMG
* Linux → AppImage

---

## 🗄 Database

On startup, Electron automatically:

* Creates a SQLite database in the user data folder
* Applies schema from:

```
database/schema/schema.sql
```

Database file location:

```
<userData>/terencio.sqlite
```

---

## ✅ Project Structure

```
apps/
  pos-desktop/
    electron/   # Electron main process
    ui/         # React frontend
packages/
  domain/       # Shared constants

database/
  schema/       # SQLite schema
```

---

## 🧪 Example UI

When running, you should see:

```
Hello World 👋
Terencio POS – UI ready
```

---

## 📌 Useful Commands

| Command      | Description                   |
| ------------ | ----------------------------- |
| `pnpm dev`   | Start app in development      |
| `pnpm build` | Build all packages            |
| `pnpm dist`  | Package installer             |
| `pnpm clean` | Remove dist + release folders |

---

## ✅ Done!

You now have a working Electron + React + SQLite desktop POS starter.
