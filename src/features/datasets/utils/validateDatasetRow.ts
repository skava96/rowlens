import {
  AISuggestion,
  DatasetCellValue,
  DatasetRow,
} from "@/types/dataset";

type DatasetValidationIssueKind =
  | "missing"
  | "invalid_email"
  | "invalid_date"
  | "standardize_country"
  | "invalid_country"
  | "standardize_account_status"
  | "invalid_account_status";

export type DatasetValidationIssue = {
  kind: DatasetValidationIssueKind;
  field: string;
  type: AISuggestion["type"];
  title: string;
  description: string;
  confidence: number;
  severity: AISuggestion["severity"];
  action: AISuggestion["action"];
  suggestedValue?: DatasetCellValue;
};

export type DatasetRowValidationResult = {
  validationState: DatasetRow["validationState"];
  validationField?: string;
  issues: DatasetValidationIssue[];
};

const countryMap: Record<string, string> = {
  usa: "United States",
  us: "United States",
  "u.s.": "United States",
  "u.s.a.": "United States",
  uk: "United Kingdom",
  uae: "United Arab Emirates",
};

const knownCountries = new Set([
  ...Object.values(countryMap),
  "Australia",
  "Canada",
  "Germany",
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
]);

const accountStatusMap: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  churned: "Churned",
  pending: "Pending",
  trial: "Trial",
};

const knownAccountStatuses = new Set(Object.values(accountStatusMap));

export function isEmailField(field: string) {
  return field.toLowerCase().includes("email");
}

export function isDateField(field: string) {
  return field.toLowerCase().includes("date");
}

export function isCountryField(field: string) {
  return field.toLowerCase() === "country";
}

export function isAccountStatusField(field: string) {
  const normalized = field.toLowerCase();
  return normalized === "account_status" || normalized === "account status";
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

export function getEmailAutoFix(value: string) {
  const normalized = value.trim();

  if (isValidEmail(normalized)) return null;

  if (
    !normalized.includes("@") &&
    normalized.toLowerCase().includes("atsign.")
  ) {
    const candidate = normalized.replace(/atsign[.\s_-]*/i, "@");

    return isValidEmail(candidate) ? candidate : null;
  }

  return null;
}

export function getStandardizedCountry(value: string) {
  const normalized = value.trim().toLowerCase();

  return countryMap[normalized] ?? null;
}

export function getStandardizedAccountStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  const standardized = accountStatusMap[normalized];

  if (!standardized || standardized === value.trim()) {
    return null;
  }

  return standardized;
}

function isKnownCountryValue(value: string) {
  return knownCountries.has(value.trim());
}

function isKnownAccountStatusValue(value: string) {
  return knownAccountStatuses.has(value.trim());
}

function validateField(
  field: string,
  value: DatasetCellValue
): DatasetValidationIssue | null {
  const normalized = typeof value === "string" ? value.trim() : value;

  if (normalized === null || normalized === undefined || normalized === "") {
    return {
      kind: "missing" as const,
      field,
      type: "missing" as const,
      title: `Missing values in ${field}`,
      description: `Some rows have missing values in the "${field}" column.`,
      confidence: 96,
      severity: "medium" as const,
      action: "flag_invalid" as const,
    };
  }

  if (typeof normalized !== "string") {
    return null;
  }

  if (isEmailField(field)) {
    const emailAutoFix = getEmailAutoFix(normalized);

    if (emailAutoFix) {
      return {
        kind: "invalid_email" as const,
        field,
        type: "validation" as const,
        title: "Fix invalid email format",
        description: `Some rows contain email values that can be safely corrected in the "${field}" column.`,
        confidence: 97,
        severity: "high" as const,
        action: "standardize_value" as const,
        suggestedValue: emailAutoFix,
      };
    }

    if (!isValidEmail(normalized)) {
      return {
        kind: "invalid_email" as const,
        field,
        type: "validation" as const,
        title: "Invalid email format",
        description: `Some rows contain invalid email addresses in the "${field}" column.`,
        confidence: 98,
        severity: "high" as const,
        action: "flag_invalid" as const,
        suggestedValue: null,
      };
    }
  }

  if (isDateField(field) && !isValidDate(normalized)) {
    return {
      kind: "invalid_date" as const,
      field,
      type: "validation" as const,
      title: "Invalid date format",
      description: `Some rows contain invalid dates in the "${field}" column.`,
      confidence: 92,
      severity: "medium" as const,
      action: "flag_invalid" as const,
      suggestedValue: null,
    };
  }

  if (isCountryField(field)) {
    const standardizedCountry = getStandardizedCountry(normalized);

    if (standardizedCountry) {
      return {
        kind: "standardize_country" as const,
        field,
        type: "validation" as const,
        title: "Standardize country value",
        description: `Some rows use non-standard country values in the "${field}" column.`,
        confidence: 94,
        severity: "low" as const,
        action: "standardize_value" as const,
        suggestedValue: standardizedCountry,
      };
    }

    if (!isKnownCountryValue(normalized)) {
      return {
        kind: "invalid_country" as const,
        field,
        type: "validation" as const,
        title: "Review country value",
        description: `Some rows contain unrecognized country values in the "${field}" column.`,
        confidence: 86,
        severity: "low" as const,
        action: "flag_invalid" as const,
        suggestedValue: null,
      };
    }
  }

  if (isAccountStatusField(field)) {
    const standardizedStatus = getStandardizedAccountStatus(normalized);

    if (standardizedStatus) {
      return {
        kind: "standardize_account_status" as const,
        field,
        type: "validation" as const,
        title: "Standardize account status",
        description: `Some rows use inconsistent account status values in the "${field}" column.`,
        confidence: 93,
        severity: "low" as const,
        action: "standardize_value" as const,
        suggestedValue: standardizedStatus,
      };
    }

    if (!isKnownAccountStatusValue(normalized)) {
      return {
        kind: "invalid_account_status" as const,
        field,
        type: "validation" as const,
        title: "Review account status",
        description: `Some rows contain unrecognized account status values in the "${field}" column.`,
        confidence: 86,
        severity: "low" as const,
        action: "flag_invalid" as const,
        suggestedValue: null,
      };
    }
  }

  return null;
}

export function validateDatasetRow(
  values: Record<string, DatasetCellValue>
): DatasetRowValidationResult {
  const issues = Object.entries(values)
    .map(([field, value]) => validateField(field, value))
    .filter((issue): issue is DatasetValidationIssue => issue !== null);

  const primaryIssue = issues[0];

  return {
    validationState: primaryIssue
      ? primaryIssue.kind === "missing"
        ? "missing"
        : "invalid"
      : "valid",
    validationField: primaryIssue?.field,
    issues,
  };
}

export function getSuggestionIssueKey(suggestion: AISuggestion) {
  return `${suggestion.action}:${suggestion.targetField ?? ""}:${
    suggestion.title
  }`;
}

export function getValidationIssueKey(issue: DatasetValidationIssue) {
  const suggestedValueKey =
    issue.action === "standardize_value" || issue.action === "fill_missing"
      ? `:${String(issue.suggestedValue ?? "")}`
      : "";

  return `${issue.action}:${issue.field}:${issue.title}${suggestedValueKey}`;
}

export function rowHasSuggestionIssue(
  values: Record<string, DatasetCellValue>,
  suggestion: AISuggestion
) {
  if (!suggestion.targetField) return false;

  return validateDatasetRow(values).issues.some((issue) => {
    if (issue.field !== suggestion.targetField) return false;

    if (suggestion.action === "fill_missing" || suggestion.type === "missing") {
      return issue.kind === "missing";
    }

    if (issue.action !== suggestion.action) {
      return false;
    }

    if (
      suggestion.action === "standardize_value" ||
      suggestion.action === "flag_invalid"
    ) {
      return issue.suggestedValue === suggestion.suggestedValue;
    }

    return issue.title === suggestion.title;
  });
}
