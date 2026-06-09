<script lang="ts">
  import { Sheet } from "@/lib/components/ui/sheet";
  import { Button } from "@/lib/components/ui/button";
  import { Input } from "@/lib/components/ui/input";
  import { toast } from "@/lib/components/ui/toast";
  import { getToken, setToken } from "@/lib/token";

  type Health = "checking" | "ok" | "down";
  type Props = { open: boolean; health: Health; onSaved: () => void };
  let { open = $bindable(), health, onSaved }: Props = $props();

  let tokenInput = $state(getToken());

  const statusMeta = $derived(
    health === "ok"
      ? { label: "Connected", dot: "bg-emerald-500", text: "text-emerald-600" }
      : health === "down"
        ? { label: "Unreachable", dot: "bg-red-500", text: "text-red-600" }
        : { label: "Checking…", dot: "bg-amber-500", text: "text-amber-600" },
  );

  function save() {
    setToken(tokenInput.trim());
    toast.success(tokenInput.trim() ? "Token saved" : "Token cleared");
    open = false;
    onSaved();
  }

  function clear() {
    tokenInput = "";
    setToken("");
    toast.success("Token cleared");
    onSaved();
  }
</script>

<Sheet bind:open title="Settings" description="Connection and API access.">
  <div class="flex flex-col gap-5">
    <div class="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
      <span class="text-sm font-medium">Backend</span>
      <span class="flex items-center gap-2 text-sm {statusMeta.text}">
        <span class="size-2 rounded-full {statusMeta.dot}"></span>
        {statusMeta.label}
      </span>
    </div>

    <div class="flex flex-col gap-2">
      <label for="api-token" class="text-sm font-medium">API token</label>
      <p class="text-xs text-[var(--color-muted-foreground)]">
        Only needed if the server sets <code>API_AUTH_TOKEN</code>. Stored locally
        in this browser and sent as a bearer token.
      </p>
      <Input id="api-token" type="password" bind:value={tokenInput} placeholder="paste bearer token" />
    </div>
  </div>

  {#snippet footer()}
    <div class="flex justify-between gap-2">
      <Button variant="ghost" size="sm" onclick={clear}>Clear</Button>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" onclick={() => (open = false)}>Cancel</Button>
        <Button size="sm" onclick={save}>Save</Button>
      </div>
    </div>
  {/snippet}
</Sheet>
