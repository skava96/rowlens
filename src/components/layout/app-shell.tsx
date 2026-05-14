import type { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
