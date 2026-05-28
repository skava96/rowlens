import { DatasetCellValue } from "@/types/dataset";

export function createRowSearchText(
  values: Record<string, DatasetCellValue>
) {
  return Object.values(values)
    .filter((value) => value != null)
    .map((value) => String(value).toLowerCase())
    .join(" ");
}