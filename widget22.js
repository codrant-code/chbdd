(function () {
  console.log("🤖 Widget16 Stable Loaded");

  const API = "https://codrant.com/api.php";

  // =========================
  // CUSTOMER ID (FIXED SAFE)
  // =========================
  function getCustomerId() {
    const script =
      document.currentScript ||
      document.querySelector("script[src*='widget']");

    const id =
      script?.getAttribute("data-id") ||
      script?.getAttribute("data-key") ||
      script?.getAttribute("data-customer-id");

    if (!id) {
      console.error("❌ Missing customer_id in script tag");
    }

    return id;
  }

  const customer_id = getCustomerId();

  if (!customer_id) {
    alert("Widget error: missing customer_id in script tag");
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

  // =========================
  // UI
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
    cursor:pointer;
    font-size:22px;
    z-index:999999;
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
    z-index:999999;
    box-shadow:0 8px 25px rgba(0,0,0,0.2);
  `;

  box.innerHTML = `
    <div id="header" style="padding:12px;color:#fff;background:#007bff;font-weight:bold;">
      Chat Support
    </div>

    <div id="messages" style="flex:1;overflow:auto;padding:10px;background:#f9f9f9;"></div>

    <div style="display:flex;border-top:1px solid #ddd;">
      <input id="input" placeholder="Type message..."
        style="flex:1;padding:10px;border:none;outline:none;">
      <button id="send" style="padding:10px 15px;background:#007bff;color:#fff;border:none;">
        ➤
      </button>
    </div>
  `;

  document.body.appendChild(icon);
  document.body.appendChild(box);

  const messages = box.querySelector("#messages");
  const input = box.querySelector("#input");
  const sendBtn = box.querySelector("#send");
  const header = box.querySelector("#header");

  icon.onclick = () => {
    box.style.display = box.style.display === "flex" ? "none" : "flex";
  };

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
      addMessage("Server error", "bot");
    }
  }

  sendBtn.onclick = sendMessage;

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

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
    });

})();
