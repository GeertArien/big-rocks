import type { ComponentType } from "svelte";
import { CalendarCheck, Compass, LayoutGrid, Target } from "lucide-svelte";

export type Section = "matrix" | "week" | "goals" | "mission";

export interface NavItem {
  id: Section;
  label: string;
  /** Short label for the mobile bottom bar. */
  short: string;
  icon: ComponentType;
}

/** Single source of truth for the app's top-level sections. */
export const NAV_ITEMS: NavItem[] = [
  { id: "matrix", label: "Matrix", short: "Matrix", icon: LayoutGrid },
  { id: "week", label: "This Week", short: "Week", icon: CalendarCheck },
  { id: "goals", label: "Goals", short: "Goals", icon: Target },
  { id: "mission", label: "Mission", short: "Mission", icon: Compass },
];

class NavStore {
  current = $state<Section>("matrix");

  go(section: Section): void {
    this.current = section;
  }
}

export const navStore = new NavStore();
