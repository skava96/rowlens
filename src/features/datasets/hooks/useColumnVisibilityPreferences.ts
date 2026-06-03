"use client";

import { useEffect, useMemo, useState } from "react";

import { DatasetColumn } from "@/types/dataset";

const getColumnVisibilityKey = (schemaKey: string) =>
  `cleanflow-visible-columns:${schemaKey}`;

type UseColumnVisibilityPreferencesArgs = {
  datasetId: string;
  columns: DatasetColumn[];
};

export function useColumnVisibilityPreferences({
  datasetId,
  columns,
}: UseColumnVisibilityPreferencesArgs) {
  const schemaKey = useMemo(() => {
    const columnSignature = columns.map((column) => column.key).join("|");

    return `${datasetId}:${columnSignature}`;
  }, [datasetId, columns]);

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[] | null>(
    () => {
      if (typeof window === "undefined") return null;
      if (!schemaKey) return null;

      try {
        const stored = localStorage.getItem(getColumnVisibilityKey(schemaKey));
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
  );

  const [columnSearchQuery, setColumnSearchQuery] = useState("");

  const defaultVisibleColumnKeys = useMemo(
    () => columns.map((column) => column.key),
    [columns]
  );

  const activeVisibleColumnKeys =
    visibleColumnKeys ?? defaultVisibleColumnKeys;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!schemaKey || columns.length === 0) return;

    localStorage.setItem(
      getColumnVisibilityKey(schemaKey),
      JSON.stringify(activeVisibleColumnKeys)
    );
  }, [activeVisibleColumnKeys, schemaKey, columns.length]);

  const visibleColumnKeySet = useMemo(
    () => new Set(activeVisibleColumnKeys),
    [activeVisibleColumnKeys]
  );

  const filteredVisibilityColumns = useMemo(() => {
    const query = columnSearchQuery.trim().toLowerCase();

    if (!query) return columns;

    return columns.filter(
      (column) =>
        column.label.toLowerCase().includes(query) ||
        column.key.toLowerCase().includes(query)
    );
  }, [columns, columnSearchQuery]);

  const allColumnsVisible =
    columns.length > 0 &&
    columns.every((column) => visibleColumnKeySet.has(column.key));

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumnKeys((current) => {
      const currentKeys = current ?? defaultVisibleColumnKeys;

      if (currentKeys.includes(columnKey)) {
        return currentKeys.filter((key) => key !== columnKey);
      }

      return [...currentKeys, columnKey];
    });
  };

  const showAllColumns = () => {
    setVisibleColumnKeys(defaultVisibleColumnKeys);
  };

  const hideAllColumns = () => {
    setVisibleColumnKeys([]);
  };

  return {
    schemaKey,
    columnSearchQuery,
    activeVisibleColumnKeys,
    visibleColumnKeySet,
    filteredVisibilityColumns,
    allColumnsVisible,
    activeVisibleColumnCount: activeVisibleColumnKeys.length,

    setColumnSearchQuery,
    toggleColumnVisibility,
    showAllColumns,
    hideAllColumns,
  };
}