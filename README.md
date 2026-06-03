# CleanFlow AI

  CleanFlow AI is a frontend architecture prototype for reviewing and cleaning uploaded datasets in a browser-based workflow.

  The project is built as a portfolio application for demonstrating route modeling, local workflow state, table interaction design,
  file parsing boundaries, audit history, undo behavior, and migration seams for a future server-backed product.

  It is not a deployed SaaS and does not include a backend, authentication, authorization, billing, collaboration, or real AI service
  integration.

  ## Project Overview

  CleanFlow AI lets a user open a route-scoped dataset workspace, upload a CSV or XLSX file, inspect parsed rows, review generated
  data-quality suggestions, apply or reject those suggestions, manually edit cells, review transformation history, inspect audit
  events, and export cleaned data as CSV.

  The current implementation runs locally in the browser. Uploaded file contents, generated suggestions, workflow history, audit
  events, and table preferences are handled client-side.

  ## Why This Project Exists

  This repository exists to demonstrate senior frontend engineering judgment in a realistic data-workflow interface without requiring
  backend infrastructure.

  The implementation focuses on:

  - Modeling a non-trivial UI workflow with reducer-based state transitions.
  - Keeping route ownership and workspace identity explicit in the App Router.
  - Separating browser-local prototype behavior from future server-backed boundaries.
  - Handling table filtering, sorting, pagination, row selection, inline editing, and export.
  - Capturing transformation history and audit events for review workflows.
  - Making limitations visible instead of presenting localStorage as production-authoritative persistence.

  ## Core User Workflow

  1. Upload dataset
     The user opens a workspace route and uploads a CSV or XLSX file through the upload card.

  2. Analyze dataset
     The file is parsed in a browser worker, converted into dynamic columns and rows, then analyzed locally for missing values and
     invalid email/date-like fields.

  3. Review suggestions
     Generated suggestions appear in the review section. Selecting a suggestion highlights affected rows in the table.

  4. Apply or reject suggestions
     Pending suggestions can be approved or ignored. Approved suggestions mutate affected rows when the suggestion action supports a
     data change.

  5. Manual editing
     Table cells can be edited inline. Manual edits create transformation records and audit events.

  6. Audit history
     The audit route reads the locally persisted workflow draft and displays recorded audit events for that dataset id.

  7. Export
     The user can export the full dataset or selected visible rows as CSV.

     ## Demo Workspaces

The application currently includes three route-scoped dataset workspaces:

- `/datasets/customer-cleanup`
- `/datasets/sales-audit`
- `/datasets/marketing-leads`

Each workspace demonstrates the same workflow while maintaining independent route identity, metadata, persistence, and audit history.

  ## Implemented Features

  ### Upload & Parsing

  - Drag-and-drop upload UI using react-dropzone.
  - CSV and XLSX parsing through xlsx.
  - Browser worker parser adapter at src/features/datasets/parsing/worker-dataset-parser.ts.
  - Shared parser interface at src/features/datasets/parsing/dataset-parser.ts.
  - Shared file and row-count validation helper at src/features/datasets/parsing/validate-dataset-file.ts.
  - Local non-worker parser adapter retained as a prototype/migration alternative.
  - Dynamic column generation from uploaded sheet headers.
  - Duplicate normalized column-key handling.
  - Empty dataset and missing-column error handling.
  - Configured upload constraints in src/features/datasets/config/upload-constraints.ts.

  ### Dataset Review

  - Local dataset analysis for:
      - missing values
      - invalid email-like fields
      - invalid date-like fields

  - Suggestion review states: pending, approved, ignored.
  - Row highlighting for the selected suggestion.
  - Separate validationState and reviewState on dataset rows.
  - Dataset summary and profile views based on parsed/analyzed rows.

  ### Table Experience

  - Dynamic schema rendering from uploaded columns.
  - Search, status filtering, sorting, and pagination.
  - Column visibility controls with persisted preferences.
  - Inline cell editing.
  - Row inspection panel.
  - Current-page row selection.
  - Bulk mark selected visible rows as reviewed.
  - Export selected visible rows.
  - Keyboard support for row focus, row selection with Space, row inspection with Enter, and editing cancellation with Escape.

  ### Audit & Undo

  - Transformation history for applied suggestions and manual edits.
  - Undo support for transformations.
  - Partial conflict detection when undoing a transformation after affected values have changed.
  - Audit event records for:
      - AI suggestion application
      - AI suggestion rejection
      - manual edits
      - bulk review actions
      - undo operations

  - Separate audit route at /datasets/[datasetId]/audit.

  ### Persistence

  - Workflow draft persistence through a repository abstraction.
  - Browser-local implementation backed by localStorage.
  - Versioned workflow storage payload.
  - Table preferences persisted by schema key.
  - Column visibility preferences persisted by dataset/schema key.
  - Transient upload and processing states are normalized when restored from storage.

  ### App Router Features

  - Next.js App Router under src/app.
  - Route-owned dataset workspaces at /datasets/[datasetId].
  - Audit route at /datasets/[datasetId]/audit.
  - Root and datasets index redirects to /datasets/customer-cleanup.
  - Dynamic metadata for dataset workspace routes.
  - Segment-level loading.tsx, error.tsx, and not-found.tsx files for dataset routes.
  - Next.js 16 promise-based params handling in dynamic route pages.

  ## Architecture Highlights

  ## Architecture Diagram

```text
App Router Route
        │
        ▼
Dataset Workspace Container
        │
        ▼
Workflow Reducer
        │
 ┌──────┼─────────┬─────────┐
 ▼      ▼         ▼         ▼
Parser  Audit     Table     Persistence
Adapter Events    Query     Repository
                  Adapter
        │
        ▼
localStorage Draft Cache
```

  ### Route-Owned Workspaces

  Dataset workspaces are represented by route params. The dynamic route /datasets/[datasetId] resolves the id through dataset-
  registry.ts and passes the workspace into the dashboard shell.

  The current registry is local and static. It is a placeholder for a future server-backed dataset lookup.

  ### Reducer-Based Workflow State

  The dataset workflow is modeled through workflowReducer and useDatasetWorkflow.

  The reducer owns workflow transitions for upload, processing, completion, failure, suggestion review, manual edits, undo, bulk
  review, audit events, and draft restoration.

  ### Workflow Repository Abstraction

  DatasetWorkflowRepository defines a persistence contract with loadDraft, saveDraft, and clearDraft.

  The implemented repository is localWorkflowRepository, which stores workflow drafts in localStorage. The interface is intentionally
  shaped so a server-backed repository can replace the local implementation later.

  ### Parser Adapter Boundary

  DatasetParser defines the parser contract. The active implementation uses a browser worker via workerDatasetParser.

  The worker parser keeps heavier XLSX parsing away from the main UI thread. A local client parser also exists as a simpler prototype
  adapter.

  ### Table Query Adapter Boundary

  DatasetTableQueryAdapter defines synchronous and asynchronous row query methods.

  The current adapter, localTableQueryAdapter, performs in-memory search, filtering, sorting, and pagination. The async method is a
  migration boundary for a future worker or server-backed query implementation.

  ### Audit Event Model

  Audit events capture source, actor, operation, affected row ids, optional field changes, and status.

  The current audit model is local and mutable because it is stored as part of the browser and manual edits create transformation
  records. These records include affected rows, field-level before/after values, timestamps, and revert status.

  ### Undo Conflict Handling

  Undo only reverts a field when the current value still matches the transformation's recorded afterValue. If some values no longer
  match, the transformation is marked with partial_conflict instead of blindly overwriting newer changes.

  ## Architecture Decisions

  - Keep route files thin and move interactive workspace behavior into feature/container code.
  - Use a reducer for workflow transitions instead of scattering workflow mutations across components.
  - Keep localStorage behind repository and storage helpers so persistence can be replaced.
  - Use explicit adapter interfaces for parsing and table queries.
  - Treat local dataset analysis as a deterministic mock/prototype substitute for a future AI or backend analysis service.
  - Preserve audit and transformation concepts even though the current storage layer is local.
  - Keep App Router pages as server components where possible and isolate browser APIs in client components.
  - Scope table and column preferences to schema/workspace identity.

  ## Tech Stack

  Technologies present in package.json and used by the current source:

  - Next.js 16
  - React 19
  - TypeScript
  - Tailwind CSS 4
  - shadcn-style UI components
  - Radix UI primitives
  - lucide-react
  - react-dropzone
  - xlsx
  - sonner
  - Vitest
  - Testing Library
  - jsdom
  - ESLint

  Dependencies present in package.json but not meaningfully used by the current implementation should not be read as implemented
  product capabilities.

  ## Folder Structure

  cleanflow-ai/
    docs/
      frontend-architecture.md
      architecture-snapshot.txt
    public/
    src/
      app/
        page.tsx
        layout.tsx
        loading.tsx
        error.tsx
        datasets/
          page.tsx
          layout.tsx
          [datasetId]/
            page.tsx
            loading.tsx
            error.tsx
            not-found.tsx
            audit/
              page.tsx
              loading.tsx
      components/
        ai/
        dataset/
        layout/
        ui/
        upload/
      features/
        datasets/
          components/
          config/
          containers/
          hooks/
          parsing/
          table/
          types/
          utils/
          workflow/
      lib/
      mock/
      types/
    package.json
    vitest.config.ts
    eslint.config.mjs
    next.config.ts

  ## State Management Design

  CleanFlow AI uses local React state and reducers. It does not currently use a global external state store.

  The main workflow state lives in useDatasetWorkflow, which wraps workflowReducer.

  The workflow state includes:

  - dataset id
  - file name
  - upload/workflow status
  - parsed columns
  - analyzed rows
  - generated suggestions
  - selected suggestion id
  - activity messages
  - dataset profile
  - transformations
  - audit events
  - progress and error state

  Table state is separated into useDatasetTableState, which owns:

  - search query
  - deferred search query
  - status filter
  - sorting
  - pagination
  - selected row ids
  - inspected row
  - editing cell
  - draft edit value

  Column visibility state is separated into useColumnVisibilityPreferences.

  ## Data Flow Diagram

  User opens /datasets/[datasetId]
          |
          v
  App Router page resolves workspace from local dataset registry
          |
          v
  DatasetWorkspaceContainer mounts client workflow
          |
          v
  localWorkflowRepository attempts to restore draft from localStorage
          |
          v
  User uploads CSV/XLSX file
          |
          v
  workerDatasetParser parses file in browser worker
          |
          v
  createParsedDataset normalizes headers and row values
          |
          v
  analyzeDataset creates validation states and suggestions
          |
          v
  workflowReducer stores rows, columns, suggestions, profile, activity
          |
          v
  Dataset table queries rows through localTableQueryAdapter
          |
          v
  User reviews suggestions, edits cells, marks rows reviewed, or undoes changes
          |
          v
  workflowReducer records transformations and audit events
          |
          v
  localWorkflowRepository persists draft to localStorage
          |
          v
  User exports full dataset or selected visible rows as CSV

  ## Current Limitations

  - No backend API.
  - No authentication or authorization.
  - No server-side dataset storage.
  - No real AI model or external AI service integration.
  - Dataset registry is static and local.
  - Audit events are local draft records, not immutable server records.
  - Table querying is in-memory.
  - Table virtualization is indicated in render state but not implemented.
  - File parsing runs in the browser and is intended for demo-scale datasets.
  - The audit route reads local draft state and does not validate the dataset id against a backend.
  - No deployed environment is configured in this repository.
  - No end-to-end browser tests are included.
  - No screenshots are currently committed.

  ## Prototype Limitations

  This project should be evaluated as a frontend prototype, not a production data platform.

  The localStorage draft cache is used to demonstrate persistence boundaries and workflow restoration. It should not be treated as
  authoritative storage for production data.

  The generated suggestions are deterministic local analysis results. They are not produced by an AI model in the current codebase.

  The parser, table query adapter, and workflow repository are intentionally shaped as migration boundaries. Their current
  implementations are local-browser implementations.

  ## Future Enhancements

  - Replace the static dataset registry with server-loaded dataset resources.
  - Add a server-backed workflow repository.
  - Persist immutable audit events and dataset versions.
  - Move dataset analysis to a backend job or AI-assisted service.
  - Add upload job status and server-side file validation.
  - Add table virtualization for larger datasets.
  - Add cursor-based server querying for large row sets.
  - Add route-level authorization.
  - Add component and end-to-end tests for the upload/review/export workflows.
  - Add screenshots or a short demo recording.

  ## Local Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000/datasets/customer-cleanup
```

### Available Demo Workspaces

```text
/datasets/customer-cleanup
/datasets/sales-audit
/datasets/marketing-leads
```

## Build & Test Commands

### Lint

```bash
npm run lint
```

### Run Tests

```bash
npm run test:run
```

### Run Tests (Watch Mode)

```bash
npm run test
```

### Production Build

```bash
npm run build
```

  ## Screenshots Section

  Screenshots are not currently committed to the repository.

  Suggested captures before sharing this project in applications:

  - Empty workspace before upload.
  - Upload and processing state.
  - Dataset table with validation highlighting.
  - Suggestion review panel with highlighted affected rows.
  - Inline cell editing.
  - Transformation history with undo state.
  - Audit route with recorded events.
  - CSV export action.

  ## Portfolio Discussion Points

  A senior frontend interviewer should notice:

  - The App Router route structure models dataset workspaces explicitly.
  - Dynamic route params follow the Next.js 16 promise-based API.
  - Workflow transitions are centralized in a reducer instead of being spread across UI components.
  - Browser-local persistence is hidden behind a repository contract.
  - Parser and table query behavior are behind adapter interfaces.
  - The project distinguishes validation state from human review state.
  - Suggestions, manual edits, transformations, undo, and audit events are modeled as separate concepts.
  - Undo behavior avoids overwriting newer user changes when a partial conflict is detected.
  - CSV export includes formula-injection mitigation.
  - The README and architecture docs describe what is implemented locally versus what would need to move server-side.

  ## What This Demonstrates

This project demonstrates:

- Next.js 16 App Router architecture
- Dynamic route ownership patterns
- Reducer-based workflow state management
- Repository and adapter design patterns
- Browser worker integration
- Data-heavy table interactions
- Audit and undo workflows
- Local persistence and restoration strategies
- Migration-ready frontend architecture
- Type-safe React application design

  ## Interview Talking Points

  - Why the current implementation uses local browser state for a portfolio prototype.
  - How the workflow repository could be replaced with a server implementation.
  - How the worker parser boundary could evolve into upload jobs and backend parsing.
  - How the table query adapter could evolve into worker-based or server-side querying.
  - How audit events would need to change for compliance-grade immutability.
  - Why review state and validation state should remain separate.
  - What changes are required before handling large datasets.
  - What tests should be added before treating the workflow as release-ready.