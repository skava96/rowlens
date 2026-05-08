"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, X, Loader2, CheckCircle, AlertCircle, FileSpreadsheet, Upload } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

type UploadState = "idle" | "dragging" | "uploading" | "uploaded" | "error";

interface UploadedFile {
  file: File;
  state: UploadState;
  progress?: number;
}

export function UploadCard() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>("idle");

  const simulateUpload = (files: File[]) => {
    setUploadState("uploading");

    files.forEach((file, index) => {
      const newFile: UploadedFile = { file, state: "uploading", progress: 0 };
      setUploadedFiles((prev) => [...prev, newFile]);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadedFiles((prev) =>
          prev.map((f, i) =>
            i === prev.length - files.length + index
              ? { ...f, progress: Math.min((f.progress || 0) + 10, 100) }
              : f
          )
        );
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        setUploadedFiles((prev) =>
          prev.map((f, i) =>
            i === prev.length - files.length + index
              ? { ...f, state: "uploaded" }
              : f
          )
        );
        setUploadState("uploaded");
      }, 2000);
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadState("uploading");
    simulateUpload(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    multiple: true,
  });

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getDropzoneStyles = () => {
    const baseStyles = "mt-6 cursor-pointer rounded-xl border-dashed transition-colors p-6 sm:p-10 text-center border-2";

    if (uploadState === "uploading") {
      return `${baseStyles} border-primary bg-muted/30`;
    }

    if (isDragActive) {
      return `${baseStyles} border-primary bg-muted/50`;
    }

    if (uploadState === "uploaded") {
      return `${baseStyles} border-emerald-500 bg-muted/30`;
    }

    if (uploadState === "error") {
      return `${baseStyles} border-destructive bg-muted/30`;
    }

    // idle state
    return `${baseStyles} border-muted-foreground/30 bg-muted/30 hover:bg-muted/50`;
  };

  const getStateIcon = () => {
    if (uploadState === "uploading") {
      return <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />;
    }

    if (uploadState === "uploaded") {
      return <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />;
    }

    if (uploadState === "error") {
      return <AlertCircle className="mx-auto h-12 w-12 text-destructive" />;
    }

    return <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />;
  };

  const getStateText = () => {
    if (uploadState === "uploading") {
      return "Uploading files...";
    }

    if (uploadState === "uploaded") {
      return "Files uploaded successfully!";
    }

    if (uploadState === "error") {
      return "Upload failed. Please try again.";
    }

    if (isDragActive) {
      return "Drop the files here...";
    }

    return "Drop CSV or Excel files here";
  };

  const getStateBadge = (state: UploadState) => {
    if (state === "uploaded") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
          <CheckCircle className="h-3 w-3" />
          Success
        </span>
      );
    }

    if (state === "error") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
          <AlertCircle className="h-3 w-3" />
          Error
        </span>
      );
    }

    return null;
  };

  return (
    <section className="w-full rounded-xl border border-border/80 bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Upload Dataset</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload CSV or Excel datasets to begin AI-assisted cleaning and validation.
            </p>
          </div>
        </div>
        <button className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 whitespace-nowrap">
          Upload file
        </button>
      </div>

      <div {...getRootProps()} className={getDropzoneStyles()}>
        <input {...getInputProps()} />
        {getStateIcon()}
        <p className="mt-4 text-lg font-medium text-foreground">
          {getStateText()}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">or click to browse files</p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Uploaded Files</h3>
          <div className="space-y-2">
            {uploadState === "uploading" && uploadedFiles.some(f => f.state === "uploading") && (
              <div className="flex items-center justify-between rounded-xl bg-background/95 p-4 border border-border/60">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-1.5 w-full" />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            )}
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl bg-background/95 p-4 border border-border/60"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {file.state === "uploading" && file.progress !== undefined && (
                      <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {getStateBadge(file.state)}
                  <button
                    onClick={() => removeFile(index)}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Metadata Preview */}
      {uploadedFiles.some(f => f.state === "uploaded") && (
        <div className="mt-6 rounded-xl bg-background/95 p-4 border border-border/60">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">customers.csv</p>
              <p className="text-xs text-muted-foreground">2.4 MB • uploaded just now</p>
            </div>
          </div>
        </div>
      )}

      {/* Supported Formats Section */}
      <div className="mt-6 rounded-xl bg-muted/30 p-4 border border-border/40">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Supported formats: CSV, XLSX</p>
            <p className="text-xs text-muted-foreground">Maximum size: 10MB</p>
          </div>
        </div>
      </div>
    </section>
  );
}