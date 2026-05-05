(function () {
  console.log("🤖 Chatbot Widget v3 (API Mode)");

  const API_URL = "https://codrant.com/api.php";

  // =========================
  // CUSTOMER ID
  // =========================
  function getCustomerId() {
    if (document.currentScript) {
      return document.currentScript.getAttribute("data-key");
    }
    return null;
  }

  // =========================
  // USER ID
  // =========================
  function getUserId() {
    let id = localStorage.getItem("cw_user_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("cw_user_id", id);
    }
    return id;
  }

  const customer_id = getCustomerId();
  const user_id = getUserId();

  if (!customer_id) {
    console.error("Missing customer_id");
    return;
  }

  let debounce;

  // =========================
  // API HELPER
  // =========================
  async function api(action, method = "GET", body = null, query = "") {
    const url = `${API_URL}?action=${action}${query}`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : null
    });

    return await res.json();
  }

  // =========================
  // TRACK USAGE (RESTORED)
  // =========================
  async function trackUsage(questionId) {
    if (!questionId) return;

    await api("track_faq_usage", "POST", {
      customer_id,
      question_id: questionId,
      user_id
    });
  }

  // =========================
  // UI
  // =========================
  const style = document.createElement("style");
  style.innerHTML = `
    #cw-icon{
      position:fixed;bottom:20px;right:20px;
      background:#007bff;color:#fff;
      padding:14px;border-radius:50%;
      cursor:pointer;z-index:9999;
    }

    #cw-box{
      position:fixed;bottom:80px;right:20px;
      width:340px;height:460px;
      background:#fff;border-radius:12px;
      border:1px solid #ddd;
      display:none;flex-direction:column;
      z-index:9999;font-family:Arial;
    }

    #cw-header{padding:10px;color:#fff;font-weight:bold;}

    #cw-suggestions{
      height:160px;overflow-y:auto;
      border-bottom:1px solid #eee;
      padding:8px;background:#fafafa;
      font-size:14px;
    }

    .cw-suggestion{
      padding:7px;cursor:pointer;
      border-bottom:1px solid #eee;
    }

    .cw-suggestion:hover{background:#f0f0f0;}

    #cw-messages{flex:1;overflow-y:auto;padding:10px;}

    .cw-msg{margin:6px 0;padding:6px 10px;border-radius:8px;max-width:80%;}

    .cw-user{background:#e6f0ff;margin-left:auto;text-align:right;}
    .cw-bot{background:#f1f1f1;margin-right:auto;}

    #cw-input{display:flex;border-top:1px solid #ccc;}
    #cw-input input{flex:1;padding:10px;border:none;outline:none;}
    #cw-input button{padding:10px;border:none;background:#007bff;color:#fff;}
  `;
  document.head.appendChild(style);

  // =========================
  // UI BUILD
  // =========================
  const icon = document.createElement("div");
  icon.id = "cw-icon";
  icon.innerText = "🤖";

  const box = document.createElement("div");
  box.id = "cw-box";

  box.innerHTML = `
    <div id="cw-header">Assistant</div>
    <div id="cw-suggestions"></div>
    <div id="cw-messages"></div>
    <div id="cw-input">
      <input type="text" placeholder="Ask something..." />
      <button>Send</button>
    </div>
  `;

  document.body.appendChild(icon);
  document.body.appendChild(box);

  const input = box.querySelector("input");
  const button = box.querySelector("button");
  const messages = box.querySelector("#cw-messages");
  const suggestionsBox = box.querySelector("#cw-suggestions");
  const header = box.querySelector("#cw-header");

  // =========================
  // MESSAGE
  // =========================
  function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = `cw-msg ${type}`;
    div.innerText = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  // =========================
  // SUGGESTIONS (RESTORED)
  // =========================
  function renderSuggestions(data) {
    suggestionsBox.innerHTML = "";

    data.forEach((item) => {
      const div = document.createElement("div");
      div.className = "cw-suggestion";
      div.innerText = "💬 " + item.question;

      div.onclick = async () => {
        input.value = item.question;

        // ✅ RESTORED tracking
        await trackUsage(item.id);

        sendMessage();
      };

      suggestionsBox.appendChild(div);
    });
  }

  // =========================
  // LOAD TOP FAQS
  // =========================
  async function loadTop() {
    const res = await api("get_top_faqs", "GET", null, `&customer_id=${customer_id}`);
    if (res.data?.length) renderSuggestions(res.data);
  }

  // =========================
  // SEARCH FAQS
  // =========================
  async function searchFaqs(q) {
    const res = await api(
      "search_faqs",
      "GET",
      null,
      `&customer_id=${customer_id}&q=${encodeURIComponent(q)}`
    );

    if (res.data?.length) renderSuggestions(res.data);
    else suggestionsBox.innerHTML = "<div style='padding:6px;color:#888'>No matches</div>";
  }

  // =========================
  // CHAT
  // =========================
  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    addMessage(msg, "cw-user");
    input.value = "";

    const res = await api("chat", "POST", {
      customer_id,
      message: msg
    });

    addMessage(res.reply || "No response", "cw-bot");
  }

  // =========================
  // EVENTS
  // =========================
  icon.onclick = () => {
    const open = box.style.display === "flex";
    box.style.display = open ? "none" : "flex";

    if (!open) loadTop();
  };

  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const v = input.value.trim();
      if (!v) loadTop();
      else searchFaqs(v);
    }, 200);
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  button.onclick = sendMessage;

  // =========================
  // THEME
  // =========================
  async function loadTheme() {
    const res = await api("get_theme", "GET", null, `&customer_id=${customer_id}`);

    if (res.theme_color) {
      icon.style.background = res.theme_color;
      header.style.background = res.theme_color;
      button.style.background = res.theme_color;
    }
  }

  loadTheme();
})();
