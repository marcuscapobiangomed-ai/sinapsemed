// Typed helpers for chrome.storage.local

const KEYS = {
  SELECTED_TEXT: "sinapsemed_selected_text",
  SELECTED_URL: "sinapsemed_selected_url",
  SELECTED_TITLE: "sinapsemed_selected_title",
  OFFLINE_QUEUE: "sinapsemed_offline_queue",
  CACHED_DECKS: "sinapsemed_cached_decks",
  PREFERRED_TAB: "sinapsemed_preferred_tab",
} as const;

export interface QueueItem {
  id: string;
  action: "create_flashcard";
  payload: {
    front: string;
    back: string;
    deck_id: string;
    tags?: string[];
    source: "extension_text" | "extension_image";
    source_url?: string;
    front_image_url?: string;
  };
  created_at: string;
  retry_count: number;
}

export async function getSelectedText(): Promise<{
  text: string;
  url: string;
  title: string;
} | null> {
  const result = await chrome.storage.local.get([
    KEYS.SELECTED_TEXT,
    KEYS.SELECTED_URL,
    KEYS.SELECTED_TITLE,
  ]);
  if (!result[KEYS.SELECTED_TEXT]) return null;
  return {
    text: result[KEYS.SELECTED_TEXT],
    url: result[KEYS.SELECTED_URL] ?? "",
    title: result[KEYS.SELECTED_TITLE] ?? "",
  };
}

export async function setSelectedText(
  text: string,
  url: string,
  title: string,
): Promise<void> {
  await chrome.storage.local.set({
    [KEYS.SELECTED_TEXT]: text,
    [KEYS.SELECTED_URL]: url,
    [KEYS.SELECTED_TITLE]: title,
  });
}

export async function clearSelectedText(): Promise<void> {
  await chrome.storage.local.remove([
    KEYS.SELECTED_TEXT,
    KEYS.SELECTED_URL,
    KEYS.SELECTED_TITLE,
  ]);
}

// ── Offline Queue ──

export async function getQueue(): Promise<QueueItem[]> {
  const result = await chrome.storage.local.get(KEYS.OFFLINE_QUEUE);
  return result[KEYS.OFFLINE_QUEUE] ?? [];
}

export async function addToQueue(item: Omit<QueueItem, "id" | "created_at" | "retry_count">): Promise<void> {
  const queue = await getQueue();
  queue.push({
    ...item,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    retry_count: 0,
  });
  await chrome.storage.local.set({ [KEYS.OFFLINE_QUEUE]: queue });
  await updateBadge();
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.id !== id);
  await chrome.storage.local.set({ [KEYS.OFFLINE_QUEUE]: filtered });
  await updateBadge();
}

export async function incrementRetry(id: string): Promise<void> {
  const queue = await getQueue();
  const item = queue.find((i) => i.id === id);
  if (item) {
    item.retry_count++;
    await chrome.storage.local.set({ [KEYS.OFFLINE_QUEUE]: queue });
  }
}

export async function updateBadge(): Promise<void> {
  const queue = await getQueue();
  const count = queue.length;
  await chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#EF4444" });
}

// ── Preferred Tab ──

export async function setPreferredTab(
  tab: "flashcard" | "chat",
): Promise<void> {
  await chrome.storage.local.set({ [KEYS.PREFERRED_TAB]: tab });
}

export async function getAndClearPreferredTab(): Promise<
  "flashcard" | "chat" | null
> {
  const result = await chrome.storage.local.get(KEYS.PREFERRED_TAB);
  const tab = result[KEYS.PREFERRED_TAB] ?? null;
  if (tab) await chrome.storage.local.remove(KEYS.PREFERRED_TAB);
  return tab;
}

// ── Cached Decks ──

export async function getCachedDecks(): Promise<
  Array<{ id: string; title: string; color: string }> | null
> {
  const result = await chrome.storage.local.get(KEYS.CACHED_DECKS);
  return result[KEYS.CACHED_DECKS] ?? null;
}

export async function setCachedDecks(
  decks: Array<{ id: string; title: string; color: string }>,
): Promise<void> {
  await chrome.storage.local.set({ [KEYS.CACHED_DECKS]: decks });
}
