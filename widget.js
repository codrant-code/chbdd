(function () {
  console.log("🤖 Chatbot Widget Loaded");

  const SUPABASE_URL = "https://nwldvgafmyaagmyezena.supabase.co";
  const SUPABASE_KEY = "sb_publishable_gWMY1sQRn3fqip0JfAQPRQ_F79rlYyZ";

  // =========================
  // GET CUSTOMER ID (FIXED)
  // =========================
  function getCustomerId() {
    if (document.currentScript) {
      const key = document.currentScript.getAttribute("data-key");
      if (key) return key;
    }

    const scriptTag = document.querySelector("script[data-key]");
    if (scriptTag) {
      return scriptTag.getAttribute("data-key");
    }

    console.error("❌ Chatbot: customer_id not found");
    return null;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function init() {
    const customer_id = getCustomerId();
    if (!customer_id) return;

    if (!window.supabase) {
      await loadScript("https://unpkg.com/@supabase/supabase-js@2");
    }

    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let debounceTimer;

    // =========================
    // UI STYLES
    // =========================
    const style = document.createElement("style");
    style.innerHTML = `
      #cw-icon {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #007bff;
        color: #fff;
        padding: 14px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 9999;
        font-size: 20px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      }

      #cw-box {
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 320px;
        height: 420px;
        background: #fff;
        border-radius: 12px;
        border: 1px solid #ddd;
        display: none;
        flex-direction: column;
        z-index: 9999;
        font-family: Arial;
        overflow: hidden;
      }

      #cw-header {
        padding: 10px;
        color: #fff;
        font-weight: bold;
      }

      #cw-messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
      }

      .cw-msg {
        margin: 6px 0;
        padding: 6px 10px;
        border-radius: 8px;
        max-width: 80%;
      }

      .cw-user {
        text-align: right;
        background: #e6f0ff;
        margin-left: auto;
      }

      .cw-bot {
        text-align: left;
        background: #f1f1f1;
        margin-right: auto;
      }

      #cw-input {
        display: flex;
        border-top: 1px solid #ccc;
      }

      #cw-input input {
        flex: 1;
        padding: 10px;
        border: none;
        outline: none;
      }

      #cw-input button {
        padding: 10px;
        border: none;
        color: #fff;
        cursor: pointer;
      }

      #cw-suggestions {
        max-height: 120px;
        overflow-y: auto;
        background: #fff;
        border-top: 1px solid #ddd;
        display: none;
      }

      .cw-suggestion {
        padding: 8px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        font-size: 14px;
      }

      .cw-suggestion:hover {
        background: #f5f5f5;
      }
    `;
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
      <div id="cw-messages"></div>
      <div id="cw-suggestions"></div>
      <div id="cw-input">
        <input type="text" placeholder="Ask a question..." />
        <button>Send</button>
      </div>
    `;

    document.body.appendChild(icon);
    document.body.appendChild(box);

    icon.onclick = () => {
      box.style.display = box.style.display === "flex" ? "none" : "flex";
    };

    const input = box.querySelector("input");
    const button = box.querySelector("button");
    const messages = box.querySelector("#cw-messages");
    const suggestionsBox = box.querySelector("#cw-suggestions");
    const header = box.querySelector("#cw-header");

    function addMessage(text, type) {
      const div = document.createElement("div");
      div.className = `cw-msg ${type}`;
      div.innerText = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function hideSuggestions() {
      suggestionsBox.style.display = "none";
    }

    // =========================
    // SEND MESSAGE (FIXED QUERY)
    // =========================
    async function sendMessage() {
      const question = input.value.trim();
      if (!question) return;

      addMessage(question, "cw-user");
      input.value = "";
      hideSuggestions();

      const { data, error } = await sb
        .from("faq_questions")
        .select("question, answer")
        .eq("customer_id", customer_id)   // ✅ FIXED
        .ilike("question", "%" + question + "%");

      if (error) {
        console.error(error);
        addMessage("Error fetching data", "cw-bot");
        return;
      }

      if (data && data.length > 0) {
        addMessage(data[0].answer, "cw-bot");
      } else {
        addMessage("Sorry, I don't know that.", "cw-bot");
      }
    }

    // =========================
    // SUGGESTIONS (FIXED)
    // =========================
    async function fetchSuggestions(keyword) {
      const { data, error } = await sb
        .from("faq_questions")
        .select("question")
        .eq("customer_id", customer_id)   // ✅ FIXED
        .ilike("question", keyword + "%")
        .limit(5);

      if (error || !data) return;

      suggestionsBox.innerHTML = "";

      data.forEach((item) => {
        const div = document.createElement("div");
        div.className = "cw-suggestion";
        div.innerText = item.question;

        div.onclick = () => {
          input.value = item.question;
          hideSuggestions();
          sendMessage();
        };

        suggestionsBox.appendChild(div);
      });

      suggestionsBox.style.display = "block";
    }

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    button.onclick = sendMessage;

    input.addEventListener("input", () => {
      const value = input.value.trim();
      clearTimeout(debounceTimer);

      if (!value) {
        hideSuggestions();
        return;
      }

      debounceTimer = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    });

    // =========================
    // THEME (FIXED)
    // =========================
    try {
      const { data, error } = await sb
        .from("chatbot_signups")
        .select("theme_color")
        .eq("customer_id", customer_id)   // ✅ FIXED
        .single();

      if (!error && data) {
        const color = data.theme_color || "#007bff";
        icon.style.background = color;
        header.style.background = color;
        button.style.background = color;
      }
    } catch (err) {
      console.error("Theme error:", err);
    }
  }

  init();
})();
