# CleanFlow AI Frontend Architecture

## Current Scope

CleanFlow AI is currently implemented as a frontend-focused dataset review workspace. It demonstrates an AI-assisted data quality workflow with CSV/XLSX upload, dynamic schema rendering, row validation, review suggestions, inline editing, undo history, export, and persisted table preferences.

The current implementation intentionally keeps dataset processing local to the browser to support portfolio/demo usage without requiring backend infrastructure.

## App Router Strategy

The application uses Next.js App Router with dataset-oriented routes:

- `/`
- `/datasets`
- `/datasets/[datasetId]`
- `/datasets/[datasetId]/audit`

The route structure is designed to support future server-backed dataset resources. The dataset workspace route accepts a `datasetId` param, which is already used to scope table and column preferences.

## Client and Server Boundaries

Current interactive workspace behavior is handled by client components because upload, file parsing, table interactions, and review actions require browser APIs and local interaction state.

Future production architecture should narrow client boundaries into smaller islands:

- Upload island
- Dataset table island
- Review queue island
- Export controls
- Audit timeline

Server components should own route-level data loading, authorization, dataset metadata, persisted audit records, and initial workspace state.

## Dataset Workflow Model

Current workflow state is managed locally by `useDatasetWorkflow`.

It owns:

- upload state
- parsed columns and rows
- AI suggestions
- selected suggestion
- transformations
- activity history
- undo behavior

Production evolution should split this into explicit resource models:

- `Dataset`
- `UploadJob`
- `AnalysisJob`
- `ReviewSession`
- `Suggestion`
- `Transformation`
- `AuditEvent`
- `ExportJob`

Each resource should have its own lifecycle and persisted state.

## Table Architecture

The dataset table currently supports:

- dynamic columns
- column visibility
- persisted preferences
- filtering
- sorting
- pagination
- inline editing
- row selection
- selected export
- row inspection

Current table operations run in memory and are suitable for demo-scale datasets.

Production evolution should introduce a table data contract:

```ts
type DatasetTableQuery = {
  datasetId: string;
  search: string;
  filters: Record<string, unknown>;
  sort: {
    field: string;
    direction: "asc" | "desc";
  } | null;
  pageCursor?: string;
  pageSize: number;
};