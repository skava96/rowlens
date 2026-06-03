import { createParsedDataset } from "@/features/datasets/utils/createParsedDataset";
import { validateDatasetFile, validateDatasetRowCount } from "./validate-dataset-file";

self.onmessage = async (event: MessageEvent<{ file: File }>) => {
    try {
        const { file } = event.data;

        validateDatasetFile(file);

        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();

        const workbook = XLSX.read(buffer, {
            type: "array",
            cellDates: true,
        });

        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
            throw new Error("No worksheet found in the uploaded file.");
        }

        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
            worksheet,
            {
                defval: null,
            }
        );

        validateDatasetRowCount(rawRows.length);

        const parsedDataset = createParsedDataset(rawRows);

        self.postMessage({
            type: "success",
            payload: parsedDataset,
        });
    } catch (error) {
        self.postMessage({
            type: "error",
            error:
                error instanceof Error
                    ? error.message
                    : "Dataset parsing failed.",
        });
    }
};