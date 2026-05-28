export type DatasetTableRenderingMode = "paginated" | "virtualized";

export type DatasetTableRenderState = {
  mode: DatasetTableRenderingMode;
  totalRows: number;
  renderedRows: number;
  virtualizationReady: boolean;
};