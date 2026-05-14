"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDropzone } from "react-dropzone";

import {
  UploadCloud,
  FileSpreadsheet,
  Upload,
  Loader2,
  CheckCircle2,
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
  const [uploading, setUploading] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearUploadInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearUploadInterval();
    };
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      if (!file || uploading) return;

      clearUploadInterval();

      setUploading(true);

      setUploadedFile(file.name);

      onUploadStart(file.name);

      let progress = 0;

      intervalRef.current = setInterval(() => {
        progress += 20;

        onUploadProgress?.(progress);

        if (progress >= 100) {
          clearUploadInterval();

          onUploadComplete();

          setUploading(false);
        }
      }, 250);
    },
    [
      uploading,
      onUploadStart,
      onUploadProgress,
      onUploadComplete,
    ]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open,
  } = useDropzone({
    onDrop,
    noClick: true,
    multiple: false,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
  });

  const dropzoneBase =
    "mt-5 rounded-xl border-2 border-dashed transition-colors p-5 sm:p-7 text-center";

  const dropzoneClass = isDragActive
    ? `${dropzoneBase} border-primary bg-muted/50`
    : `${dropzoneBase} border-muted-foreground/30 bg-muted/30 hover:bg-muted/50`;

  return (
    <section className="w-full rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-muted-foreground" />

          <div>
            <h1 className="text-lg font-semibold sm:text-xl">
              Upload Dataset
            </h1>

            <p className="text-sm text-muted-foreground">
              Upload CSV or Excel datasets for AI-assisted validation and cleaning.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={open}
          disabled={uploading}
          className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload file"
          )}
        </button>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={dropzoneClass}
      >
        <input {...getInputProps()} />

        <UploadCloud className="mx-auto h-9 w-9 text-muted-foreground" />

        <p className="mt-4 text-lg font-medium">
          {isDragActive
            ? "Drop dataset here..."
            : "Drop CSV or Excel dataset here"}
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          or use the upload button above
        </p>
      </div>

      {/* Upload Context */}
      {uploadedFile && (
        <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            {uploading ? (
              <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-primary" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {uploadedFile}
              </p>

              <p className="text-xs text-muted-foreground">
                {uploading
                  ? "Uploading and validating dataset..."
                  : "Dataset uploaded successfully"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Supported formats */}
      <div className="mt-6 rounded-xl border border-border/40 bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 text-muted-foreground" />

          <div>
            <p className="text-sm font-medium">
              Supported formats: CSV, XLSX
            </p>

            <p className="text-xs text-muted-foreground">
              Maximum file size: 10MB
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}