import { Activity, Database, Home, Settings, UploadCloud, Wand2 } from "lucide-react";

const navItems = [
  { title: "Dashboard", icon: Home, href: "#dashboard" },
  { title: "Uploads", icon: UploadCloud, href: "#uploads" },
  { title: "Datasets", icon: Database, href: "#datasets" },
  { title: "Cleaning Jobs", icon: Wand2, href: "#cleaning-jobs" },
  { title: "Activity", icon: Activity, href: "#activity" },
  { title: "Settings", icon: Settings, href: "#settings" },
];

export function Sidebar() {
  return (
    <aside className="hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 border-r border-border/80 bg-background/95 px-4 py-5 md:block">
      <div className="space-y-3">
        <div className="px-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Navigation
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.title}
                href={item.href}
                className="inline-flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-primary/10 hover:text-primary"
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
