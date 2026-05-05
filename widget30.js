(function () {
  console.log("🤖 Widget16 Fully Fixed Loaded");

  const API = "https://codrant.com/api.php";

  function getCustomerId() {
    const script =
      document.currentScript ||
      document.querySelector("script[src*='widget']");

    return (
      script?.getAttribute("data-id") ||
      script?.getAttribute("data-key") ||
      script?.getAttribute("data-customer-id")
    );
  }

  const customer_id = getCustomerId();

  if (!customer_id) {
    console.error("❌ Missing customer_id");
    return;
  }

  let user_id = localStorage.getItem("cw_user_id");

  if (!user_id) {
    user_id = crypto.randomUUID();
    localStorage.setItem("cw_user_id", user_id);
  }

  // =========================
  // 🔥 FIXED API FUNCTION (ONLY CHANGE)
  // =========================
  async function api(action, method = "POST", body = null, query = "") {
    try {

      const formData = new FormData();

      // attach action
      formData.append("action", action);

      // attach body fields safely
      if (body && typeof body === "object") {
        Object.keys(body).forEach(key => {
          if (body[key] !== undefined && body[key] !== null) {
            formData.append(key, body[key]);
          }
        });
      }

      const res = await fetch(`${API}${query}`, {
        method: "POST",
        body: formData
      });

      const text = await res.text();

      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON response:", text);
        return {};
      }

    } catch (err) {
      console.error("API error:", err);
      return {};
    }
  }

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
    height:460px;
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

    <div id="suggestions" style="height:140px;overflow:auto;background:#fafafa;border-bottom:1px solid #eee;"></div>

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
  const suggestionsBox = box.querySelector("#suggestions");

  let debounce;

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

  const tracked = new Set();

  async function trackUsage(question_id) {
    if (!question_id) return;

    const key = `${customer_id}_${user_id}_${question_id}`;

    if (tracked.has(key)) return;
    tracked.add(key);

    await api("track_faq_usage", "POST", {
      customer_id,
      user_id,
      question_id
    });
  }

  function renderSuggestions(data) {
    suggestionsBox.innerHTML = "";

    data.forEach((item) => {
      const div = document.createElement("div");
      div.innerText = "💬 " + item.question;

      div.style = `
        padding:8px;
        cursor:pointer;
        border-bottom:1px solid #eee;
      `;

      div.onclick = async () => {
        input.value = item.question;

        await trackUsage(item.id);

        sendMessage();
      };

      suggestionsBox.appendChild(div);
    });
  }

  async function loadTop() {
    const res = await api("get_top_faqs", "GET", null, `&customer_id=${customer_id}`);
    if (res.data?.length) renderSuggestions(res.data);
  }

  async function searchFaqs(q) {
    if (!q) return loadTop();

    const res = await api(
      "search_faqs",
      "GET",
      null,
      `&customer_id=${customer_id}&q=${encodeURIComponent(q)}`
    );

    if (res.data?.length) renderSuggestions(res.data);
  }

  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    addMessage(msg, "user");
    input.value = "";

    await trackUsage(msg);

    const res = await api("chat", "POST", {
      customer_id,
      message: msg,
      user_id
    });

    addMessage(res.reply || "No response", "bot");
  }

  icon.onclick = () => {
    const open = box.style.display === "flex";
    box.style.display = open ? "none" : "flex";

    if (!open) loadTop();
  };

  input.addEventListener("focus", loadTop);

  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchFaqs(input.value.trim());
    }, 150);
  });

  sendBtn.onclick = sendMessage;

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  api("get_theme", "GET", null, `&customer_id=${customer_id}`)
    .then(data => {
      const color = data.theme_color || "#007bff";
      icon.style.background = color;
      sendBtn.style.background = color;
      box.querySelector("#header").style.background = color;
    });

})();
