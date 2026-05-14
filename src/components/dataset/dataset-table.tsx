"use client";

import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { DatasetRowView } from "@/features/datasets/adapters/datasetAdapter";

interface DatasetTableProps {
  rows: DatasetRowView[];
  highlightedRowIds?: number[];
}

export function DatasetTable({
  rows,
  highlightedRowIds = [],
}: DatasetTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-background shadow-sm">
      <Table className="min-w-[860px] text-sm">
        <TableHeader className="border-b border-border bg-slate-50">
          <TableRow className="border-0 hover:bg-transparent">
            {[
              { label: "Name", width: "w-[22%]" },
              { label: "Email", width: "w-[28%]" },
              { label: "Country", width: "w-[18%]" },
              { label: "Signup Date", width: "w-[16%]" },
              { label: "Validation", width: "w-[16%]" },
            ].map((column) => (
              <TableHead
                key={column.label}
                className={cn(
                  column.width,
                  "sticky top-0 z-10 px-4 py-3 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground"
                )}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => {
            const isHighlighted = highlightedRowIds.includes(row.id);
            const isMissingName = row.validationField === "name";
            const isMissingDate = row.validationField === "signupDate";
            const isInvalidEmail = row.validationField === "email";

            return (
              <TableRow
                key={row.id}
                className={cn(
                  "border-b border-border/60 transition-colors hover:bg-muted/40",
                  isHighlighted && "bg-sky-50/40"
                )}
              >
                <TableCell
                  className={cn(
                    "border-l-2 border-l-transparent px-4 py-3 align-middle text-foreground",
                    isHighlighted && "border-l-sky-500",
                    isMissingName && "bg-amber-50 text-amber-950"
                  )}
                >
                  {row.name || (
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900">
                      Missing value
                    </span>
                  )}
                </TableCell>

                <TableCell
                  className={cn(
                    "px-4 py-3 align-middle text-foreground",
                    isInvalidEmail && "bg-red-50 text-red-950"
                  )}
                >
                  <div className="flex flex-col gap-1.5">
                    <span>{row.email}</span>

                    {isInvalidEmail && (
                      <span className="inline-flex w-fit rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
                        Invalid email
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="px-4 py-3 align-middle text-foreground">
                  {row.country}
                </TableCell>

                <TableCell
                  className={cn(
                    "px-4 py-3 align-middle text-foreground",
                    isMissingDate && "bg-amber-50 text-amber-950"
                  )}
                >
                  {row.signupDate || (
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900">
                      Missing value
                    </span>
                  )}
                </TableCell>

                <TableCell className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {row.validationState === "invalid" ? (
                      <>
                        <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                        <span className="text-red-700">Invalid format</span>
                      </>
                    ) : row.validationState === "missing" ? (
                      <>
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                        <span className="text-amber-700">Needs review</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-emerald-700">Valid</span>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}