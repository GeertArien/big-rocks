<script lang="ts">
  import { BookOpen } from "lucide-svelte";
</script>

<!-- The Almanac fills with habit streaks and trends once habits land (build steps 4–5). -->
<section
  class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--color-input)] bg-[var(--color-card)] px-6 py-14 text-center shadow-sm"
>
  <BookOpen class="size-7 text-[var(--gold)]" />
  <h2 class="font-display text-lg font-semibold">The record will gather here.</h2>
  <p class="max-w-md font-display text-sm italic leading-relaxed text-[var(--color-muted-foreground)]">
    Habit streaks, renewal across the four dimensions, goal momentum, and the
    season's heatmap — written as you live the weeks, never edited by hand.
  </p>
  <p class="text-xs text-[var(--color-muted-foreground)]">
    Arrives with habits &amp; renewal (build steps 4–5).
  </p>
</section>
