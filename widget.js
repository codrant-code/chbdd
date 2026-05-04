(function () {
  console.log("Widget loaded");

  // 🔗 Supabase config
  const SUPABASE_URL = "https://nwldvgafmyaagmyezena.supabase.co";
  const SUPABASE_KEY = "sb_publishable_gWMY1sQRn3fqip0JfAQPRQ_F79rlYyZ";

  // ✅ Load Supabase if not present
  function loadScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  async function init() {
    if (!window.supabase) {
      await loadScript("https://unpkg.com/@supabase/supabase-js@2");
    }

    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // ✅ Get user key
    const scriptTag = document.currentScript;
    const signup_id = scriptTag?.getAttribute("data-key") || "38";

    let debounceTimer;

    // 🎨 Inject styles
    const style = document.createElement("style");
    style.innerHTML = `
      #cw-icon {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #007bff;
        color: #fff;
        padding: 12px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 9999;
      }

      #cw-box {
        position: fixed;
        bottom: 70px;
        right: 20px;
        width: 320px;
        height: 420px;
        background: #fff;
        border: 1px solid #ccc;
        display: none;
        flex-direction: column;
        z-index: 9999;
        font-family: Arial;
      }

      #cw-header {
        padding: 10px;
        color: #fff;
      }

      #cw-messages {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
      }

      .cw-msg {
        margin-bottom: 8px;
      }

      .cw-user {
        text-align: right;
        font-weight: bold;
      }

      .cw-bot {
        text-align: left;
      }

      #cw-input {
        display: flex;
      }

      #cw-input input {
        flex: 1;
        padding: 8px;
        border: none;
        border-top: 1px solid #ccc;
      }

      #cw-input button {
        padding: 8px;
        border: none;
        color: #fff;
        cursor: pointer;
      }

      #cw-suggestions {
        background: #f9f9f9;
        border-top: 1px solid #ddd;
        display: none;
      }

      .cw-suggestion {
        padding: 6px;
        cursor: pointer;
      }

      .cw-suggestion:hover {
        background: #eee;
      }
    `;
    document.head.appendChild(style);

    // 🧩 Create UI
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

    // Toggle
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

    async function sendMessage() {
      const question = input.value.trim();
      if (!question) return;

      addMessage(question, "cw-user");
      input.value = "";
      hideSuggestions();

      const { data, error } = await sb
        .from("faq_questions")
        .select("question, answer")
        .eq("signup_id", signup_id)
        .ilike("question", "%" + question + "%");

      if (error) {
        addMessage("Error fetching data", "cw-bot");
        return;
      }

      if (data && data.length > 0) {
        addMessage(data[0].answer, "cw-bot");
      } else {
        addMessage("Sorry, I don't know that.", "cw-bot");
      }
    }

    async function fetchSuggestions(keyword) {
      const { data, error } = await sb
        .from("faq_questions")
        .select("question")
        .eq("signup_id", signup_id)
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

    // 🎨 Apply theme
    const { data } = await sb
      .from("chatbot_signups")
      .select("theme_color")
      .eq("id", signup_id)
      .single();

    const color = data?.theme_color || "#007bff";

    icon.style.background = color;
    header.style.background = color;
    button.style.background = color;
  }

  init();
})();