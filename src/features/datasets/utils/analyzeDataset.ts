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

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidDate(value: string) {
    return !Number.isNaN(Date.parse(value));
}

function createSuggestionId(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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
                    suggestedValue: "Unknown",
                });

                break;
            }

            if (
                typeof normalized === "string" &&
                isEmailField(field) &&
                !isValidEmail(normalized)
            ) {
                validationState = "invalid";
                validationField = field;

                addSuggestion(`invalid-email-${field}`, {
                    type: "validation",
                    title: `Invalid email format`,
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

            if (
                typeof normalized === "string" &&
                isDateField(field) &&
                !isValidDate(normalized)
            ) {
                validationState = "invalid";
                validationField = field;

                addSuggestion(`invalid-date-${field}`, {
                    type: "validation",
                    title: `Invalid date format`,
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