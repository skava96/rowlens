import { DatasetCellValue } from "@/types/dataset";

export function getRowValidationState(
    values: Record<string, DatasetCellValue>
): {
    validationState: "valid" | "missing" | "invalid";
    validationField?: string;
} {
    const entries = Object.entries(values);

    const missingEntry = entries.find(([, value]) => {
        return value === null || value === undefined || value === "";
    });

    if (missingEntry) {
        return {
            validationState: "missing",
            validationField: missingEntry[0],
        };
    }

    const emailEntry = entries.find(([key, value]) => {
        return (
            key.toLowerCase().includes("email") &&
            typeof value === "string" &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        );
    });

    if (emailEntry) {
        return {
            validationState: "invalid",
            validationField: emailEntry[0],
        };
    }

    return {
        validationState: "valid",
    };
}