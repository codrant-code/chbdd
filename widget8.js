(function () {

  console.log("🤖 Chatbot widget loaded");

  // =========================
  // GET CUSTOMER ID
  // =========================
  const script = document.currentScript;
  const customer_id = script.getAttribute("data-id");

  if (!customer_id) {
    console.error("❌ Missing customer_id");
    return;
  }

  // =========================
  // API URL (CHANGE THIS)
  // =========================
  const API = "https://yourdomain.com/api.php"; 
  // ⚠️ Replace with your real domain

  // =========================
  // CREATE CHAT BUTTON
  // =========================
  const button = document.createElement("div");
  button.innerText = "💬";
  button.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4f6aff;
    color: white;
    width: 55px;
    height: 55px;
    border-radius: 50%;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:22px;
    cursor:pointer;
    z-index:9999;
  `;

  document.body.appendChild(button);

  // =========================
  // CHAT BOX
  // =========================
  const box = document.createElement("div");
  box.style = `
    position: fixed;
    bottom: 85px;
    right: 20px;
    width: 320px;
    height: 420px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    display: none;
    flex-direction: column;
    overflow: hidden;
    z-index:9999;
  `;

  // Header
  const header = document.createElement("div");
  header.innerText = "Chatbot";
  header.style = `
    background:#4f6aff;
    color:#fff;
    padding:12px;
    font-weight:bold;
  `;

  // Messages
  const messages = document.createElement("div");
  messages.style = `
    flex:1;
    padding:10px;
    overflow-y:auto;
    font-size:14px;
  `;

  // Input area
  const inputBox = document.createElement("div");
  inputBox.style = `
    display:flex;
    border-top:1px solid #ddd;
  `;

  const input = document.createElement("input");
  input.placeholder = "Type message...";
  input.style = `
    flex:1;
    padding:10px;
    border:none;
    outline:none;
  `;

  const sendBtn = document.createElement("button");
  sendBtn.innerText = "Send";
  sendBtn.style = `
    background:#4f6aff;
    color:white;
    border:none;
    padding:10px;
    cursor:pointer;
  `;

  inputBox.appendChild(input);
  inputBox.appendChild(sendBtn);

  box.appendChild(header);
  box.appendChild(messages);
  box.appendChild(inputBox);

  document.body.appendChild(box);

  // =========================
  // TOGGLE CHAT
  // =========================
  button.onclick = () => {
    box.style.display = box.style.display === "none" ? "flex" : "none";
  };

  // =========================
  // ADD MESSAGE UI
  // =========================
  function addMessage(text, sender) {
    const div = document.createElement("div");

    div.style.marginBottom = "10px";
    div.style.padding = "8px";
    div.style.borderRadius = "8px";
    div.style.maxWidth = "80%";

    if (sender === "user") {
      div.style.background = "#4f6aff";
      div.style.color = "#fff";
      div.style.marginLeft = "auto";
    } else {
      div.style.background = "#eee";
    }

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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer_id,
          message: msg
        })
      });

      const data = await res.json();

      addMessage(data.reply || "No response", "bot");

    } catch (err) {
      console.error(err);
      addMessage("Error connecting to server", "bot");
    }
  }

  sendBtn.onclick = sendMessage;
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

})();
