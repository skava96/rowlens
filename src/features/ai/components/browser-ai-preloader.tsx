"use client";

import { useEffect } from "react";

import { preloadBrowserAI } from "../preloadBrowserAI";

let hasStartedPreload = false;

export function BrowserAIPreloader() {
  useEffect(() => {
    // React Strict Mode can mount this component twice in development. The
    // module-level guard keeps warmup background-only and idempotent.
    if (hasStartedPreload) return;

    hasStartedPreload = true;
    void preloadBrowserAI();
  }, []);

  return null;
}
