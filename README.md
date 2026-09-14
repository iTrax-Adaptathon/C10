# ⚡ Replan — Dynamic Schedule Adaptation & Conflict Optimization System

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8.svg)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Replan** is an intelligent, full-stack schedule adaptation platform that dynamically recalculates schedules when unexpected disruptions, urgent tasks, or shifting deadlines occur. Built on a deterministic dependency graph engine and a multi-strategy trade-off optimization solver, Replan eliminates calendar chaos without sacrificing work-life balance.

---

## ✨ Key Features

- 🧠 **Deterministic Schedule Engine**:
  Computes optimal task placement using topological dependency sorting, interval packing, and availability constraint satisfaction (`backend/scheduler.py`).

- ⚖️ **3-Strategy Trade-Off Studio**:
  Interactively evaluate and apply three optimized schedule adaptation strategies:
  1. **Protect Deadlines**: Strictly prioritizes hard deadlines and minimizes late deliveries.
  2. **Balance Workload**: Distributes tasks evenly across available days to prevent burnout and leave buffers.
  3. **Protect Preferences**: Respects preferred working hours, deep work slots, and personal time constraints.

- 💬 **Natural Language Task & Event Parsing**:
  Type fluid instructions like *"Emergency bug fix tomorrow at 2pm for 90 minutes priority high"* and get instant NLP entity extraction (`backend/nlp.py`).

- 📊 **Schedule Health & Impact Analysis**:
  Provides a real-time health score across 4 key vectors: *Deadline Safety*, *Conflict-Free*, *Workload Balance*, and *Preference Fulfillment*. Generates detailed disruption impact trees before committing schedule changes (`backend/impact.py`).

- 🎯 **Dual Task Views (List & Eisenhower Matrix)**:
  Organize tasks through a clean list interface or an interactive 4-quadrant Eisenhower Matrix (*Do First*, *Schedule*, *Delegate*, *Eliminate*).

- ⚡ **Global Command Palette (`⌘K` / `Ctrl+K`)**:
  Quickly search navigation routes, launch actions, trigger dynamic replanning, or create tasks from anywhere in the application.

- 🎨 **Minimalist Light Design System**:
  Clean white container layout (`slate-50` background, custom indigo accents, slate borders) with a perfectly aligned responsive top bar and mobile navigation.

---

## 🏗️ System Architecture

```
replan/
├── backend/                  # Python FastAPI Backend
│   ├── main.py               # REST API endpoints & route handlers
│   ├── scheduler.py          # Topological scheduling & constraint engine
│   ├── impact.py             # Dependency graph disruption & ripple effect analysis
│   ├── nlp.py                # Natural language parsing engine
│   ├── database.py           # In-memory / persistent data store & demo seeding
│   ├── models.py             # Pydantic data schemas & TypeScript interfaces
│   └── requirements.txt      # Python dependencies
│
└── frontend/                 # React + TypeScript + Tailwind CSS Frontend
    ├── src/
    │   ├── api/              # Axios HTTP client & API service wrappers
    │   ├── components/       # Reusable UI components (Navbar, QuickAdd, CommandBar, etc.)
    │   ├── pages/            # Page views (Dashboard, Schedule, Tasks, Impact Studio, etc.)
    │   ├── types/            # TypeScript type declarations
    │   ├── App.tsx           # App root & navigation router
    │   └── index.css         # Tailwind directives & CSS design tokens
    └── package.json          # Frontend dependencies & build scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Python**: v3.10 or higher

---

### 1. Backend Setup (FastAPI)

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend will run at `http://localhost:8000` with interactive API docs at `http://localhost:8000/docs`.*

---

### 2. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The web app will open at `http://localhost:5173` (or the port specified in terminal).*

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Retrieves current overall schedule health score metrics |
| `GET` | `/api/events` | Fetches all scheduled events |
| `POST` | `/api/events` | Creates a new scheduled event |
| `DELETE` | `/api/events/{id}` | Deletes an event by ID |
| `GET` | `/api/tasks` | Fetches all pending & completed tasks |
| `POST` | `/api/tasks` | Creates a new task |
| `POST` | `/api/nlp/parse` | Parses natural language input into task/event properties |
| `POST` | `/api/impact` | Calculates dependency disruption impact for a proposed task/event |
| `POST` | `/api/replan` | Runs the scheduling solver and returns 3 strategy proposals |

---

## 🛠️ Built With

- **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), [Vite](https://vitejs.dev/)
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), [Pydantic](https://docs.pydantic.dev/), [Uvicorn](https://www.uvicorn.org/)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.