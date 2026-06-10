import { getAiStatus } from "@/lib/api";

/** Whether the server has an AI provider configured — gates the ✦ surfaces. */
class AiStore {
  available = $state(false);

  async check(): Promise<void> {
    try {
      this.available = (await getAiStatus()).available;
    } catch {
      this.available = false;
    }
  }
}

export const aiStore = new AiStore();
