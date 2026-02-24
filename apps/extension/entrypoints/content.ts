export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    let floatingButton: HTMLElement | null = null;
    let shadowRoot: ShadowRoot | null = null;

    function createFloatingButton() {
      if (floatingButton) return;

      // Create host element with Shadow DOM to isolate styles
      const host = document.createElement("sinapsemed-floating-btn");
      shadowRoot = host.attachShadow({ mode: "closed" });

      // Inject styles into shadow DOM
      const style = document.createElement("style");
      style.textContent = `
        .sinapsemed-btn {
          position: fixed;
          z-index: 2147483647;
          display: none;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: background 0.15s, transform 0.15s, opacity 0.15s;
          opacity: 0;
          transform: translateY(4px);
        }
        .sinapsemed-btn.visible {
          display: flex;
          opacity: 1;
          transform: translateY(0);
        }
        .sinapsemed-btn:hover {
          background: #1d4ed8;
        }
        .sinapsemed-btn svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      `;
      shadowRoot.appendChild(style);

      const button = document.createElement("button");
      button.className = "sinapsemed-btn";
      button.innerHTML = `
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        Flashcard
      `;
      button.addEventListener("click", handleButtonClick);
      shadowRoot.appendChild(button);

      document.documentElement.appendChild(host);
      floatingButton = button;
    }

    function showButton(x: number, y: number) {
      if (!floatingButton) createFloatingButton();
      if (!floatingButton) return;

      // Position near the selection
      const btnWidth = 120;
      const btnHeight = 36;
      const padding = 8;

      let left = x - btnWidth / 2;
      let top = y + padding;

      // Keep within viewport
      left = Math.max(padding, Math.min(left, window.innerWidth - btnWidth - padding));
      top = Math.max(padding, Math.min(top, window.innerHeight - btnHeight - padding));

      floatingButton.style.left = `${left}px`;
      floatingButton.style.top = `${top}px`;
      floatingButton.classList.add("visible");
    }

    function hideButton() {
      if (floatingButton) {
        floatingButton.classList.remove("visible");
      }
    }

    async function handleButtonClick(e: Event) {
      e.preventDefault();
      e.stopPropagation();

      const selectedText = window.getSelection()?.toString().trim();
      if (!selectedText) return;

      hideButton();

      try {
        // Save selected text for the popup/sidepanel to pick up
        await chrome.runtime.sendMessage({
          type: "SET_SELECTED_TEXT",
          payload: {
            text: selectedText,
            url: window.location.href,
            title: document.title,
          },
        });

        // In MV3, sidePanel.open() can't be triggered from content scripts
        // because user gesture context doesn't propagate through messages.
        // The user opens the side panel via the extension icon or context menu.
      } catch {
        // Extension context invalidated (e.g. after extension reload).
        // Silently ignore — user just needs to refresh the page.
      }
    }

    // ── Event Listeners ──

    document.addEventListener("mouseup", (e) => {
      // Small delay to let selection finalize
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (text && text.length > 2) {
          const range = selection!.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          showButton(rect.left + rect.width / 2, rect.bottom);
        } else {
          hideButton();
        }
      }, 10);
    });

    document.addEventListener("mousedown", (e) => {
      // Hide button if clicking outside it
      if (floatingButton && shadowRoot) {
        const path = e.composedPath();
        const host = floatingButton.getRootNode()?.host;
        if (host && !path.includes(host)) {
          hideButton();
        }
      }
    });

    // ── Handle messages from background/popup ──
    try {
      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.type === "GET_SELECTED_TEXT") {
          const text = window.getSelection()?.toString().trim() ?? "";
          sendResponse({ text });
        }
        return true;
      });
    } catch {
      // Extension context invalidated after reload — ignore
    }
  },
});
