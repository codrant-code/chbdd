(function () {
  console.log("🤖 Widget16 Loaded");

  const API = "https://codrant.com/api.php";

  // =========================
  // CUSTOMER ID (ROBUST)
  // =========================
  function getCustomerId() {
    const script = document.currentScript;

    if (script) {
      return script.getAttribute("data-id") ||
             script.getAttribute("data-key") ||
             null;
    }

    // fallback
    const scripts = document.querySelectorAll("script[src*='widget16.js']");
    for (let s of scripts) {
      return s.getAttribute("data-id") || s.getAttribute("data-key");
    }

    return null;
  }

  const customer_id = getCustomerId();

  console.log("Detected customer_id:", customer_id);

  if (!customer_id) {
    console.error("❌ Missing customer_id (data-id / data-key)");
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
  // INIT
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
      font-family:Arial;
    `;

    box.innerHTML = `
      <div id="header" style="padding:12px;color:#fff;font-weight:bold;background:#007bff;">
        Chat Support
      </div>

      <div id="messages" style="flex:1;overflow:auto;padding:10px;background:#f9f9f9;"></div>

      <div style="display:flex;border-top:1px solid #ddd;">
        <input id="input" placeholder="Type message..."
          style="flex:1;padding:10px;border:none;outline:none;">
        <button id="send" style="padding:10px 15px;border:none;background:#007bff;color:#fff;">
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
    // TOGGLE
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
        line-height:1.4;
        ${type === "user"
          ? "background:#007bff;color:#fff;margin-left:auto;"
          : "background:#eee;color:#000;"}
      `;

      div.innerText = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    // =========================
    // SEND MESSAGE (FIXED)
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

        console.log("Chat response:", data);

        const reply =
          data.reply ||
          data.response ||
          data.message ||
          data.answer ||
          (typeof data === "string" ? data : null);

        addMessage(reply || "No response from server", "bot");

      } catch (err) {
        console.error("Chat error:", err);
        addMessage("⚠️ Server error", "bot");
      }
    }

    sendBtn.onclick = sendMessage;

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    // =========================
    // THEME (FIXED)
    // =========================
    fetch(`${API}?action=get_theme&customer_id=${customer_id}`)
      .then(r => r.json())
      .then(data => {

        console.log("Theme response:", data);

        const color =
          data.theme_color ||
          data.color ||
          data?.data?.theme_color ||
          "#007bff";

        icon.style.background = color;
        header.style.background = color;
        sendBtn.style.background = color;
      })
      .catch(err => {
        console.warn("Theme load failed", err);
      });

    console.log("✅ Widget UI ready");
  }

  // SAFE INIT
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
