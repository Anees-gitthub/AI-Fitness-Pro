// =========================================================
// SCRIPT.JS - PREMIUM TYPE EFFECT & API INTEGRATION
// =========================================================

// ===== MARKDOWN & SPACE PARSER =====
function formatText(text) {
  if (!text) return "";

  let formatted = text;

  // Preserve missing spaces after punctuation if backend returns squeezed text
  formatted = formatted.replace(/([.!?])([A-Za-z])/g, '$1 $2');

  // Convert **bold** markdown to <strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert line breaks and lists
  formatted = formatted.replace(/\n\n/g, '<br><br>');
  formatted = formatted.replace(/\n(\d+\.)/g, '<br><br>$1');

  return formatted;
}

// ===== SMOOTH TYPEWRITER EFFECT (PRESERVES SPACES) =====
function typeEffect(fullText, element, chatBox) {
  element.innerHTML = "";
  
  // Format markdown first
  const cleanHTML = formatText(fullText);
  
  let i = 0;
  // Type chunk by chunk for ultra-fast, smooth, gapless rendering
  const interval = setInterval(() => {
    if (i < cleanHTML.length) {
      // If we encounter an HTML tag (like <strong> or <br>), insert the whole tag at once
      if (cleanHTML[i] === '<') {
        const closingIndex = cleanHTML.indexOf('>', i);
        if (closingIndex !== -1) {
          i = closingIndex + 1;
        } else {
          i++;
        }
      } else {
        i++;
      }

      element.innerHTML = cleanHTML.slice(0, i);
      chatBox.scrollTop = chatBox.scrollHeight;
    } else {
      element.innerHTML = cleanHTML; // Ensure 100% complete text rendering
      clearInterval(interval);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }, 12); // Smooth fast typing speed
}

// ===== SEND MESSAGE LOGIC =====
async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const userText = input.value.trim();

  if (userText === "") return;

  // 1. RENDER USER MESSAGE (RIGHT SIDE - CYAN)
  const userRow = document.createElement("div");
  userRow.className = "msg-row user-row";

  const userBubble = document.createElement("div");
  userBubble.className = "msg-bubble user-bubble";
  userBubble.textContent = userText;

  userRow.appendChild(userBubble);
  chatBox.appendChild(userRow);

  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // 2. CREATE BOT CONTAINER (LEFT SIDE - DARK SLATE)
  const botRow = document.createElement("div");
  botRow.className = "msg-row bot-row";

  const botBubble = document.createElement("div");
  botBubble.className = "msg-bubble bot-bubble";
  botBubble.innerHTML = "⚡ <em>AI Coach is thinking...</em>";

  botRow.appendChild(botBubble);
  chatBox.appendChild(botRow);
  chatBox.scrollTop = chatBox.scrollHeight;

  // 3. FETCH FROM BACKEND SERVER
  try {
    const response = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: userText
      })
    });

    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();
    const replyText = data.reply || data.message || "No response generated.";

    // Trigger Typewriter Effect with Spacing Fix
    typeEffect(replyText, botBubble, chatBox);

  } catch (error) {
    console.error("Chat Error:", error);
    botBubble.innerHTML = "<span style='color: #ff4d4d;'>⚠️ Error connecting to AI server. Make sure localhost:5000 is running.</span>";
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// ===== ENTER KEY TRIGGER =====
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("userInput");
  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
      }
    });
  }
});

// ===== SUGGESTIONS CLICK HANDLER =====
function sendSuggestion(text) {
  const input = document.getElementById("userInput");
  if (input) {
    input.value = text;
    sendMessage();
  }
}

// ===== NAVIGATION =====
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "dashboard1.html";
  }
}