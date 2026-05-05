(function () {
  console.log("🤖 Chatbot Widget v2 Loaded");

  const SUPABASE_URL = "https://nwldvgafmyaagmyezena.supabase.co";
  const SUPABASE_KEY = "sb_publishable_gWMY1sQRn3fqip0JfAQPRQ_F79rlYyZ";

  // =========================
  // CUSTOMER ID
  // =========================
  function getCustomerId() {
    if (document.currentScript) {
      const key = document.currentScript.getAttribute("data-key");
      if (key) return key;
    }

    const scriptTag = document.querySelector("script[data-key]");
    if (scriptTag) return scriptTag.getAttribute("data-key");

    console.error("❌ Missing customer_id");
    return null;
  }

  // =========================
  // LOAD SUPABASE
  // =========================
  async function loadSupabase() {
    if (window.supabase) return;

    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/@supabase/supabase-js@2";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function init() {
    const customer_id = getCustomerId();
    if (!customer_id) return;

    await loadSupabase();

    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let debounce;

    // =========================
    // USER ID (UNIQUE TRACKING)
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
    // TRACK USAGE (NEW LOGIC)
    // =========================
    async function trackQuestionUsage(questionText) {
      try {
        const { data } = await sb
          .from("faq_questions")
          .select("id")
          .eq("customer_id", customer_id)
          .ilike("question", questionText)
          .limit(1)
          .single();

        if (!data?.id) return;

        await sb.from("faq_question_usage").upsert({
          customer_id,
          question_id: data.id,
          user_id
        }, {
          onConflict: "customer_id,question_id,user_id"
        });

      } catch (err) {
        console.log("Tracking error:", err);
      }
    }

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
      }

      #cw-box {
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 340px;
        height: 450px;
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

      #cw-suggestions {
        height: 140px;
        overflow-y: auto;
        border-bottom: 1px solid #eee;
        padding: 6px;
        font-size: 14px;
        background: #fafafa;
      }

      .cw-suggestion {
        padding: 6px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      }

      .cw-suggestion:hover {
        background: #f0f0f0;
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
        background: #e6f0ff;
        margin-left: auto;
        text-align: right;
      }

      .cw-bot {
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
        background: #007bff;
        color: #fff;
        cursor: pointer;
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

    icon.onclick = async () => {
      const isOpen = box.style.display === "flex";
      box.style.display = isOpen ? "none" : "flex";

      if (!isOpen) {
        await loadTopQuestions();
      }
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
    // SUGGESTIONS
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

    function hideSuggestions() {
      suggestionsBox.innerHTML = "";
    }

    // =========================
    // TOP QUESTIONS
    // =========================
    async function loadTopQuestions() {
      const { data } = await sb
        .from("faq_questions")
        .select("question")
        .eq("customer_id", customer_id)
        .limit(5);

      if (data?.length) renderSuggestions(data);
    }

    // =========================
    // LIVE SEARCH
    // =========================
    async function fetchSuggestions(keyword) {
      const clean = keyword.trim();

      if (!clean) {
        loadTopQuestions();
        return;
      }

      const { data } = await sb
        .from("faq_questions")
        .select("question")
        .eq("customer_id", customer_id)
        .ilike("question", `${clean}%`)
        .limit(6);

      if (data?.length) {
        renderSuggestions(data);
      } else {
        suggestionsBox.innerHTML = "<div style='padding:6px;color:#888'>No matches</div>";
      }
    }

    // =========================
    // SEND MESSAGE (UPDATED WITH TRACKING)
    // =========================
    async function sendMessage() {
      const question = input.value.trim();
      if (!question) return;

      addMessage(question, "cw-user");
      input.value = "";

      // 🔥 TRACK UNIQUE USER USAGE
      await trackQuestionUsage(question);

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
    // THEME
    // =========================
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
