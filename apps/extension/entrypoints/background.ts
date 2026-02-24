import { supabase } from "@/lib/supabase";
import {
  setSelectedText,
  addToQueue,
  updateBadge,
  setCachedDecks,
  setPreferredTab,
} from "@/lib/storage";
import { processQueue } from "@/lib/offline-queue";
import { signInWithGoogle } from "@/lib/google-auth";
import type {
  Message,
  MessageResponse,
  CreateFlashcardPayload,
  SelectedTextPayload,
} from "@/lib/messages";

export default defineBackground(() => {
  // ── Icon click → open side panel ──
  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    }
  });

  // ── Context Menus ──
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "sinapsemed-create-flashcard",
      title: "SinapseMED: Criar flashcard",
      contexts: ["selection"],
    });

    chrome.contextMenus.create({
      id: "sinapsemed-create-flashcard-image",
      title: "SinapseMED: Criar flashcard com imagem",
      contexts: ["image"],
    });

    chrome.contextMenus.create({
      id: "sinapsemed-ask-doubt",
      title: "SinapseMED: Tirar dúvida sobre seleção",
      contexts: ["selection"],
    });

    // Initialize badge
    updateBadge();
  });

  // ── Context Menu Clicks ──
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "sinapsemed-create-flashcard" && info.selectionText) {
      // Open side panel FIRST (preserves user gesture context)
      if (tab?.id) chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
      await setPreferredTab("flashcard");
      await setSelectedText(info.selectionText, tab?.url ?? "", tab?.title ?? "");
    }

    if (info.menuItemId === "sinapsemed-create-flashcard-image" && info.srcUrl) {
      if (tab?.id) chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
      await setPreferredTab("flashcard");
      await setSelectedText(`[Imagem: ${info.srcUrl}]`, tab?.url ?? "", tab?.title ?? "");
    }

    if (info.menuItemId === "sinapsemed-ask-doubt" && info.selectionText) {
      if (tab?.id) chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
      await setPreferredTab("chat");
      await setSelectedText(info.selectionText, tab?.url ?? "", tab?.title ?? "");
    }
  });

  // ── Keyboard Shortcut ──
  chrome.commands.onCommand.addListener(async (command) => {
    if (command === "create-flashcard") {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.id) {
        // Open side panel first (keyboard shortcut counts as user gesture)
        chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
        await setPreferredTab("flashcard");
        // Ask content script for selected text
        try {
          const response = await chrome.tabs.sendMessage(tab.id, {
            type: "GET_SELECTED_TEXT",
          });
          if (response?.text) {
            await setSelectedText(response.text, tab.url ?? "", tab.title ?? "");
          }
        } catch {
          // Content script not injected — side panel already opened
        }
      }
    }
  });

  // ── Message Handler ──
  chrome.runtime.onMessage.addListener(
    (
      message: Message,
      _sender,
      sendResponse: (response: MessageResponse) => void,
    ) => {
      handleMessage(message).then(sendResponse);
      return true; // Keep channel open for async response
    },
  );

  async function handleMessage(message: Message): Promise<MessageResponse> {
    switch (message.type) {
      case "GET_AUTH_STATE": {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        return { success: true, data: { user } };
      }

      case "GET_DECKS": {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Não autenticado" };

        const { data: decks, error } = await supabase
          .from("decks")
          .select("id, title, color")
          .eq("user_id", user.id)
          .eq("is_archived", false)
          .order("title");

        if (error) return { success: false, error: error.message };

        // Cache decks for offline use
        if (decks) await setCachedDecks(decks);

        return { success: true, data: decks };
      }

      case "CREATE_FLASHCARD": {
        const payload = message.payload as CreateFlashcardPayload;
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !navigator.onLine) {
          // Queue for later sync
          await addToQueue({
            action: "create_flashcard",
            payload,
          });
          return {
            success: true,
            data: { queued: true },
          };
        }

        const { data, error } = await supabase
          .from("flashcards")
          .insert({
            user_id: user.id,
            deck_id: payload.deck_id,
            front: payload.front,
            back: payload.back,
            tags: payload.tags ?? [],
            source: payload.source,
            source_url: payload.source_url,
            front_image_url: payload.front_image_url,
          })
          .select()
          .single();

        if (error) {
          // If request failed, queue it
          await addToQueue({
            action: "create_flashcard",
            payload,
          });
          return { success: false, error: error.message };
        }

        return { success: true, data };
      }

      case "SET_SELECTED_TEXT": {
        const { text, url, title } = message.payload as SelectedTextPayload;
        await setSelectedText(text, url, title);
        return { success: true };
      }

      case "SYNC_QUEUE": {
        const result = await processQueue();
        return { success: true, data: result };
      }

      case "GET_QUEUE_COUNT": {
        const { getQueue } = await import("@/lib/storage");
        const queue = await getQueue();
        return { success: true, data: { count: queue.length } };
      }

      case "OPEN_SIDEPANEL": {
        // sidePanel.open() requires user gesture context which doesn't
        // propagate through chrome.runtime.onMessage in MV3.
        // We try anyway (works in some Chrome versions) and fail silently.
        try {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (tab?.id) {
            await chrome.sidePanel.open({ tabId: tab.id });
          }
        } catch {
          // Expected in most cases — user can open side panel via extension icon
        }
        return { success: true };
      }

      case "GOOGLE_SIGN_IN": {
        try {
          const { data, error } = await signInWithGoogle();
          if (error) return { success: false, error: error.message };
          return { success: true, data: { user: data?.user } };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Erro ao entrar com Google";
          return { success: false, error: message };
        }
      }

      default:
        return { success: false, error: `Unknown message type: ${message.type}` };
    }
  }

  // ── Alarm-based sync, token refresh & review reminder ──
  chrome.alarms.create("sync-queue", { periodInMinutes: 5 });
  chrome.alarms.create("refresh-token", { periodInMinutes: 50 });
  chrome.alarms.create("review-reminder", { periodInMinutes: 120 });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "sync-queue") {
      await processQueue();
    }

    if (alarm.name === "refresh-token") {
      // Supabase auto-refresh handles this, but we trigger it explicitly
      await supabase.auth.getSession();
    }

    if (alarm.name === "review-reminder") {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Anti-spam: skip if notified within the last 2 hours
      const stored = await chrome.storage.local.get("last_review_notif");
      const lastNotif = (stored.last_review_notif as number) ?? 0;
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      if (lastNotif > twoHoursAgo) return;

      // Count due cards
      const now = new Date().toISOString();
      const { count } = await supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_suspended", false)
        .or(`next_review_at.is.null,next_review_at.lte.${now}`);

      if (count && count > 0) {
        chrome.notifications.create("review-due", {
          type: "basic",
          iconUrl: "icon/128.png",
          title: "SinapseMED",
          message: `Você tem ${count} card${count > 1 ? "s" : ""} para revisar hoje!`,
          priority: 1,
        });
        await chrome.storage.local.set({ last_review_notif: Date.now() });
      }
    }
  });

  // ── Online/Offline sync ──
  self.addEventListener("online", () => {
    processQueue();
  });
});
