import { mount } from "svelte";
import { registerSW } from "virtual:pwa-register";
import App from "./App.svelte";
import { navStore, type Mode, type Sub } from "@/lib/stores/nav.svelte";
import "./app.css";

registerSW({ immediate: true });

/** Notification deep links: "/?go=compass.people" → the People screen. */
function navigateTo(url: string) {
  const go = new URL(url, location.origin).searchParams.get("go");
  if (!go) return;
  const [mode, sub] = go.split(".") as [Mode, Sub | undefined];
  if (["compass", "clock", "almanac"].includes(mode)) navStore.go(mode, sub);
}

navigateTo(location.href);
navigator.serviceWorker?.addEventListener("message", (event) => {
  if (event.data?.type === "navigate" && typeof event.data.url === "string") {
    navigateTo(event.data.url);
  }
});

const target = document.getElementById("app");
if (!target) throw new Error("Root element #app not found");

const app = mount(App, { target });

export default app;
