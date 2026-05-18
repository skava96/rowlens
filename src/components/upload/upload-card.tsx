"use client";

import { useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import {
  AlertTriangle,
  UploadCloud,
  FileSpreadsheet,
  Upload,
  Loader2,
  CheckCircle2,
} from "lucide-react";

type Props = {
  onUploadStart: (file: File) => void;
  isUploading?: boolean;
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function getUploadError(rejection: FileRejection) {
  const firstError = rejection.errors[0];

  if (!firstError) return "File could not be uploaded.";

  if (firstError.code === "file-too-large") {
    return "File is too large. Maximum allowed size is 10MB.";
  }

  if (firstError.code === "file-invalid-type") {
    return "Unsupported file type. Please upload a CSV or XLSX file.";
  }

  return firstError.message;
}

export function UploadCard({ onUploadStart, isUploading = false }: Props) {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      if (!file || isUploading) return;

      setUploadError(null);
      setUploadedFile(file.name);

      onUploadStart(file);
    },
    [isUploading, onUploadStart]
  );

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    setUploadedFile(null);

    const firstRejection = fileRejections[0];

    setUploadError(
      firstRejection
        ? getUploadError(firstRejection)
        : "Upload failed. Please try again."
    );
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected,
    noClick: true,
    multiple: false,
    maxSize: MAX_FILE_SIZE_BYTES,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
  });

  const dropzoneBase =
    "relative rounded-xl border border-dashed transition-colors px-5 py-8 text-center";

  const dropzoneClass = isDragActive
    ? `${dropzoneBase} border-primary bg-muted/50`
    : `${dropzoneBase} border-border bg-muted/10 hover:bg-muted/30`;

  return (
    <section className="w-full rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_1.35fr] lg:items-stretch">
        <div className="flex h-full flex-col justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-border bg-muted/30 p-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <h1 className="text-lg font-semibold">Upload Dataset</h1>
              <p className="mt-1 max-w-xl text-sm leading-5 text-muted-foreground">
                Upload CSV or Excel datasets for AI-assisted validation and
                cleaning.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {uploadedFile && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-3">
                <div className="flex items-start gap-3">
                  {isUploading ? (
                    <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {uploadedFile}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isUploading
                        ? "Uploading and validating dataset..."
                        : "Dataset selected successfully"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />

                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Upload failed
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {uploadError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="mt-0.5 h-4 w-4 text-muted-foreground" />

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
          </div>
        </div>

        <div {...getRootProps()} className={dropzoneClass}>
          <input {...getInputProps()} />

          <button
            type="button"
            onClick={open}
            disabled={isUploading}
            className="absolute right-4 top-4 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload file"
            )}
          </button>

          <div className="flex h-full min-h-[140px] flex-col items-center justify-center pt-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Drag & Drop
            </p>

            <UploadCloud className="mt-3 h-10 w-10 text-muted-foreground" />

            <p className="mt-2 text-base font-semibold">
              {isDragActive ? "Drop dataset here..." : "Drop dataset here"}
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              or browse from your computer
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}