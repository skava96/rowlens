"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  FileSpreadsheet,
  Upload,
} from "lucide-react";

type Props = {
  onUploadStart: (fileName: string) => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete: () => void;
};

export function UploadCard({
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
}: Props) {

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // STEP 1: notify workflow
      onUploadStart(file.name);

      // STEP 2: simulate progress (UI only)
      let progress = 0;

      const interval = setInterval(() => {
        progress += 20;

        onUploadProgress?.(progress);

        if (progress >= 100) {
          clearInterval(interval);
          onUploadComplete();
        }
      }, 200);
    },
    [onUploadStart, onUploadProgress, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    multiple: false
  });

  const dropzoneBase =
    "mt-6 cursor-pointer rounded-xl border-dashed transition-colors p-6 sm:p-10 text-center border-2";

  const dropzoneClass = isDragActive
    ? `${dropzoneBase} border-primary bg-muted/50`
    : `${dropzoneBase} border-muted-foreground/30 bg-muted/30 hover:bg-muted/50`;

  return (
    <section className="w-full rounded-xl border border-border/80 bg-card p-4 sm:p-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">
              Upload Dataset
            </h1>
            <p className="text-sm text-muted-foreground">
              Upload CSV or Excel datasets for processing.
            </p>
          </div>
        </div>

        <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Upload file
        </button>
      </div>

      {/* Dropzone */}
      <div {...getRootProps()} className={dropzoneClass}>
        <input {...getInputProps()} />

        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />

        <p className="mt-4 text-lg font-medium">
          {isDragActive ? "Drop files here..." : "Drop CSV or Excel files here"}
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          or click to browse files
        </p>
      </div>

      {/* Supported formats */}
      <div className="mt-6 rounded-xl bg-muted/30 p-4 border border-border/40">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium">
              Supported formats: CSV, XLSX
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum size: 10MB
            </p>
          </div>
        </div>
      </div>

    </section>
  );
}