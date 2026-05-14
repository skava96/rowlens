"use client";

import {
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import {
  DatasetRowView,
} from "@/features/datasets/adapters/datasetAdapter";

interface DatasetTableProps {
  rows: DatasetRowView[];
}

export function DatasetTable({
  rows,
}: DatasetTableProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border/70 bg-background shadow-sm">
      <Table className="min-w-full text-sm">
        <TableHeader className="border-b border-border/70 bg-muted/40">
          <TableRow className="border-0">
            {[
              { label: "Name", width: "w-[24%]" },
              { label: "Email", width: "w-[30%]" },
              { label: "Country", width: "w-[18%]" },
              { label: "Signup Date", width: "w-[18%]" },
              { label: "Status", width: "w-[10%]" },
              { label: "Validation", width: "w-[10%]" },
            ].map((column) => (
              <TableHead
                key={column.label}
                className={cn(
                  column.width,
                  "sticky top-0 z-10 px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground"
                )}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => {
            const isMissingName =
              row.validationField === "name";

            const isMissingDate =
              row.validationField === "signupDate";

            const isInvalidEmail =
              row.validationField === "email";

            return (
              <TableRow
                key={row.id}
                className="border-b border-border/70 transition-colors hover:bg-muted/40"
              >
                {/* Name */}
                <TableCell
                  className={cn(
                    "px-3 py-2 align-middle",
                    isMissingName &&
                      "bg-amber-100/70 text-amber-950"
                  )}
                >
                  {row.name || (
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950">
                      Missing value
                    </span>
                  )}
                </TableCell>

                {/* Email */}
                <TableCell
                  className={cn(
                    "px-3 py-2 align-middle",
                    isInvalidEmail &&
                      "bg-red-100/70 text-red-950"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{row.email}</span>

                    {isInvalidEmail && (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-800">
                        Invalid
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Country */}
                <TableCell className="px-3 py-2 align-middle">
                  {row.country}
                </TableCell>

                {/* Signup Date */}
                <TableCell
                  className={cn(
                    "px-3 py-2 align-middle",
                    isMissingDate &&
                      "bg-amber-100/70 text-amber-950"
                  )}
                >
                  {row.signupDate || (
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950">
                      Missing value
                    </span>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell className="px-3 py-2 align-middle">
                  {row.validationState === "invalid" ? (
                    <Badge
                      variant="destructive"
                      className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-2 py-1 text-[11px] font-semibold"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Invalid
                    </Badge>
                  ) : row.validationState === "missing" ? (
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-900">
                      Review
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      Ready
                    </span>
                  )}
                </TableCell>

                {/* Validation */}
                <TableCell className="px-3 py-2 align-middle">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {row.validationState === "invalid" ? (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-700">
                          Invalid format
                        </span>
                      </>
                    ) : row.validationState === "missing" ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-700">
                          Needs review
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-700">
                          Valid
                        </span>
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