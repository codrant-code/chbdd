(function () {
  console.log("🤖 Chatbot Widget (Production)");

  // =========================
  // CONFIG
  // =========================
  const API = "https://yourdomain.com/api.php"; // 🔥 CHANGE THIS

  // =========================
  // CUSTOMER ID
  // =========================
  function getCustomerId() {
    const script = document.currentScript;
    if (script) return script.getAttribute("data-id");

    const tag = document.querySelector("script[data-id]");
    return tag ? tag.getAttribute("data-id") : null;
  }

  const customer_id = getCustomerId();
  if (!customer_id) {
    console.error("❌ Missing customer_id");
    return;
  }

  let debounce;

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

  const user_id = getUserId();

  // =========================
  // UI STYLES (UNCHANGED)
  // =========================
  const style = document.createElement("style");
  style.innerHTML = `/* your same CSS here (unchanged) */`;
  document.head.appendChild(style);

  // =========================
  // UI
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

  icon.onclick = () => {
    const open = box.style.display === "flex";
    box.style.display = open ? "none" : "flex";

    if (!open) loadTopQuestions();
  };

  // =========================
  // MESSAGES
  // =========================
  function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = `cw-msg ${type}`;
    div.innerText = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  // =========================
  // SUGGESTIONS UI
  // =========================
  function renderSuggestions(data) {
    suggestionsBox.innerHTML = "";

    data.forEach((item) => {
      const div = document.createElement("div");
      div.className = "cw-suggestion";
      div.innerText = "💬 " + item.question;

      div.onclick = () => {
        input.value = item.question;
        sendMessage();
      };

      suggestionsBox.appendChild(div);
    });
  }

  // =========================
  // API CALLS (REPLACED)
  // =========================

  async function loadTopQuestions() {
    const res = await fetch(`${API}?action=get_faqs&customer_id=${customer_id}`);
    const data = await res.json();

    if (data?.length) renderSuggestions(data.slice(0, 5));
  }

  async function fetchSuggestions(keyword) {
    const res = await fetch(`${API}?action=get_faqs&customer_id=${customer_id}`);
    const data = await res.json();

    const filtered = data.filter(q =>
      q.question.toLowerCase().includes(keyword.toLowerCase())
    );

    renderSuggestions(filtered.slice(0, 6));
  }

  async function trackQuestionUsage(question) {
    try {
      await fetch(`${API}?action=track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer_id,
          question,
          user_id
        })
      });
    } catch (err) {
      console.log("Tracking failed");
    }
  }

  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    addMessage(msg, "cw-user");
    input.value = "";

    await trackQuestionUsage(msg);

    const res = await fetch(`${API}?action=chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        customer_id,
        message: msg
      })
    });

    const data = await res.json();
    addMessage(data.reply || "No response", "cw-bot");
  }

  // =========================
  // EVENTS
  // =========================
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      fetchSuggestions(input.value);
    }, 200);
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  button.onclick = sendMessage;

  // =========================
  // LOAD THEME FROM API
  // =========================
  async function loadTheme() {
    const res = await fetch(`${API}?action=get_theme&customer_id=${customer_id}`);
    const data = await res.json();

    if (data?.theme_color) {
      icon.style.background = data.theme_color;
      header.style.background = data.theme_color;
      button.style.background = data.theme_color;
    }
  }

  loadTheme();

})();
