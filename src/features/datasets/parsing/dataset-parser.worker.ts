import { readSheet } from "read-excel-file/web-worker";

import { parseDatasetFileWithXlsxReader } from "@/features/datasets/utils/parseDatasetFile";

self.onmessage = async (event: MessageEvent<{ file: File }>) => {
    try {
        const { file } = event.data;

        const parsedDataset = await parseDatasetFileWithXlsxReader(
            file,
            readSheet
        );

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
