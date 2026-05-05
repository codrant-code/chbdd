(function () {
  console.log("🤖 Widget (API Mode)");

  const API = "https://codrant.com/api.php";

  function getCustomerId() {
    const script = document.currentScript;
    return script?.getAttribute("data-id") || null;
  }

  const customer_id = getCustomerId();
  if (!customer_id) return;

  let user_id = localStorage.getItem("cw_user_id");
  if (!user_id) {
    user_id = crypto.randomUUID();
    localStorage.setItem("cw_user_id", user_id);
  }

  // UI
  const icon = document.createElement("div");
  icon.innerText = "🤖";
  icon.style = "position:fixed;bottom:20px;right:20px;background:#007bff;color:#fff;padding:14px;border-radius:50%;cursor:pointer;z-index:9999;";

  const box = document.createElement("div");
  box.style = "position:fixed;bottom:80px;right:20px;width:320px;height:420px;background:#fff;border-radius:10px;display:none;flex-direction:column;z-index:9999;";

  box.innerHTML = `
    <div id="header" style="padding:10px;color:#fff;background:#007bff;">Chatbot</div>
    <div id="messages" style="flex:1;overflow:auto;padding:10px;"></div>
    <div style="display:flex;border-top:1px solid #ddd;">
      <input id="input" style="flex:1;padding:10px;border:none;">
      <button id="send">Send</button>
    </div>
  `;

  document.body.appendChild(icon);
  document.body.appendChild(box);

  const input = box.querySelector("#input");
  const messages = box.querySelector("#messages");
  const sendBtn = box.querySelector("#send");
  const header = box.querySelector("#header");

  icon.onclick = () => {
    box.style.display = box.style.display === "flex" ? "none" : "flex";
  };

  function addMessage(text, type) {
    const div = document.createElement("div");
    div.style = "margin:5px;padding:8px;border-radius:8px;";
    div.style.background = type === "user" ? "#e6f0ff" : "#f1f1f1";
    div.innerText = text;
    messages.appendChild(div);
  }

  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    addMessage(msg, "user");
    input.value = "";

    await fetch(`${API}?action=track`, {
      method: "POST",
      body: JSON.stringify({ customer_id, question: msg, user_id })
    });

    const res = await fetch(`${API}?action=chat`, {
      method: "POST",
      body: JSON.stringify({ customer_id, message: msg })
    });

    const data = await res.json();
    addMessage(data.reply, "bot");
  }

  sendBtn.onclick = sendMessage;
  input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });

  // Load theme
  fetch(`${API}?action=get_theme&customer_id=${customer_id}`)
    .then(r => r.json())
    .then(data => {
      const color = data.theme_color || "#007bff";
      icon.style.background = color;
      header.style.background = color;
    });

})();
