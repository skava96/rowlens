import { DatasetParser } from "./dataset-parser";
import { parseDatasetFile } from "../utils/parseDatasetFile";

// Prototype adapter: parses locally in the browser.
// Production path: replace with workerDatasetParser or server-backed parser.

export const clientDatasetParser: DatasetParser = {
  async parse(file) {
    return parseDatasetFile(file);
  },
};