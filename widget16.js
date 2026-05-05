(function () {
  console.log("🤖 Widget15 Loaded");

  const API = "https://codrant.com/api.php";

  // =========================
  // CUSTOMER ID FIX (ROBUST)
  // =========================
  function getCustomerId() {
    const scripts = document.querySelectorAll("script");

    for (let s of scripts) {
      if (s.src && s.src.includes("widget15.js")) {
        return (
          s.getAttribute("data-id") ||
          s.getAttribute("data-key") ||
          null
        );
      }
    }
    return null;
  }

  const customer_id = getCustomerId();

  console.log("Detected customer_id:", customer_id);

  if (!customer_id) {
    console.error("❌ Missing customer_id (data-id or data-key not found)");
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
  // INIT AFTER DOM READY
  // =========================
  function initWidget() {

    console.log("✅ Widget initializing UI...");

    // =========================
    // ICON
    // =========================
    const icon = document.createElement("div");
    icon.innerHTML = "💬";

    icon.style = `
      position:fixed;
      bottom:20px;
      right:20px;
      width:55px;
      height:55px;
      background:#007bff;
      color:#fff;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:22px;
      cursor:pointer;
      z-index:2147483647;
      box-shadow:0 4px 12px rgba(0,0,0,0.25);
    `;

    // =========================
    // CHAT BOX
    // =========================
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
      z-index:2147483647;
      box-shadow:0 8px 25px rgba(0,0,0,0.2);
      font-family:Arial, sans-serif;
    `;

    box.innerHTML = `
      <div id="header" style="padding:12px;background:#007bff;color:#fff;font-weight:bold;">
        Chat Support
      </div>

      <div id="messages" style="flex:1;overflow:auto;padding:10px;background:#f9f9f9;"></div>

      <div style="display:flex;border-top:1px solid #ddd;">
        <input id="input" placeholder="Type message..."
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

    // =========================
    // TOGGLE CHAT
    // =========================
    icon.onclick = () => {
      box.style.display = box.style.display === "flex" ? "none" : "flex";
    };

    // =========================
    // MESSAGE UI
    // =========================
    function addMessage(text, type) {
      const div = document.createElement("div");

      div.style = `
        margin:6px 0;
        padding:10px;
        border-radius:10px;
        max-width:80%;
        font-size:14px;
        ${type === "user"
          ? "background:#007bff;color:#fff;margin-left:auto;"
          : "background:#eee;color:#000;"}
      `;

      div.innerText = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
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
        const res = await fetch(`${API}?action=chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id,
            message: msg,
            user_id
          })
        });

        const data = await res.json();

        addMessage(data.reply || "No response", "bot");

      } catch (err) {
        console.error(err);
        addMessage("⚠️ Server error", "bot");
      }
    }

    sendBtn.onclick = sendMessage;

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    console.log("🎉 Widget UI ready");
  }

  // =========================
  // SAFE LOAD
  // =========================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWidget);
  } else {
    initWidget();
  }

})();
