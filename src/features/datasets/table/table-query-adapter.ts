import { DatasetRow } from "@/types/dataset";
import {
  DatasetTableQuery,
  DatasetTableQueryResult,
} from "../types/table-query";

export interface DatasetTableQueryAdapter {
  queryRows(args: {
    rows: DatasetRow[];
    query: DatasetTableQuery;
  }): DatasetTableQueryResult<DatasetRow>;

  queryRowsAsync(args: {
    rows: DatasetRow[];
    query: DatasetTableQuery;
    signal?: AbortSignal;
  }): Promise<DatasetTableQueryResult<DatasetRow>>;
}