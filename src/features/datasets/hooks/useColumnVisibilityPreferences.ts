"use client";

import { useEffect, useMemo, useState } from "react";

import { DatasetColumn } from "@/types/dataset";

const MAX_PINNED_COLUMNS = 2;

const getColumnVisibilityKey = (schemaKey: string) =>
  `rowlens-visible-columns:${schemaKey}`;

const getPinnedColumnsKey = (schemaKey: string) =>
  `rowlens-pinned-columns:${schemaKey}`;

type UseColumnVisibilityPreferencesArgs = {
  datasetId: string;
  columns: DatasetColumn[];
};

function readStoredStringArray(storageKey: string): string[] | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : null;

    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : null;
  } catch {
    return null;
  }
}

function getDefaultPinnedColumnKeys(columns: DatasetColumn[]) {
  const identityColumn = columns.find((column) => {
    const key = column.key.toLowerCase();

    return (
      key.includes("id") ||
      key.includes("name") ||
      key.includes("email")
    );
  });

  return identityColumn
    ? [identityColumn.key]
    : columns[0]
      ? [columns[0].key]
      : [];
}

export function useColumnVisibilityPreferences({
  datasetId,
  columns,
}: UseColumnVisibilityPreferencesArgs) {
  const schemaKey = useMemo(() => {
    const columnSignature = columns.map((column) => column.key).join("|");

    return `${datasetId}:${columnSignature}`;
  }, [datasetId, columns]);

  const defaultVisibleColumnKeys = useMemo(
    () => columns.map((column) => column.key),
    [columns]
  );

  const defaultPinnedColumnKeys = useMemo(
    () => getDefaultPinnedColumnKeys(columns),
    [columns]
  );

  const columnKeySet = useMemo(
    () => new Set(columns.map((column) => column.key)),
    [columns]
  );

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[] | null>(
    () => readStoredStringArray(getColumnVisibilityKey(schemaKey))
  );

  const [pinnedColumnKeys, setPinnedColumnKeys] = useState<string[] | null>(
    () => readStoredStringArray(getPinnedColumnsKey(schemaKey))
  );

  const [columnSearchQuery, setColumnSearchQuery] = useState("");

  const activeVisibleColumnKeys = useMemo(() => {
    const currentKeys = visibleColumnKeys ?? defaultVisibleColumnKeys;

    return currentKeys.filter((key) => columnKeySet.has(key));
  }, [visibleColumnKeys, defaultVisibleColumnKeys, columnKeySet]);

  const visibleColumnKeySet = useMemo(
    () => new Set(activeVisibleColumnKeys),
    [activeVisibleColumnKeys]
  );

  const activePinnedColumnKeys = useMemo(() => {
    const currentPinnedKeys = pinnedColumnKeys ?? defaultPinnedColumnKeys;

    return currentPinnedKeys
      .filter((key) => visibleColumnKeySet.has(key))
      .slice(0, MAX_PINNED_COLUMNS);
  }, [pinnedColumnKeys, defaultPinnedColumnKeys, visibleColumnKeySet]);

  const filteredVisibilityColumns = useMemo(() => {
    const query = columnSearchQuery.trim().toLowerCase();

    if (!query) return columns;

    return columns.filter(
      (column) =>
        column.label.toLowerCase().includes(query) ||
        column.key.toLowerCase().includes(query)
    );
  }, [columns, columnSearchQuery]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!schemaKey || columns.length === 0) return;

    localStorage.setItem(
      getColumnVisibilityKey(schemaKey),
      JSON.stringify(activeVisibleColumnKeys)
    );
  }, [activeVisibleColumnKeys, schemaKey, columns.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!schemaKey || columns.length === 0) return;

    localStorage.setItem(
      getPinnedColumnsKey(schemaKey),
      JSON.stringify(activePinnedColumnKeys)
    );
  }, [activePinnedColumnKeys, schemaKey, columns.length]);

  const toggleColumnVisibility = (columnKey: string) => {
    if (!columnKeySet.has(columnKey)) return;

    const wasVisible = visibleColumnKeySet.has(columnKey);

    if (wasVisible && activeVisibleColumnKeys.length <= 1) return;

    setVisibleColumnKeys((current) => {
      const currentKeys = current ?? defaultVisibleColumnKeys;

      return wasVisible
        ? currentKeys.filter((key) => key !== columnKey)
        : [...currentKeys, columnKey];
    });

    if (wasVisible) {
      setPinnedColumnKeys((current) => {
        const currentKeys = current ?? defaultPinnedColumnKeys;

        return currentKeys.filter((key) => key !== columnKey);
      });
    }
  };

  const showAllColumns = () => {
    setVisibleColumnKeys(defaultVisibleColumnKeys);
  };

  const hideAllColumns = () => {
    const fallbackColumnKey = defaultVisibleColumnKeys[0];

    setVisibleColumnKeys(fallbackColumnKey ? [fallbackColumnKey] : []);
    setPinnedColumnKeys([]);
  };

  const toggleColumnPin = (columnKey: string) => {
    if (!visibleColumnKeySet.has(columnKey)) return;

    setPinnedColumnKeys((current) => {
      const currentKeys = current ?? defaultPinnedColumnKeys;

      const sanitizedKeys = currentKeys
        .filter((key) => visibleColumnKeySet.has(key))
        .slice(0, MAX_PINNED_COLUMNS);

      if (sanitizedKeys.includes(columnKey)) {
        return sanitizedKeys.filter((key) => key !== columnKey);
      }

      if (sanitizedKeys.length >= MAX_PINNED_COLUMNS) {
        return sanitizedKeys;
      }

      return [...sanitizedKeys, columnKey];
    });
  };

  return {
    schemaKey,
    columnSearchQuery,
    activeVisibleColumnKeys,
    visibleColumnKeySet,
    filteredVisibilityColumns,
    activeVisibleColumnCount: activeVisibleColumnKeys.length,
    activePinnedColumnKeys,
    maxPinnedColumns: MAX_PINNED_COLUMNS,

    toggleColumnPin,
    setColumnSearchQuery,
    toggleColumnVisibility,
    showAllColumns,
    hideAllColumns,
  };
}
