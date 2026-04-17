# AI-Native Task Tracker (Tauri 2.0 + React)

A local-first, high-performance task tracking application built using **Vibe Coding** principles. This project explores the synergy between a Senior Architect's structural oversight and LLM-driven implementation autonomy.

This is a personal project through which I am experimenting with vibe coding and understanding how best I work with it.

---

## First Time Vibe Coding

This repository serves as a showcase and experience for **Vibe Coding**—a development workflow where the human acts as the *Architect & Pilot*, and the AI acts as the *Engine*. 

Unlike traditional development, this repo is optimized for **AI Context Persistence**. It uses a trio of "Meta-Context" files to ensure any LLM (Cursor, Windsurf, etc.) can pick up the project with zero "hallucination debt":

- **[`CURSOR_PLAN.md`](./CURSOR_PLAN.md)**: The architectural source of truth and roadmap.
- **[`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md)**: A chronological record of progress and session briefs.
- **[`DEVELOPMENT_ISSUES_LOG.md`](./DEVELOPMENT_ISSUES_LOG.md)**: A log of technical hurdles, regressions, and their specific fixes.

---

## Tech Stack Used

- **Framework**: [Tauri 2.0](https://v2.tauri.app/) (Rust-based Desktop Core)
- **Frontend**: React 18 + Vite
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/blog/tailwindcss-v4-alpha) (Engineered for modern CSS-first workflows)
- **Database**: Local MySQL via `tauri-plugin-sql`
- **Security**: `tauri-plugin-stronghold` (Symmetric encryption for local credentials)
- **State Management**: Zustand & React Query

---

## Key Features (Current & Planned)

- [x] **Secure Onboarding**: Encrypted DB credential storage using Stronghold.
- [x] **The Grid**: A 10-day tabular view of tasks with strict date normalization.
- [ ] **Soft-Freeze Logic**: Data from previous days is frozen to prevent accidental edits, with a "catch-up" mechanism for missing entries.
- [ ] **Desktop Widget**: A frameless, secondary window for quick progress updates, synced via a global Tauri Event Bus.
- [ ] **Omni-Search**: `Cmd+K` interface to search through active and soft-deleted task history.

---

## Setup for AI Agents

If you are an AI agent (Cursor, Windsurf, etc.) opening this project:
1. **Read the Docs**: Start with `CURSOR_PLAN.md` to understand the rules of the road.
2. **Check the Log**: Review `DEVELOPMENT_LOG.md` to see the current state of implementation.
3. **Respect `.cursorignore`**: This file ensures you don't get bogged down in build artifacts or sensitive local secrets.

---

## Security Notice

This application uses a local MySQL instance. Credentials entered in the Settings page are stored in an encrypted **Stronghold** database locally on your machine. This project does not currently send your task data to any external servers.



