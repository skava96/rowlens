"use client"
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { mockDataset } from "@/mock/mockDataset"


function getValidationState(row: (typeof mockDataset)[number]) {
  const nameMissing = !row.name?.trim()
  const signupMissing = !row.signupDate?.trim()
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email || "")

  if (nameMissing || signupMissing) {
    return {
      state: "missing" as const, field: nameMissing ? "name" : "signupDate", validation: {
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        text: "Needs Review",
        color: "bg-orange-100",
      }
    }
  }
  if (!emailValid) {
    return {
      state: "invalid" as const, field: "email", validation: {
        icon: <XCircle className="h-3.5 w-3.5" />,
        text: "Error",
        color: "bg-red-100",
      }
    }
  }
  return {
    state: "ok" as const, field: undefined, validation: {
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      text: "Valid",
      color: "bg-green-100",
    }
  }
}

export function DatasetTable() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border/70 bg-background shadow-sm">
      <Table className="min-w-full text-sm">
        <TableHeader className="border-b border-border/70 bg-slate-50/95">
          <TableRow className="!border-0">
            {[
              { label: "Name", width: "w-[24%]" },
              { label: "Email", width: "w-[30%]" },
              { label: "Country", width: "w-[18%]" },
              { label: "Signup date", width: "w-[18%]" },
              { label: "Status", width: "w-[10%]" },
              { label: "Validation", width: "w-[10%]" },
            ].map((column) => (
              <TableHead
                key={column.label}
                className={cn(
                  column.width,
                  "sticky top-0 z-10 px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-slate-500",
                )}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {mockDataset.map((row) => {
            const validation = getValidationState(row)
            const isMissingName = validation.field === "name"
            const isMissingDate = validation.field === "signupDate"
            const isInvalidEmail = validation.field === "email"

            return (
              <TableRow
                key={row.id}
                className="group border-b border-border/70 transition-colors hover:bg-muted/50"
              >
                <TableCell
                  className={cn(
                    "px-3 py-2 align-middle text-foreground",
                    isMissingName && "rounded-r-2xl bg-amber-100/75 text-amber-950",
                  )}
                >
                  {row.name || (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950">
                      Missing value
                    </span>
                  )}
                </TableCell>

                <TableCell
                  className={cn(
                    "px-3 py-2 align-middle text-foreground",
                    isInvalidEmail && "rounded-r-2xl bg-amber-100/75 text-amber-950",
                  )}
                >
                  {row.email}
                  {isInvalidEmail ? (
                    <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-900">
                      Invalid email
                    </span>
                  ) : null}
                </TableCell>

                <TableCell className="px-3 py-2 align-middle text-foreground">
                  {row.country}
                </TableCell>

                <TableCell
                  className={cn(
                    "px-3 py-2 align-middle text-foreground",
                    isMissingDate && "rounded-r-2xl bg-amber-100/75 text-amber-950",
                  )}
                >
                  {row.signupDate || (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950">
                      Missing value
                    </span>
                  )}
                </TableCell>

                <TableCell className="px-3 py-2 align-middle">
                  {validation.state === "invalid" ? (
                    <Badge
                      variant="destructive"
                      className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-2 py-1 text-[11px] font-semibold text-destructive"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Invalid
                    </Badge>
                  ) : validation.state === "missing" ? (
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                      Review
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      Ready
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <span className={cn("flex items-center gap-2 ml-2 text-sm font-medium", validation?.validation?.color)}>
                    {validation?.validation?.icon}{validation?.validation?.text}
                  </span>
                </TableCell>

              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
