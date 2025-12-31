const webhookUrl = "https://n8n-free-fzir.onrender.com/webhook/webchat-ai";

const messagesDiv = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const list = document.getElementById("conversationList");
const newBtn = document.getElementById("newConversationBtn");

let state = JSON.parse(localStorage.getItem("cyntia-chat")) || {
  conversations: {},
  active: null
};

function saveState() {
  localStorage.setItem("cyntia-chat", JSON.stringify(state));
}

/* CONVERSATIONS */
function createConversation() {
  const id = "conv-" + Date.now();
  state.conversations[id] = {
    title: "Nueva conversación",
    memory: []
  };
  state.active = id;
  saveState();
  renderConversations();
  renderMessages();
}

function renderConversations() {
  list.innerHTML = "";
  Object.entries(state.conversations).forEach(([id, conv]) => {
    const li = document.createElement("li");
    li.textContent = conv.title;
    if (id === state.active) li.classList.add("active");

    li.onclick = () => {
      state.active = id;
      saveState();
      renderConversations();
      renderMessages();
    };

    list.appendChild(li);
  });
}

/* MESSAGES */
function renderMessages() {
  messagesDiv.innerHTML = "";
  const conv = state.conversations[state.active];
  if (!conv) return;

  conv.memory.forEach(m => {
    if (m.role === "user") addMessage(m.content, "user");
    else addBotMessage(m.content);
  });
}

function addMessage(text, cls) {
  const div = document.createElement("div");
  div.className = `msg ${cls}`;
  div.textContent = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addBotMessage(text) {
  const div = document.createElement("div");
  div.className = "msg bot";

  const img = document.createElement("img");
  img.src = "assets/avatar.png";

  const span = document.createElement("span");

  div.appendChild(img);
  div.appendChild(span);
  messagesDiv.appendChild(div);

  let i = 0;
  const interval = setInterval(() => {
    span.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }, 20);
}

/* SEND */
form.addEventListener("submit", async e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const conv = state.conversations[state.active];

  addMessage(text, "user");
  conv.memory.push({ role: "user", content: text });
  input.value = "";

  if (conv.memory.length === 1) {
    conv.title = text.slice(0, 30);
    renderConversations();
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: text,
      memory: conv.memory.slice(-6)
    })
  });

  const data = await res.json();

  if (data.reply) {
    conv.memory.push({ role: "assistant", content: data.reply });
    addBotMessage(data.reply);
  } else {
    addBotMessage("No se recibió respuesta del agente.");
  }

  saveState();
});

/* INIT */
if (!state.conversations || Object.keys(state.conversations).length === 0) {
  createConversation();
} else {
  state.active ||= Object.keys(state.conversations)[0];
  renderConversations();
  renderMessages();
}

newBtn.addEventListener("click", createConversation);
