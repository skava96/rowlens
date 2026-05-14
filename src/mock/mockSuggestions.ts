import { AISuggestion } from "@/types/dataset";

export const mockSuggestions: AISuggestion[] = [
  {
    id: "sug-1",
    type: "validation",
    title: "Invalid email formats detected",
    description:
      "Some email fields do not match standard email formatting rules and may fail validation.",
    confidence: 92,
    affectedRows: [1, 2, 5],
    severity: "high",
  },
  {
    id: "sug-2",
    type: "duplicate",
    title: "Duplicate customer records found",
    description:
      "Multiple rows appear to contain duplicate customer entries based on name and email similarity.",
    confidence: 88,
    affectedRows: [4, 7],
    severity: "medium",
  },
  {
    id: "sug-3",
    type: "validation",
    title: "Country values need standardization",
    description:
      "Country field contains inconsistent values (e.g., USA, U.S.A, United States).",
    confidence: 85,
    affectedRows: [3, 8, 9],
    severity: "low",
  },
  {
    id: "sug-4",
    type: "missing",
    title: "Missing required fields detected",
    description:
      "Several rows are missing required fields such as signup date or country.",
    confidence: 90,
    affectedRows: [6, 10, 11, 12],
    severity: "medium",
  },
];