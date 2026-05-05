(function () {
  console.log("🤖 Widget (API Mode)");

  const API = "https://codrant.com/api.php";

  // =========================
  // CUSTOMER ID
  // =========================
  function getCustomerId() {
    const scripts = document.querySelectorAll("script[data-id]");
    for (let s of scripts) {
      if (s.src && s.src.includes("widget.js")) {
        return s.getAttribute("data-id");
      }
    }
    return null;
  }

  const customer_id = getCustomerId();
  if (!customer_id) return;

  // =========================
  // USER ID
  // =========================
  let user_id = localStorage.getItem("cw_user_id");
  if (!user_id) {
    user_id = crypto.randomUUID();
    localStorage.setItem("cw_user_id", user_id);
  }

  const HISTORY_KEY = `cw_chat_${customer_id}_${user_id}`;

  // =========================
  // UI
  // =========================
  const icon = document.createElement("div");
  icon.innerHTML = "💬";
  icon.style = `
    position:fixed;
    bottom:20px;
    right:20px;
    background:#007bff;
    color:#fff;
    width:55px;
    height:55px;
    display:flex;
    align-items:center;
    justify-content:center;
    border-radius:50%;
    cursor:pointer;
    font-size:22px;
    box-shadow:0 4px 12px rgba(0,0,0,0.2);
    z-index:9999;
  `;

  const box = document.createElement("div");
  box.style = `
    position:fixed;
    bottom:90px;
    right:20px;
    width:340px;
    height:450px;
    background:#fff;
    border-radius:12px;
    display:none;
    flex-direction:column;
    overflow:hidden;
    box-shadow:0 8px 25px rgba(0,0,0,0.2);
    z-index:9999;
    font-family:Arial, sans-serif;
  `;

  box.innerHTML = `
    <div id="header" style="padding:12px;color:#fff;font-weight:bold;">
      Chat Support
    </div>

    <div id="messages" style="flex:1;overflow:auto;padding:10px;background:#f9f9f9;"></div>

    <div style="display:flex;border-top:1px solid #ddd;">
      <input id="input" placeholder="Type a message..."
        style="flex:1;padding:10px;border:none;outline:none;">
      <button id="send" style="padding:10px 15px;border:none;background:#007bff;color:#fff;cursor:pointer;">
        ➤
      </button>
    </div>
  `;

  document.body.appendChild(icon);
  document.body.appendChild(box);

  const input = box.querySelector("#input");
  const messages = box.querySelector("#messages");
  const sendBtn = box.querySelector("#send");
  const header = box.querySelector("#header");

  // =========================
  // LOAD CSS (typing animation)
  // =========================
  const style = document.createElement("style");
  style.innerHTML = `
    .cw-typing {
      display:flex;
      gap:4px;
      padding:10px 12px;
      background:#eee;
      border-radius:12px;
      width:fit-content;
      margin:6px 0;
    }

    .cw-dot {
      width:6px;
      height:6px;
      background:#666;
      border-radius:50%;
      animation:cw-bounce 1.2s infinite;
    }

    .cw-dot:nth-child(2){animation-delay:0.2s;}
    .cw-dot:nth-child(3){animation-delay:0.4s;}

    @keyframes cw-bounce {
      0%,80%,100% {transform:scale(0);opacity:0.3;}
      40% {transform:scale(1);opacity:1;}
    }
  `;
  document.head.appendChild(style);

  // =========================
  // TOGGLE
  // =========================
  let historyLoaded = false;

  icon.onclick = async () => {
    const isOpen = box.style.display === "flex";
    box.style.display = isOpen ? "none" : "flex";

    if (!historyLoaded && !isOpen) {
      loadHistory();
      historyLoaded = true;

      if (!hasHistory()) {
        await loadWelcomeMessage();
      }
    }
  };

  // =========================
  // MESSAGES
  // =========================
  function addMessage(text, type, skipSave = false) {
    const div = document.createElement("div");

    div.style = `
      margin:6px 0;
      padding:10px 12px;
      border-radius:12px;
      max-width:80%;
      font-size:14px;
      line-height:1.4;
      ${type === "user"
        ? "background:#007bff;color:#fff;margin-left:auto;"
        : "background:#eee;color:#000;"}
    `;

    div.innerText = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;

    if (!skipSave) saveMessage(text, type);
  }

  function saveMessage(text, type) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    history.push({ text, type });

    if (history.length > 50) history = history.slice(-50);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function loadHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    history.forEach(msg => addMessage(msg.text, msg.type, true));
  }

  function hasHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    return history.length > 0;
  }

  // =========================
  // TYPING INDICATOR
  // =========================
  let typingElement = null;

  function showTyping() {
    typingElement = document.createElement("div");
    typingElement.className = "cw-typing";

    typingElement.innerHTML = `
      <div class="cw-dot"></div>
      <div class="cw-dot"></div>
      <div class="cw-dot"></div>
    `;

    messages.appendChild(typingElement);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    if (typingElement && typingElement.parentNode) {
      typingElement.parentNode.removeChild(typingElement);
      typingElement = null;
    }
  }

  // =========================
  // SEND MESSAGE
  // =========================
  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    addMessage(msg, "user");
    input.value = "";

    try {
      await fetch(`${API}?action=track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id, question: msg, user_id })
      });

      showTyping();

      const res = await fetch(`${API}?action=chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id, message: msg })
      });

      const data = await res.json();

      hideTyping();
      addMessage(data.reply || "No response", "bot");

    } catch (err) {
      console.error(err);
      hideTyping();
      addMessage("⚠️ Error connecting to server", "bot");
    }
  }

  sendBtn.onclick = sendMessage;

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // =========================
  // WELCOME MESSAGE
  // =========================
  async function loadWelcomeMessage() {
    try {
      const res = await fetch(`${API}?action=get_welcome&customer_id=${customer_id}`);
      const data = await res.json();

      if (data.welcome_message) {
        addMessage(data.welcome_message, "bot");
      }
    } catch (err) {
      console.warn("Welcome message failed");
    }
  }

  // =========================
  // THEME
  // =========================
  fetch(`${API}?action=get_theme&customer_id=${customer_id}`)
    .then(r => r.json())
    .then(data => {
      const color = data.theme_color || "#007bff";
      icon.style.background = color;
      header.style.background = color;
      sendBtn.style.background = color;
    })
    .catch(() => {});

})();
