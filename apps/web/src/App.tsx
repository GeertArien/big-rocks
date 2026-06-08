import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getHealth } from "@/lib/api";

const QUADRANTS = [
  { id: "Q1", title: "Urgent & Important", hint: "Do now", accent: "bg-red-500" },
  {
    id: "Q2",
    title: "Important, Not Urgent",
    hint: "Big rocks — plan first",
    accent: "bg-emerald-500",
  },
  {
    id: "Q3",
    title: "Urgent, Not Important",
    hint: "Delegate / minimize",
    accent: "bg-amber-500",
  },
  {
    id: "Q4",
    title: "Not Urgent, Not Important",
    hint: "Eliminate",
    accent: "bg-slate-400",
  },
] as const;

export default function App() {
  const [health, setHealth] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    getHealth()
      .then(() => setHealth("ok"))
      .catch(() => setHealth("down"));
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">BigRocks</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Put the big rocks in first. (Scaffold — the matrix becomes interactive
          in build step 2.)
        </p>
      </header>

      <section
        aria-label="Quadrant matrix"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {QUADRANTS.map((q) => (
          <div
            key={q.id}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${q.accent}`} />
              <span className="text-xs font-medium text-[var(--color-muted-foreground)]">
                {q.id}
              </span>
            </div>
            <h2 className="mt-1 text-sm font-semibold">{q.title}</h2>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {q.hint}
            </p>
          </div>
        ))}
      </section>

      <footer className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-muted-foreground)]">
          Backend:{" "}
          <span
            className={
              health === "ok"
                ? "text-emerald-600"
                : health === "down"
                  ? "text-red-600"
                  : "text-amber-600"
            }
          >
            {health === "checking"
              ? "checking…"
              : health === "ok"
                ? "connected"
                : "unreachable"}
          </span>
        </span>
        <Button size="sm" variant="outline" onClick={() => location.reload()}>
          Refresh
        </Button>
      </footer>
    </main>
  );
}
