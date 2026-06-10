import type { ComponentType } from "svelte";
import { BookOpen, Clock3, Compass } from "lucide-svelte";

/**
 * Navigation model (docs/design/ui-ux.md): three modes as tenses —
 * Compass defines, Clock does, Almanac remembers — each with sub-screens.
 */
export type Mode = "compass" | "clock" | "almanac";

export type CompassSub = "goals" | "projects" | "matrix" | "people" | "renew";
export type ClockSub = "today" | "week";
export type AlmanacSub = "review" | "season";
export type Sub = CompassSub | ClockSub | AlmanacSub;

export interface ModeItem {
  id: Mode;
  label: string;
  icon: ComponentType;
  /** CSS color var carrying the mode's accent through the chrome. */
  accent: string;
}

export interface SubItem {
  id: Sub;
  label: string;
  /** Serif page title shown above the sub-tabs. */
  title: string;
  subtitle: string;
}

export const MODES: ModeItem[] = [
  { id: "compass", label: "Compass", icon: Compass, accent: "var(--pine)" },
  { id: "clock", label: "Clock", icon: Clock3, accent: "var(--terra)" },
  { id: "almanac", label: "Almanac", icon: BookOpen, accent: "var(--gold)" },
];

export const SUBS: Record<Mode, SubItem[]> = {
  compass: [
    {
      id: "goals",
      label: "Mission & Goals",
      title: "Begin with the end in mind.",
      subtitle: "Your mission, the roles you live by, and the results that matter most.",
    },
    {
      id: "projects",
      label: "Projects",
      title: "Goals become action.",
      subtitle: "Multi-step outcomes, each traceable to a goal. Loose tasks wait in the Inbox.",
    },
    {
      id: "matrix",
      label: "Matrix",
      title: "The weekly compass.",
      subtitle: "Every open task by importance × urgency. Live in Quadrant II.",
    },
    {
      id: "people",
      label: "People",
      title: "The people who matter.",
      subtitle: "Recurring commitments kept on cadence, and an emotional bank account each.",
    },
    {
      id: "renew",
      label: "Renew",
      title: "Sharpen the saw.",
      subtitle: "Define the habits that renew you — a dimension, a cadence, the goal each serves.",
    },
  ],
  clock: [
    {
      id: "today",
      label: "Today",
      title: "First things first.",
      subtitle: "Today's rocks and today's work. Everything else can wait.",
    },
    {
      id: "week",
      label: "Week",
      title: "Schedule the rocks first.",
      subtitle: "Pin Q2 tasks as big rocks; the small things fill the gaps.",
    },
  ],
  almanac: [
    {
      id: "review",
      label: "Review",
      title: "What you actually did.",
      subtitle: "Read-only by design — only evidence, gathered over weeks.",
    },
    {
      id: "season",
      label: "The Season",
      title: "How the season is trending.",
      subtitle: "Streaks count weeks the target was met — an unfinished week never breaks the chain.",
    },
  ],
};

const DEFAULT_SUB: Record<Mode, Sub> = {
  compass: "goals",
  clock: "today",
  almanac: "review",
};

class NavStore {
  /** Clock · Today is the everyday home screen. */
  mode = $state<Mode>("clock");
  sub = $state<Sub>("today");

  go(mode: Mode, sub?: Sub): void {
    this.mode = mode;
    this.sub = sub ?? DEFAULT_SUB[mode];
  }

  goSub(sub: Sub): void {
    this.sub = sub;
  }

  get modeItem(): ModeItem {
    return MODES.find((m) => m.id === this.mode) ?? MODES[0]!;
  }

  get subItem(): SubItem {
    return SUBS[this.mode].find((s) => s.id === this.sub) ?? SUBS[this.mode][0]!;
  }
}

export const navStore = new NavStore();
