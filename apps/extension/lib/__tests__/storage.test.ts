import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock chrome.storage.local with in-memory store
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

// Mock chrome.action for badge
const chromeActionMock = {
  setBadgeText: vi.fn(async () => {}),
  setBadgeBackgroundColor: vi.fn(async () => {}),
};

// Install global chrome mock
vi.stubGlobal("chrome", {
  storage: { local: chromeStorageMock },
  action: chromeActionMock,
});

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-" + Math.random().toString(36).slice(2, 10),
});

// Import after mocks are set up
const {
  getSelectedText,
  setSelectedText,
  clearSelectedText,
  getQueue,
  addToQueue,
  removeFromQueue,
  incrementRetry,
  updateBadge,
  getCachedDecks,
  setCachedDecks,
} = await import("../storage");

describe("Selected Text", () => {
  beforeEach(() => {
    store = {};
    vi.clearAllMocks();
  });

  it("returns null when no text is stored", async () => {
    const result = await getSelectedText();
    expect(result).toBeNull();
  });

  it("stores and retrieves selected text", async () => {
    await setSelectedText("test text", "https://example.com", "Example Page");

    const result = await getSelectedText();
    expect(result).toEqual({
      text: "test text",
      url: "https://example.com",
      title: "Example Page",
    });
  });

  it("clears selected text", async () => {
    await setSelectedText("text", "url", "title");
    await clearSelectedText();

    const result = await getSelectedText();
    expect(result).toBeNull();
  });

  it("returns empty strings for missing url/title", async () => {
    // Manually set only the text key
    store["dindin_selected_text"] = "just text";

    const result = await getSelectedText();
    expect(result).toEqual({
      text: "just text",
      url: "",
      title: "",
    });
  });
});

describe("Offline Queue", () => {
  beforeEach(() => {
    store = {};
    vi.clearAllMocks();
  });

  it("returns empty array when no queue exists", async () => {
    const queue = await getQueue();
    expect(queue).toEqual([]);
  });

  it("adds item to queue with auto-generated fields", async () => {
    await addToQueue({
      action: "create_flashcard",
      payload: {
        front: "What is X?",
        back: "X is Y",
        deck_id: "deck-123",
        source: "extension_text",
      },
    });

    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBeTruthy();
    expect(queue[0].created_at).toBeTruthy();
    expect(queue[0].retry_count).toBe(0);
    expect(queue[0].payload.front).toBe("What is X?");
    expect(queue[0].payload.back).toBe("X is Y");
    expect(queue[0].payload.deck_id).toBe("deck-123");
  });

  it("adds multiple items to queue", async () => {
    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q1", back: "A1", deck_id: "d1", source: "extension_text" },
    });
    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q2", back: "A2", deck_id: "d2", source: "extension_image" },
    });

    const queue = await getQueue();
    expect(queue).toHaveLength(2);
    expect(queue[0].payload.front).toBe("Q1");
    expect(queue[1].payload.front).toBe("Q2");
  });

  it("removes item from queue by id", async () => {
    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q1", back: "A1", deck_id: "d1", source: "extension_text" },
    });
    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q2", back: "A2", deck_id: "d2", source: "extension_text" },
    });

    const queue = await getQueue();
    const firstId = queue[0].id;

    await removeFromQueue(firstId);

    const updated = await getQueue();
    expect(updated).toHaveLength(1);
    expect(updated[0].payload.front).toBe("Q2");
  });

  it("increments retry count of correct item", async () => {
    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q1", back: "A1", deck_id: "d1", source: "extension_text" },
    });

    const queue = await getQueue();
    const id = queue[0].id;

    await incrementRetry(id);
    await incrementRetry(id);

    const updated = await getQueue();
    expect(updated[0].retry_count).toBe(2);
  });

  it("does nothing when incrementing non-existent id", async () => {
    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q1", back: "A1", deck_id: "d1", source: "extension_text" },
    });

    await incrementRetry("non-existent-id");

    const queue = await getQueue();
    expect(queue[0].retry_count).toBe(0);
  });
});

describe("Badge", () => {
  beforeEach(() => {
    store = {};
    vi.clearAllMocks();
  });

  it("shows count when queue has items", async () => {
    await addToQueue({
      action: "create_flashcard",
      payload: { front: "Q1", back: "A1", deck_id: "d1", source: "extension_text" },
    });

    // updateBadge is called inside addToQueue
    expect(chromeActionMock.setBadgeText).toHaveBeenCalledWith({ text: "1" });
  });

  it("shows empty text when queue is empty", async () => {
    await updateBadge();
    expect(chromeActionMock.setBadgeText).toHaveBeenCalledWith({ text: "" });
  });

  it("sets red background color", async () => {
    await updateBadge();
    expect(chromeActionMock.setBadgeBackgroundColor).toHaveBeenCalledWith({
      color: "#EF4444",
    });
  });
});

describe("Cached Decks", () => {
  beforeEach(() => {
    store = {};
    vi.clearAllMocks();
  });

  it("returns null when no decks are cached", async () => {
    const decks = await getCachedDecks();
    expect(decks).toBeNull();
  });

  it("stores and retrieves cached decks", async () => {
    const mockDecks = [
      { id: "1", title: "Cardiologia", color: "#ff0000" },
      { id: "2", title: "Neurologia", color: "#00ff00" },
    ];

    await setCachedDecks(mockDecks);
    const decks = await getCachedDecks();

    expect(decks).toEqual(mockDecks);
    expect(decks).toHaveLength(2);
  });
});
