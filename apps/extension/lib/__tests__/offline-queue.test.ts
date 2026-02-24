import { describe, it, expect, beforeEach, vi } from "vitest";

// ── In-memory store for chrome.storage.local mock ──
let store: Record<string, unknown> = {};

const chromeStorageMock = {
  get: vi.fn(async (keys: string | string[]) => {
    const result: Record<string, unknown> = {};
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList) {
      if (key in store) result[key] = store[key];
    }
    return result;
  }),
  set: vi.fn(async (items: Record<string, unknown>) => {
    Object.assign(store, items);
  }),
  remove: vi.fn(async (keys: string | string[]) => {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList) {
      delete store[key];
    }
  }),
};

const chromeActionMock = {
  setBadgeText: vi.fn(async () => {}),
  setBadgeBackgroundColor: vi.fn(async () => {}),
};

vi.stubGlobal("chrome", {
  storage: { local: chromeStorageMock },
  action: chromeActionMock,
});

vi.stubGlobal("crypto", {
  randomUUID: () => "uuid-" + Math.random().toString(36).slice(2, 10),
});

// ── Mock Supabase ──
const mockInsert = vi.fn();
const mockGetUser = vi.fn();

vi.mock("../supabase", () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: () => ({
      insert: (data: unknown) => mockInsert(data),
    }),
  },
}));

// Import after mocks
const { processQueue } = await import("../offline-queue");
const { addToQueue, getQueue } = await import("../storage");

describe("processQueue", () => {
  beforeEach(() => {
    store = {};
    vi.clearAllMocks();
    // Default: online and authenticated
    Object.defineProperty(navigator, "onLine", { value: true, writable: true });
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("returns zeros when offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false });

    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q", back: "A", deck_id: "d1", source: "extension_text" },
    });

    const result = await processQueue();
    expect(result).toEqual({ processed: 0, failed: 0 });
  });

  it("returns zeros when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q", back: "A", deck_id: "d1", source: "extension_text" },
    });

    const result = await processQueue();
    expect(result).toEqual({ processed: 0, failed: 0 });
  });

  it("processes items and removes from queue", async () => {
    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q1", back: "A1", deck_id: "d1", source: "extension_text" },
    });
    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q2", back: "A2", deck_id: "d2", source: "extension_text" },
    });

    const result = await processQueue();
    expect(result.processed).toBe(2);
    expect(result.failed).toBe(0);

    const remaining = await getQueue();
    expect(remaining).toHaveLength(0);
  });

  it("calls supabase insert with correct data", async () => {
    await addToQueue({
      action: "create_flashcard",
      payload: {
        front: "What is hypertension?",
        back: "High blood pressure",
        deck_id: "deck-abc",
        tags: ["cardio"],
        source: "extension_text",
        source_url: "https://example.com",
      },
    });

    await processQueue();

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      deck_id: "deck-abc",
      front: "What is hypertension?",
      back: "High blood pressure",
      tags: ["cardio"],
      source: "extension_text",
      source_url: "https://example.com",
      front_image_url: undefined,
    });
  });

  it("increments retry count on failure", async () => {
    mockInsert.mockResolvedValue({ error: { message: "DB error" } });

    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q", back: "A", deck_id: "d1", source: "extension_text" },
    });

    const result = await processQueue();
    expect(result.processed).toBe(0);
    expect(result.failed).toBe(1);

    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].retry_count).toBe(1);
  });

  it("removes items that exceeded max retries", async () => {
    // Manually add item with retry_count = 5 (MAX_RETRIES)
    store["dindin_offline_queue"] = [
      {
        id: "item-1",
        action: "create_flashcard",
        payload: { front: "Q", back: "A", deck_id: "d1", source: "extension_text" },
        created_at: new Date().toISOString(),
        retry_count: 5,
      },
    ];

    const result = await processQueue();
    expect(result.failed).toBe(1);

    const queue = await getQueue();
    expect(queue).toHaveLength(0);
  });

  it("processes successful items and retries failed ones in same batch", async () => {
    // First call succeeds, second fails
    mockInsert
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "error" } });

    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q1", back: "A1", deck_id: "d1", source: "extension_text" },
    });
    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q2", back: "A2", deck_id: "d2", source: "extension_text" },
    });

    const result = await processQueue();
    expect(result.processed).toBe(1);
    expect(result.failed).toBe(1);

    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].payload.front).toBe("Q2");
    expect(queue[0].retry_count).toBe(1);
  });

  it("returns zeros when queue is empty", async () => {
    const result = await processQueue();
    expect(result).toEqual({ processed: 0, failed: 0 });
  });
});
