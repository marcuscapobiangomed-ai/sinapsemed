import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "SinapseMED — Flashcards Médicos",
    description:
      "Crie flashcards a partir de qualquer página para estudar para residência médica",
    version: "0.1.0",
    permissions: [
      "activeTab",
      "storage",
      "sidePanel",
      "contextMenus",
      "alarms",
      "identity",
      "notifications",
    ],
    commands: {
      "create-flashcard": {
        suggested_key: {
          default: "Ctrl+Shift+D",
          mac: "MacCtrl+Shift+D",
        },
        description: "Criar flashcard com texto selecionado",
      },
    },
    action: {
      // No default_popup — clicking the icon fires chrome.action.onClicked
      // which opens the side panel (handled in background.ts)
      default_icon: {
        "16": "icon/16.png",
        "48": "icon/48.png",
        "128": "icon/128.png",
      },
    },
    side_panel: {
      default_path: "sidepanel.html",
    },
  },
});
