/** Minimal, dependency-light toast store (runes). Mounted once via <Toaster />. */

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

class ToastStore {
  items = $state<Toast[]>([]);
  private seq = 0;

  private push(kind: ToastKind, message: string, ms: number): number {
    const id = ++this.seq;
    this.items = [...this.items, { id, kind, message }];
    if (ms > 0) setTimeout(() => this.dismiss(id), ms);
    return id;
  }

  success(message: string): number {
    return this.push("success", message, 3000);
  }

  error(message: string): number {
    return this.push("error", message, 5000);
  }

  info(message: string): number {
    return this.push("info", message, 3000);
  }

  dismiss(id: number): void {
    this.items = this.items.filter((t) => t.id !== id);
  }
}

export const toast = new ToastStore();
