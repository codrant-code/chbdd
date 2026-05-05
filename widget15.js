(function () {
  console.log("🤖 Widget Loaded");

  const API = "https://codrant.com/api.php";

  // =========================
  // CUSTOMER ID FIXED
  // =========================
  function getCustomerId() {
    const scripts = document.querySelectorAll("script[data-id]");

    for (let s of scripts) {
      if (s.src && s.src.includes("widget13.js")) {
        return s.getAttribute("data-id");
      }
    }
    return null;
  }

  const customer_id = getCustomerId();

  console.log("Customer ID:", customer_id);

  if (!customer_id) {
    console.error("❌ Missing customer_id");
    return;
  }

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
  // WAIT FOR BODY (IMPORTANT FIX)
  // =========================
  function init() {

    // =========================
    // ICON
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
      z-index:2147483647;
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
      z-index:2147483647;
      font-family:Arial;
    `;

    box.innerHTML = `
      <div id="header" style="padding:12px;color:#fff;font-weight:bold;background:#007bff;">
        Chat Support
      </div>

      <div id="messages" style="flex:1;overflow:auto;padding:10px;background:#f9f9f9;"></div>

      <div style="display:flex;border-top:1px solid #ddd;">
        <input id="input" placeholder="Type a message..." style="flex:1;padding:10px;border:none;outline:none;">
        <button id="send" style="padding:10px 15px;border:none;background:#007bff;color:#fff;">➤</button>
      </div>
    `;

    document.body.appendChild(icon);
    document.body.appendChild(box);

    const input = box.querySelector("#input");
    const messages = box.querySelector("#messages");
    const sendBtn = box.querySelector("#send");

    // TOGGLE
    icon.onclick = () => {
      box.style.display = box.style.display === "flex" ? "none" : "flex";
    };

    // MESSAGE
    function addMessage(text, type) {
      const div = document.createElement("div");

      div.style = `
        margin:6px 0;
        padding:10px;
        border-radius:10px;
        max-width:80%;
        ${type === "user"
          ? "background:#007bff;color:#fff;margin-left:auto;"
          : "background:#eee;"}
      `;

      div.innerText = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    // SEND
    async function sendMessage() {
      const msg = input.value.trim();
      if (!msg) return;

      addMessage(msg, "user");
      input.value = "";

      const res = await fetch(`${API}?action=chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id, message: msg })
      });

      const data = await res.json();
      addMessage(data.reply || "No response", "bot");
    }

    sendBtn.onclick = sendMessage;

    input.addEventListener("keypress", e => {
      if (e.key === "Enter") sendMessage();
    });

    console.log("✅ Widget UI initialized");
  }

  // IMPORTANT: wait for DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
