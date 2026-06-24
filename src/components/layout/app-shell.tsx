import type { ReactNode } from "react";
import { BrowserAIPreloader } from "@/features/ai/components/browser-ai-preloader";
import { Navbar } from "./navbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
   <div className="min-h-screen bg-background z-[50]">
      <BrowserAIPreloader />
      <Navbar />

      <div className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
