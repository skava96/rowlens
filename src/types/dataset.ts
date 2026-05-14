export interface DatasetRow {
  id: number;
  name: string;
  email: string;
  country: string;
  signupDate: string;
  status: string;
}

export interface AISuggestion {
  id: string;
  type: "validation" | "duplicate" | "missing";
  title: string;
  description: string;
  confidence: number;
  affectedRows: number[];
  severity: "low" | "medium" | "high";
}