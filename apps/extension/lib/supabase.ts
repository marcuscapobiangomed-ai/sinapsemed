import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://anbsldgvqnbxdqqzonrb.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuYnNsZGd2cW5ieGRxcXpvbnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MzU1ODcsImV4cCI6MjA4NzIxMTU4N30.PomtBVA5haHI5nis2XjUCImBKCQvxwLGHIHQLpO2c4E";

// Custom storage adapter for chrome.storage.local
// Chrome extensions can't use cookies or localStorage reliably
const chromeStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [key]: value });
  },
  removeItem: async (key: string): Promise<void> => {
    await chrome.storage.local.remove(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    flowType: "pkce",
  },
});
