// Message types for communication between content script, popup, and background

export type MessageType =
  | "CREATE_FLASHCARD"
  | "GET_SELECTED_TEXT"
  | "SET_SELECTED_TEXT"
  | "GET_AUTH_STATE"
  | "GET_DECKS"
  | "CREATE_DECK"
  | "SYNC_QUEUE"
  | "GET_QUEUE_COUNT"
  | "OPEN_SIDEPANEL"
  | "GOOGLE_SIGN_IN";

export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
}

export interface CreateFlashcardPayload {
  front: string;
  back: string;
  deck_id: string;
  tags?: string[];
  source: "extension_text" | "extension_image";
  source_url?: string;
  front_image_url?: string;
}

export interface SelectedTextPayload {
  text: string;
  url: string;
  title: string;
}

export interface CreateDeckPayload {
  title: string;
  description?: string;
  color?: string;
}

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper to send typed messages
export function sendMessage<T = unknown>(
  message: Message,
): Promise<MessageResponse<T>> {
  return chrome.runtime.sendMessage(message);
}
