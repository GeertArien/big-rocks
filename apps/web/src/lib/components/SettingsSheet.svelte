<script lang="ts">
  import { Copy, ExternalLink, KeyRound, Plus } from "lucide-svelte";
  import { Sheet } from "@/lib/components/ui/sheet";
  import { Button } from "@/lib/components/ui/button";
  import { Input } from "@/lib/components/ui/input";
  import { toast } from "@/lib/components/ui/toast";
  import { getToken, setToken } from "@/lib/token";
  import {
    createApiKey,
    listApiKeys,
    revokeApiKey,
    type ApiKeyView,
  } from "@/lib/api";

  type Health = "checking" | "ok" | "down";
  type Props = { open: boolean; health: Health; onSaved: () => void };
  let { open = $bindable(), health, onSaved }: Props = $props();

  let tokenInput = $state(getToken());

  // --- Agent & service access ---------------------------------------------
  let keys = $state<ApiKeyView[]>([]);
  let keysError = $state(false);
  let newKeyName = $state("");
  /** Plaintext of a freshly created key — visible exactly once. */
  let freshKey = $state<string | null>(null);

  let lastOpen = $state(false);
  $effect(() => {
    if (open && !lastOpen) {
      tokenInput = getToken();
      freshKey = null;
      loadKeys();
    }
    lastOpen = open;
  });

  async function loadKeys() {
    try {
      keys = await listApiKeys();
      keysError = false;
    } catch {
      keysError = true;
    }
  }

  async function addKey() {
    const name = newKeyName.trim();
    if (!name) return;
    try {
      const created = await createApiKey(name);
      freshKey = created.key;
      newKeyName = "";
      loadKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create key");
    }
  }

  async function revoke(key: ApiKeyView) {
    try {
      await revokeApiKey(key.id);
      toast.success(`“${key.name}” revoked`);
      loadKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke key");
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
  }

  const statusMeta = $derived(
    health === "ok"
      ? { label: "Connected", dot: "bg-[var(--pine)]", text: "text-[var(--pine)]" }
      : health === "down"
        ? { label: "Unreachable", dot: "bg-[var(--terra)]", text: "text-[var(--terra)]" }
        : { label: "Checking…", dot: "bg-[var(--gold)]", text: "text-[var(--gold)]" },
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

<Sheet bind:open title="Settings" description="Connection, API access, and agents.">
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

    <!-- Agent & service access -->
    <div class="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
      <div class="flex items-center gap-2">
        <KeyRound class="size-4 text-[var(--color-muted-foreground)]" />
        <span class="text-sm font-medium">Agent &amp; service access</span>
      </div>
      <p class="text-xs text-[var(--color-muted-foreground)]">
        Named API keys for agents and services. The REST API is the source of
        truth; the MCP server wraps the same services.
      </p>

      {#if freshKey}
        <div class="flex flex-col gap-1.5 rounded-lg border border-[var(--pine)] bg-[var(--pine-soft)] p-2.5">
          <p class="text-xs font-semibold text-[var(--pine)]">
            Copy this key now — it won't be shown again.
          </p>
          <div class="flex items-center gap-1.5">
            <code class="min-w-0 flex-1 truncate rounded bg-[var(--color-card)] px-2 py-1 font-mono text-[11px]">
              {freshKey}
            </code>
            <Button variant="outline" size="sm" onclick={() => copy(freshKey!, "Key")}>
              <Copy class="size-3" />
            </Button>
          </div>
        </div>
      {/if}

      {#if keysError}
        <p class="text-xs text-[var(--terra)]">
          Couldn't load keys — check the token above.
        </p>
      {:else}
        {#each keys as key (key.id)}
          <div
            class="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-2.5 py-2"
            class:opacity-50={key.revokedAt}
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-[13px] font-medium" class:line-through={key.revokedAt}>
                {key.name}
              </p>
              <p class="text-[11px] text-[var(--color-muted-foreground)]">
                {key.revokedAt
                  ? `revoked ${new Date(key.revokedAt).toLocaleDateString()}`
                  : key.lastUsedAt
                    ? `last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                    : "never used"}
              </p>
            </div>
            {#if !key.revokedAt}
              <Button variant="outline" size="sm" onclick={() => revoke(key)}>Revoke</Button>
            {/if}
          </div>
        {/each}
      {/if}

      <div class="flex gap-2">
        <Input
          bind:value={newKeyName}
          placeholder="key name — “Claude · planning agent”"
          onkeydown={(e: KeyboardEvent) => e.key === "Enter" && addKey()}
        />
        <Button size="sm" onclick={addKey} disabled={!newKeyName.trim()}>
          <Plus class="size-4" />
          Key
        </Button>
      </div>

      <div class="mt-1 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onclick={() => window.open("/docs", "_blank")}>
          <ExternalLink class="size-3" />
          API docs
        </Button>
        <Button
          variant="outline"
          size="sm"
          onclick={() =>
            copy("pnpm --filter @big-rocks/mcp start", "MCP command")}
        >
          <Copy class="size-3" />
          MCP command
        </Button>
      </div>
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
