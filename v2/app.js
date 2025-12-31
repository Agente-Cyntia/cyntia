const webhookUrl = "https://n8n-free-fzir.onrender.com/webhook/webchat-ai";

// DOM Elements
const messagesDiv = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");
const list = document.getElementById("conversationList");
const newBtn = document.getElementById("newConversationBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const darkModeBtn = document.getElementById("darkModeBtn");
const exportBtn = document.getElementById("exportBtn");
const renameBtn = document.getElementById("renameBtn");
const deleteBtn = document.getElementById("deleteBtn");
const typingIndicator = document.getElementById("typingIndicator");

// Modales
const renameModal = document.getElementById("renameModal");
const deleteModal = document.getElementById("deleteModal");
const renameInput = document.getElementById("renameInput");
const renameCancelBtn = document.getElementById("renameCancelBtn");
const renameConfirmBtn = document.getElementById("renameConfirmBtn");
const deleteCancelBtn = document.getElementById("deleteCancelBtn");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

// State
let state = JSON.parse(localStorage.getItem("cyntia-chat")) || {
  conversations: {},
  active: null,
  darkMode: localStorage.getItem("cyntia-dark-mode") === "true"
};

// Initialize dark mode
if (state.darkMode) {
  document.body.classList.add("dark-mode");
  updateDarkModeButton();
}

// Save state to localStorage
function saveState() {
  localStorage.setItem("cyntia-chat", JSON.stringify(state));
  localStorage.setItem("cyntia-dark-mode", state.darkMode.toString());
}

// ============= DARK MODE =============
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  document.body.classList.toggle("dark-mode");
  updateDarkModeButton();
  saveState();
}

function updateDarkModeButton() {
  darkModeBtn.textContent = state.darkMode ? "☀️" : "🌙";
}

darkModeBtn.addEventListener("click", toggleDarkMode);

// ============= CONVERSATIONS =============
function createConversation() {
  const id = "conv-" + Date.now();
  state.conversations[id] = {
    title: "Nueva conversación",
    memory: [],
    createdAt: new Date().toISOString()
  };
  state.active = id;
  saveState();
  renderConversations();
  renderMessages();
  enableInput();
  closeSidebar();
}

function renderConversations() {
  list.innerHTML = "";
  Object.entries(state.conversations).forEach(([id, conv]) => {
    const li = document.createElement("li");
    li.textContent = conv.title;
    if (id === state.active) li.classList.add("active");

    li.addEventListener("click", () => {
      state.active = id;
      saveState();
      renderConversations();
      renderMessages();
      enableInput();
      closeSidebar();
    });

    list.appendChild(li);
  });
}

// ============= MESSAGES =============
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

function showTypingIndicator() {
  typingIndicator.classList.remove("hidden");
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function hideTypingIndicator() {
  typingIndicator.classList.add("hidden");
}

// ============= SEND MESSAGE =============
form.addEventListener("submit", async e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const conv = state.conversations[state.active];
  if (!conv) return;

  addMessage(text, "user");
  conv.memory.push({ role: "user", content: text });
  input.value = "";
  disableInput();

  if (conv.memory.length === 1) {
    conv.title = text.slice(0, 30);
    renderConversations();
  }

  showTypingIndicator();

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        memory: conv.memory.slice(-6)
      })
    });

    const data = await res.json();
    hideTypingIndicator();

    if (data.reply) {
      conv.memory.push({ role: "assistant", content: data.reply });
      addBotMessage(data.reply);
    } else {
      addBotMessage("No se recibió respuesta del agente. Intenta de nuevo.");
    }
  } catch (error) {
    hideTypingIndicator();
    console.error("Error:", error);
    addBotMessage("Error de conexión. Verifica tu internet e intenta de nuevo.");
  }

  saveState();
  enableInput();
});

// ============= INPUT CONTROL =============
function disableInput() {
  input.disabled = true;
  form.querySelector("button").disabled = true;
}

function enableInput() {
  input.disabled = false;
  form.querySelector("button").disabled = false;
  input.focus();
}

// ============= EXPORT CONVERSATIONS =============
exportBtn.addEventListener("click", () => {
  const conv = state.conversations[state.active];
  if (!conv) return;

  const data = {
    title: conv.title,
    createdAt: conv.createdAt,
    messages: conv.memory
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `conversation-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ============= RENAME CONVERSATION =============
renameBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  const conv = state.conversations[state.active];
  if (!conv) return;
  
  renameInput.value = conv.title;
  renameModal.classList.remove("hidden");
  setTimeout(() => {
    renameInput.focus();
    renameInput.select();
  }, 100);
});

renameConfirmBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  const newTitle = renameInput.value.trim();
  if (newTitle && state.conversations[state.active]) {
    state.conversations[state.active].title = newTitle;
    saveState();
    renderConversations();
    renderMessages();
    renameModal.classList.add("hidden");
    renameInput.value = "";
  }
});

renameCancelBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  renameModal.classList.add("hidden");
  renameInput.value = "";
});

renameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    renameConfirmBtn.click();
  }
  if (e.key === "Escape") {
    e.preventDefault();
    renameCancelBtn.click();
  }
});

// ============= DELETE CONVERSATION =============
deleteBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!state.conversations[state.active]) return;
  deleteModal.classList.remove("hidden");
});

deleteConfirmBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!state.conversations[state.active]) return;
  
  delete state.conversations[state.active];
  
  const remaining = Object.keys(state.conversations);
  if (remaining.length > 0) {
    state.active = remaining[0];
  } else {
    createConversation();
    deleteModal.classList.add("hidden");
    return;
  }
  
  saveState();
  renderConversations();
  renderMessages();
  enableInput();
  deleteModal.classList.add("hidden");
});

deleteCancelBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  deleteModal.classList.add("hidden");
});

// ============= SIDEBAR & MENU =============
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

menuBtn.addEventListener("click", () => {
  sidebar.classList.add("open");
  overlay.classList.add("show");
});

overlay.addEventListener("click", closeSidebar);

newBtn.addEventListener("click", () => {
  createConversation();
  closeSidebar();
});

// ============= INITIALIZATION =============
if (!state.conversations || Object.keys(state.conversations).length === 0) {
  createConversation();
} else {
  state.active ||= Object.keys(state.conversations)[0];
  renderConversations();
  renderMessages();
  enableInput();
}