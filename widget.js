(function () {
  console.log("🤖 Chatbot Widget Loaded");

  const SUPABASE_URL = "https://nwldvgafmyaagmyezena.supabase.co";
  const SUPABASE_KEY = "sb_publishable_gWMY1sQRn3fqip0JfAQPRQ_F79rlYyZ";

  function getCustomerId() {
    if (document.currentScript) {
      const key = document.currentScript.getAttribute("data-key");
      if (key) return key;
    }

    const scriptTag = document.querySelector("script[data-key]");
    if (scriptTag) return scriptTag.getAttribute("data-key");

    console.error("Missing customer_id");
    return null;
  }

  async function loadSupabase() {
    if (window.supabase) return;
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/@supabase/supabase-js@2";
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  async function init() {
    const customer_id = getCustomerId();
    if (!customer_id) return;

    await loadSupabase();

    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let debounceTimer;

    // ================= UI =================
    const style = document.createElement("style");
    style.innerHTML = `
      #cw-icon {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #007bff;
        color: white;
        padding: 14px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 9999;
      }

      #cw-box {
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 320px;
        height: 420px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 12px;
        display: none;
        flex-direction: column;
        z-index: 9999;
        font-family: Arial;
      }

      #cw-header {
        padding: 10px;
        color: white;
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

      .cw-user { background: #e6f0ff; margin-left: auto; text-align: right; }
      .cw-bot { background: #f1f1f1; margin-right: auto; text-align: left; }

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
        color: white;
        cursor: pointer;
      }

      #cw-suggestions {
        max-height: 150px;
        overflow-y: auto;
        border-top: 1px solid #ddd;
        display: none;
        background: white;
      }

      .cw-suggestion {
        padding: 8px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      }

      .cw-suggestion:hover {
        background: #f5f5f5;
      }
    `;
    document.head.appendChild(style);

    // ================= UI =================
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
        <input type="text" placeholder="Ask something..." />
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
      suggestionsBox.innerHTML = "";
      suggestionsBox.style.display = "none";
    }

    async function sendMessage() {
      const question = input.value.trim();
      if (!question) return;

      addMessage(question, "cw-user");
      input.value = "";
      hideSuggestions();

      const { data } = await sb
        .from("faq_questions")
        .select("answer")
        .eq("customer_id", customer_id)
        .ilike("question", `%${question}%`)
        .limit(1);

      if (data?.length) {
        addMessage(data[0].answer, "cw-bot");
      } else {
        addMessage("Sorry, I don't know that.", "cw-bot");
      }
    }

    async function fetchSuggestions(keyword) {
      const clean = keyword.trim().toLowerCase();

      if (!clean) return hideSuggestions();

      const { data } = await sb
        .from("faq_questions")
        .select("question")
        .eq("customer_id", customer_id)
        .ilike("question", `${clean}%`)
        .order("question", { ascending: true })
        .limit(5);

      if (!data?.length) return hideSuggestions();

      suggestionsBox.innerHTML = "";

      data.forEach((item) => {
        const div = document.createElement("div");
        div.className = "cw-suggestion";
        div.innerText = item.question;

        div.onclick = () => {
          input.value = item.question;
          hideSuggestions();
        };

        suggestionsBox.appendChild(div);
      });

      suggestionsBox.style.display = "block";
    }

    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);

      const value = input.value.trim();

      debounceTimer = setTimeout(() => {
        fetchSuggestions(value);
      }, 200);
    });

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
    });

    button.onclick = sendMessage;

    const { data } = await sb
      .from("chatbot_signups")
      .select("theme_color")
      .eq("customer_id", customer_id)
      .single();

    if (data?.theme_color) {
      icon.style.background = data.theme_color;
      header.style.background = data.theme_color;
      button.style.background = data.theme_color;
    }
  }

  init();
})();
