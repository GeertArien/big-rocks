<script lang="ts">
  import { BellRing } from "lucide-svelte";
  import { Button } from "@/lib/components/ui/button";
  import { toast } from "@/lib/components/ui/toast";
  import {
    getNotificationSettings,
    getPushStatus,
    pushSubscribe,
    pushTest,
    pushUnsubscribe,
    updateNotificationSettings,
    type NotificationSettings,
  } from "@/lib/api";

  let configured = $state(false);
  let publicKey = $state<string | null>(null);
  let subscribed = $state(false);
  let settings = $state<NotificationSettings | null>(null);
  let busy = $state(false);

  export async function load(): Promise<void> {
    try {
      const status = await getPushStatus();
      configured = status.configured;
      publicKey = status.publicKey;
      settings = await getNotificationSettings();
      const registration = await navigator.serviceWorker?.ready;
      subscribed = !!(await registration?.pushManager.getSubscription());
    } catch {
      configured = false;
    }
  }

  function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
    const out = new Uint8Array(new ArrayBuffer(raw.length));
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  async function enable() {
    if (!publicKey || busy) return;
    busy = true;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notifications were not allowed by the browser");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await pushSubscribe(subscription.toJSON());
      subscribed = true;
      toast.success("This device will receive notifications");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not enable push");
    } finally {
      busy = false;
    }
  }

  async function disable() {
    if (busy) return;
    busy = true;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await pushUnsubscribe(subscription.endpoint);
        await subscription.unsubscribe();
      }
      subscribed = false;
      toast.success("Push disabled on this device");
    } finally {
      busy = false;
    }
  }

  async function save(partial: Partial<NotificationSettings>) {
    if (!settings) return;
    settings = { ...settings, ...partial };
    try {
      settings = await updateNotificationSettings(partial);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    }
  }

  const TOGGLES = [
    { key: "overdueCommitments", label: "Overdue commitments", hint: "when a cadence slips · max 1/day" },
    { key: "morningRocks", label: "Morning rock reminder", hint: "open big rocks, at your morning hour" },
    { key: "weeklyReview", label: "Weekly review", hint: "Sunday evening — look back, plan ahead" },
  ] as const;
</script>

<div class="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
  <div class="flex items-center gap-2">
    <BellRing class="size-4 text-[var(--color-muted-foreground)]" />
    <span class="text-sm font-medium">Notifications</span>
  </div>

  {#if !configured}
    <p class="text-xs text-[var(--color-muted-foreground)]">
      Web push is off — set <code>VAPID_PUBLIC_KEY</code>/<code>VAPID_PRIVATE_KEY</code>
      on the server to enable it.
    </p>
  {:else}
    <div class="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2.5">
      <div>
        <p class="text-[0.8125rem] font-medium">Push on this device</p>
        <p class="text-[0.6875rem] text-[var(--color-muted-foreground)]">
          Works installed as a PWA, even with the app closed.
        </p>
      </div>
      {#if subscribed}
        <div class="flex gap-1.5">
          <Button variant="outline" size="sm" onclick={() => pushTest().then(() => toast.success("Test sent"))}>
            Test
          </Button>
          <Button variant="outline" size="sm" onclick={disable} disabled={busy}>Disable</Button>
        </div>
      {:else}
        <Button size="sm" onclick={enable} disabled={busy}>
          {busy ? "Enabling…" : "Enable"}
        </Button>
      {/if}
    </div>

    {#if settings}
      {#each TOGGLES as toggle (toggle.key)}
        <div class="flex items-center justify-between gap-3 py-1">
          <div>
            <p class="text-[0.8125rem] font-medium">{toggle.label}</p>
            <p class="text-[0.6875rem] text-[var(--color-muted-foreground)]">{toggle.hint}</p>
          </div>
          <button
            role="switch"
            aria-checked={settings[toggle.key]}
            aria-label={toggle.label}
            onclick={() => save({ [toggle.key]: !settings![toggle.key] })}
            class="relative h-6 w-10 shrink-0 rounded-full transition-colors {settings[toggle.key]
              ? 'bg-[var(--pine)]'
              : 'bg-[var(--color-input)]'}"
          >
            <span
              class="absolute top-0.5 size-5 rounded-full bg-white transition-[left] {settings[toggle.key]
                ? 'left-[18px]'
                : 'left-0.5'}"
            ></span>
          </button>
        </div>
      {/each}

      <div class="flex flex-wrap items-center gap-2 pt-1 text-[0.75rem] text-[var(--color-muted-foreground)]">
        <span>Morning hour</span>
        <select
          value={settings.morningHour}
          onchange={(e) => save({ morningHour: Number((e.currentTarget as HTMLSelectElement).value) })}
          class="rounded-md border border-[var(--color-input)] bg-transparent px-1.5 py-0.5 text-xs"
        >
          {#each [5, 6, 7, 8, 9, 10] as h (h)}
            <option value={h}>{h}:00</option>
          {/each}
        </select>
        <span class="ml-2">Quiet</span>
        <select
          value={settings.quietStart}
          onchange={(e) => save({ quietStart: Number((e.currentTarget as HTMLSelectElement).value) })}
          class="rounded-md border border-[var(--color-input)] bg-transparent px-1.5 py-0.5 text-xs"
        >
          {#each [20, 21, 22, 23] as h (h)}
            <option value={h}>{h}:00</option>
          {/each}
        </select>
        <span>–</span>
        <select
          value={settings.quietEnd}
          onchange={(e) => save({ quietEnd: Number((e.currentTarget as HTMLSelectElement).value) })}
          class="rounded-md border border-[var(--color-input)] bg-transparent px-1.5 py-0.5 text-xs"
        >
          {#each [5, 6, 7, 8, 9] as h (h)}
            <option value={h}>{h}:00</option>
          {/each}
        </select>
      </div>
    {/if}
  {/if}
</div>
