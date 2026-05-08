# CleanFlow AI

AI-assisted workspace for cleaning, validating, and standardizing messy enterprise datasets.

---

## Overview

CleanFlow AI is a modern SaaS-style frontend application designed to help users identify, review, and resolve data quality issues in uploaded datasets.

The platform focuses on human-in-the-loop data cleaning workflows where AI-generated suggestions are surfaced to users for approval, rejection, and validation before export.

The project emphasizes:
- enterprise-grade frontend architecture
- scalable UI patterns
- asynchronous workflow handling
- modern React ecosystem practices
- production-oriented UX design

---

## Core Features

### Dataset Upload
- CSV/Excel upload workflow
- drag-and-drop file support
- upload progress states
- validation and error handling

### Data Preview Workspace
- interactive dataset table
- sorting and filtering
- inline editing
- pagination support
- validation highlighting
- sticky columns

### AI-Assisted Cleaning
- invalid format detection
- duplicate row identification
- missing value detection
- standardization suggestions
- anomaly summaries
- confidence scoring

### Human-in-the-Loop Review
- approve/reject suggestions
- side-by-side comparisons
- undo support
- activity timeline

### Product Experience
- responsive layout
- dark/light mode
- loading skeletons
- optimistic UI updates
- graceful async handling

---

## Tech Stack

### Frontend
- React
- Next.js (App Router)
- TypeScript

### UI
- Tailwind CSS
- shadcn/ui

### State & Data Management
- Zustand
- TanStack Query

### Forms & Validation
- React Hook Form
- Zod

### Data Visualization
- Recharts

### AI Integration
- OpenAI API

### Deployment
- Vercel

---

## Architecture

The application follows a modular frontend architecture focused on maintainability, scalability, and feature isolation.

### Key Architectural Decisions
- feature-based folder structure
- reusable UI component system
- centralized client state management
- isolated async server state handling
- strongly typed data models
- composable workflow-driven UI

### Folder Structure

```txt
src/
  app/
  components/
  features/
  hooks/
  services/
  store/
  types/
  lib/
```

---

## Product Goals

This project was designed to simulate a realistic enterprise SaaS workflow rather than a tutorial-style CRUD application.

Primary goals:
- build production-quality frontend workflows
- demonstrate enterprise data UI patterns
- showcase modern React architecture
- integrate practical AI-assisted UX
- focus on maintainable and scalable design

---

## Screenshots

> Screenshots and workflow demos will be added as features are completed.

Planned captures:
- upload workflow
- dataset preview grid
- AI suggestion panel
- validation highlighting
- responsive layouts

---

## Future Enhancements

- real-time collaborative editing
- advanced anomaly detection
- dataset version history
- export audit logs
- role-based access control
- workflow templates
- batch cleaning operations

---

## Local Development

### Clone Repository

```bash
git clone https://github.com/<your-username>/cleanflow-ai.git
```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

---

## Deployment

The application is designed for deployment on:

- Vercel

---

## Engineering Focus Areas

This project intentionally emphasizes:
- frontend system design
- enterprise UX workflows
- asynchronous state management
- reusable architecture
- maintainable component composition
- realistic SaaS product thinking

---

## Status

Currently in active development.

Initial milestone includes:
- foundational SaaS layout
- upload workflow
- dataset preview table
- AI suggestion review system
- responsive UI architecture

---

## License

MIT
