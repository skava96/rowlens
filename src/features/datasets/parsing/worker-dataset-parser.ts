import { ParsedDataset } from "../utils/parseDatasetFile";
import { DatasetParser } from "./dataset-parser";

type ParserWorkerSuccessMessage = {
  type: "success";
  payload: ParsedDataset;
};

type ParserWorkerErrorMessage = {
  type: "error";
  error: string;
};

type ParserWorkerMessage =
  | ParserWorkerSuccessMessage
  | ParserWorkerErrorMessage;

export const workerDatasetParser: DatasetParser = {
  parse(file) {
    return new Promise<ParsedDataset>((resolve, reject) => {
      const worker = new Worker(
        new URL("./dataset-parser.worker.ts", import.meta.url),
        { type: "module" }
      );

      worker.onmessage = (event: MessageEvent<ParserWorkerMessage>) => {
        worker.terminate();

        if (event.data.type === "success") {
          resolve(event.data.payload);
          return;
        }

        reject(new Error(event.data.error));
      };

      worker.onerror = () => {
        worker.terminate();
        reject(new Error("Dataset parser worker failed."));
      };

      worker.postMessage({ file });
    });
  },
};