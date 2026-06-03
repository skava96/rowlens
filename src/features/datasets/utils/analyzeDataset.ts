import { AISuggestion, DatasetRow } from "@/types/dataset";

type SuggestionBucket = {
  type: AISuggestion["type"];
  title: string;
  description: string;
  confidence: number;
  severity: AISuggestion["severity"];
  affectedRows: number[];
  action: AISuggestion["action"];
  targetField: string;
  suggestedValue: AISuggestion["suggestedValue"];
};

function isEmailField(field: string) {
  return field.toLowerCase().includes("email");
}

function isDateField(field: string) {
  return field.toLowerCase().includes("date");
}

function isCountryField(field: string) {
  return field.toLowerCase() === "country";
}

function isAccountStatusField(field: string) {
  const normalized = field.toLowerCase();
  return normalized === "account_status" || normalized === "account status";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

function createSuggestionId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function getEmailAutoFix(value: string) {
  const normalized = value.trim();

  if (isValidEmail(normalized)) return null;

  if (
    !normalized.includes("@") &&
    normalized.toLowerCase().includes("atsign.")
  ) {
    return normalized.replace(/atsign/i, "@");
  }

  return null;
}

function getStandardizedCountry(value: string) {
  const normalized = value.trim().toLowerCase();

  const countryMap: Record<string, string> = {
    usa: "United States",
    us: "United States",
    "u.s.a.": "United States",
    uk: "United Kingdom",
    uae: "United Arab Emirates",
  };

  return countryMap[normalized] ?? null;
}

function getStandardizedAccountStatus(value: string) {
  const normalized = value.trim().toLowerCase();

  const statusMap: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
    churned: "Churned",
    pending: "Pending",
    trial: "Trial",
  };

  const standardized = statusMap[normalized];

  if (!standardized || standardized === value.trim()) {
    return null;
  }

  return standardized;
}

export function analyzeDataset(rows: DatasetRow[]) {
  const suggestionBuckets = new Map<string, SuggestionBucket>();

  const addSuggestion = (key: string, suggestion: SuggestionBucket) => {
    const existing = suggestionBuckets.get(key);

    if (existing) {
      existing.affectedRows.push(...suggestion.affectedRows);
      return;
    }

    suggestionBuckets.set(key, suggestion);
  };

  const analyzedRows: DatasetRow[] = rows.map((row) => {
    let validationState: DatasetRow["validationState"] = "valid";
    let validationField: string | undefined;

    for (const [field, value] of Object.entries(row.values)) {
      const normalized = typeof value === "string" ? value.trim() : value;

      const isMissing =
        normalized === null || normalized === undefined || normalized === "";

      if (isMissing) {
        validationState = "missing";
        validationField = field;

        addSuggestion(`missing-${field}`, {
          type: "missing",
          title: `Missing values in ${field}`,
          description: `Some rows have missing values in the "${field}" column.`,
          confidence: 96,
          affectedRows: [row.id],
          severity: "medium",
          action: "fill_missing",
          targetField: field,
          suggestedValue: null,
        });

        break;
      }

      if (typeof normalized === "string" && isEmailField(field)) {
        const emailAutoFix = getEmailAutoFix(normalized);

        if (emailAutoFix) {
          validationState = "invalid";
          validationField = field;

          addSuggestion(`standardize-email-${field}`, {
            type: "validation",
            title: "Fix invalid email format",
            description: `Some rows contain email values that can be safely corrected in the "${field}" column.`,
            confidence: 97,
            affectedRows: [row.id],
            severity: "high",
            action: "standardize_value",
            targetField: field,
            suggestedValue: emailAutoFix,
          });

          break;
        }

        if (!isValidEmail(normalized)) {
          validationState = "invalid";
          validationField = field;

          addSuggestion(`invalid-email-${field}`, {
            type: "validation",
            title: "Invalid email format",
            description: `Some rows contain invalid email addresses in the "${field}" column.`,
            confidence: 98,
            affectedRows: [row.id],
            severity: "high",
            action: "flag_invalid",
            targetField: field,
            suggestedValue: null,
          });

          break;
        }
      }

      if (
        typeof normalized === "string" &&
        isDateField(field) &&
        !isValidDate(normalized)
      ) {
        validationState = "invalid";
        validationField = field;

        addSuggestion(`invalid-date-${field}`, {
          type: "validation",
          title: "Invalid date format",
          description: `Some rows contain invalid dates in the "${field}" column.`,
          confidence: 92,
          affectedRows: [row.id],
          severity: "medium",
          action: "flag_invalid",
          targetField: field,
          suggestedValue: null,
        });

        break;
      }

      if (typeof normalized === "string" && isCountryField(field)) {
        const standardizedCountry = getStandardizedCountry(normalized);

        if (standardizedCountry) {
          validationState = "invalid";
          validationField = field;

          addSuggestion(`standardize-country-${field}`, {
            type: "validation",
            title: "Standardize country value",
            description: `Some rows use non-standard country values in the "${field}" column.`,
            confidence: 94,
            affectedRows: [row.id],
            severity: "low",
            action: "standardize_value",
            targetField: field,
            suggestedValue: standardizedCountry,
          });

          break;
        }
      }

      if (typeof normalized === "string" && isAccountStatusField(field)) {
        const standardizedStatus = getStandardizedAccountStatus(normalized);

        if (standardizedStatus) {
          validationState = "invalid";
          validationField = field;

          addSuggestion(`standardize-account-status-${field}`, {
            type: "validation",
            title: "Standardize account status",
            description: `Some rows use inconsistent account status values in the "${field}" column.`,
            confidence: 93,
            affectedRows: [row.id],
            severity: "low",
            action: "standardize_value",
            targetField: field,
            suggestedValue: standardizedStatus,
          });

          break;
        }
      }
    }

    return {
      ...row,
      validationState,
      validationField,
    };
  });

  const suggestions: AISuggestion[] = Array.from(suggestionBuckets.values()).map(
    (suggestion) => ({
      id: createSuggestionId(suggestion.title),
      ...suggestion,
      status: "pending",
    })
  );

  return {
    rows: analyzedRows,
    suggestions,
  };
}