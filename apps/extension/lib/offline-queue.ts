import { supabase } from "./supabase";
import {
  getQueue,
  removeFromQueue,
  incrementRetry,
  updateBadge,
} from "./storage";
import type { QueueItem } from "./storage";

const MAX_RETRIES = 5;

export async function processQueue(): Promise<{
  processed: number;
  failed: number;
}> {
  if (!navigator.onLine) {
    return { processed: 0, failed: 0 };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { processed: 0, failed: 0 };
  }

  const queue = await getQueue();
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    if (item.retry_count >= MAX_RETRIES) {
      await removeFromQueue(item.id);
      failed++;
      continue;
    }

    const success = await processItem(item, user.id);
    if (success) {
      await removeFromQueue(item.id);
      processed++;
    } else {
      await incrementRetry(item.id);
      failed++;
    }
  }

  await updateBadge();
  return { processed, failed };
}

async function processItem(item: QueueItem, userId: string): Promise<boolean> {
  try {
    if (item.action === "create_flashcard") {
      const { error } = await supabase.from("flashcards").insert({
        user_id: userId,
        deck_id: item.payload.deck_id,
        front: item.payload.front,
        back: item.payload.back,
        tags: item.payload.tags ?? [],
        source: item.payload.source,
        source_url: item.payload.source_url,
        front_image_url: item.payload.front_image_url,
      });
      return !error;
    }
    return false;
  } catch {
    return false;
  }
}
