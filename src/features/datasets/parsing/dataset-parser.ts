import { ParsedDataset } from "../utils/parseDatasetFile";

export interface DatasetParser {
  parse(file: File): Promise<ParsedDataset>;
}