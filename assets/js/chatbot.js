// Chatbot Widget
(function () {
  function initChatbot() {
  const chatToggle = document.getElementById("chat-toggle");
  const chatContainer = document.getElementById("chat-container");
  const closeChat = document.getElementById("close-chat");
  const sendBtn = document.getElementById("send-btn");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");
  const loadingBar = document.getElementById("loading-bar");
  const chatWidget = document.getElementById("chatbot-widget");
  const infoIcon = document.getElementById("info-icon");

  // Move chatbot widget outside of #wrapper on mobile to fix position:fixed
  // The wrapper element has transform which breaks fixed positioning
  // Use window.load because main.js creates wrapper on load, not DOMContentLoaded
  window.addEventListener("load", function () {
    const wrapper = document.getElementById("wrapper");
    if (wrapper && chatWidget) {
      document.body.appendChild(chatWidget);
    }
  });

  const API_URL = "https://zu8schqs01.execute-api.us-east-1.amazonaws.com/api/chat";
  const RECAPTCHA_SITE_KEY = "6Lez0UcsAAAAAMmcPDc0nyn-qg-11swBhb8X8VN7"; // reCAPTCHA v3 site key

  // Convert markdown to HTML
  function markdownToHtml(md) {
    return md
      .replace(/^### (.*?)$/gm, "<strong>$1</strong>") // h3 -> bold
      .replace(/^## (.*?)$/gm, "<strong>$1</strong>") // h2 -> bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // italic
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>') // links
      .replace(/\n\n/g, "</p><p>") // paragraph breaks
      .replace(/\n/g, "<br>") // line breaks
      .replace(/^(.+?)$/gm, "<p>$1</p>") // wrap in paragraphs
      .replace(/<p><\/p>/g, "") // remove empty paragraphs
      .replace(/<p>(<p>|<\/p>)/g, "$1") // fix nested paragraphs
      .trim();
  }

  // Add message to chat display
  function addMessageToChat(message, sender, isHtml = false) {
    const messageEl = document.createElement("div");
    messageEl.className = `chat-message ${sender}-message`;
    if (isHtml) {
      messageEl.innerHTML = message;
    } else {
      messageEl.textContent = message;
    }
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Toggle chat window
  chatToggle.addEventListener("click", function () {
    if (chatContainer.style.display === "none") {
      chatContainer.style.display = "flex";
      chatToggle.style.display = "none"; // Hide toggle button when chat is open
      chatInput.focus();
    } else {
      chatContainer.style.display = "none";
      chatToggle.style.display = "flex"; // Show toggle button when chat is closed
    }
  });

  // Close chat window
  closeChat.addEventListener("click", function () {
    chatContainer.style.display = "none";
    chatToggle.style.display = "flex"; // Show toggle button when chat is closed
  });

  // Close chat when info icon is clicked
  if (infoIcon) {
    infoIcon.addEventListener("click", function () {
      chatContainer.style.display = "none";
      chatToggle.style.display = "flex"; // Show toggle button when chat is closed
    });
  }

  // Send message function
  function sendMessage() {
    const message = chatInput.value.trim();
    if (message === "") return;

    // Check if grecaptcha is loaded
    if (typeof grecaptcha === "undefined") {
      addMessageToChat("reCAPTCHA is still loading. Please try again.", "bot");
      return;
    }

    // Disable send button while processing
    sendBtn.disabled = true;
    loadingBar.style.display = "block";

    // Execute reCAPTCHA v3
    // eslint-disable-next-line no-undef
    grecaptcha
      .execute(RECAPTCHA_SITE_KEY, { action: "chatbot_message" })
      .then(function (token) {
        // Add user message to chat with spinner
        const wrapper = document.createElement("div");
        wrapper.className = "user-message-wrapper";
        const spinner = document.createElement("div");
        spinner.className = "message-spinner";
        const messageEl = document.createElement("div");
        messageEl.className = "chat-message user-message";
        messageEl.textContent = message;
        wrapper.appendChild(spinner);
        wrapper.appendChild(messageEl);
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.value = "";

        // Send API request with reCAPTCHA token
        fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: message, recaptchaToken: token }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.json();
          })
          .then((data) => {
            // Add bot response to chat
            let botMessage = data.message || data.body || data.response || JSON.stringify(data);

            // Try to parse if it's a JSON string
            try {
              if (typeof botMessage === "string" && botMessage.startsWith("{")) {
                const parsed = JSON.parse(botMessage);
                botMessage = parsed.response || parsed.message || botMessage;
              }
            } catch (e) {
              // Keep original if not JSON
            }

            // Convert markdown to HTML
            botMessage = botMessage.trim();
            const htmlMessage = markdownToHtml(botMessage);
            addMessageToChat(htmlMessage, "bot", true);
          })
          .catch((error) => {
            console.error("Error:", error);
            addMessageToChat("Sorry, there was an error processing your message.", "bot");
          })
          .finally(() => {
            // Remove spinner from user message
            const spinnerEl = wrapper.querySelector(".message-spinner");
            if (spinnerEl) spinnerEl.remove();
            sendBtn.disabled = false;
            loadingBar.style.display = "none";
          });
      })
      .catch((error) => {
        console.error("reCAPTCHA error:", error);
        addMessageToChat("Failed to verify. Please try again.", "bot");
        sendBtn.disabled = false;
        loadingBar.style.display = "none";
      });
  }

  // Send on button click
  sendBtn.addEventListener("click", sendMessage);

  // Send on Enter key
  chatInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
  }

  // Run immediately if DOM is already ready, otherwise wait for DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChatbot);
  } else {
    initChatbot();
  }
})();
