// ============================================================
//  TODO.JS  —  To-Do List TGT (Firebase Realtime Database)
// ============================================================

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  requireUser(user => {
    currentUser = user;
    renderUserBadge(user);
    initTodo();
  });

  document.getElementById("todo-add-btn").addEventListener("click", addItem);
  document.getElementById("todo-input").addEventListener("keydown", e => {
    if (e.key === "Enter") addItem();
  });
});

function initTodo() {
  db.ref("todos").on("value", snapshot => {
    const activeList = document.getElementById("todo-active");
    const doneList   = document.getElementById("todo-done");
    const doneSection = document.getElementById("completed-section");

    activeList.innerHTML = "";
    doneList.innerHTML   = "";

    if (!snapshot.exists()) return;

    const items = [];
    snapshot.forEach(child => items.push({ key: child.key, ...child.val() }));

    const active = items.filter(i => !i.done);
    const done   = items.filter(i => i.done);

    // Newest first within each group
    active.reverse().forEach(item => activeList.appendChild(buildItem(item)));
    done.reverse().forEach(item => doneList.appendChild(buildItem(item)));

    doneSection.style.display = done.length ? "block" : "none";
  });
}

function buildItem(item) {
  const li = document.createElement("li");
  li.className = "todo-item";
  li.dataset.key = item.key;

  const isOwner = item.author === currentUser;

  const checkEl = document.createElement("div");
  checkEl.className = `todo-check${item.done ? " checked" : ""}`;
  checkEl.setAttribute("role", "checkbox");
  checkEl.setAttribute("aria-checked", item.done ? "true" : "false");
  checkEl.addEventListener("click", () => toggleItem(item.key, item.done));

  const bodyEl = document.createElement("div");
  bodyEl.style.flex = "1";
  bodyEl.innerHTML = `
    <div class="todo-text">${escapeHtml(item.text)}</div>
    <div class="todo-meta">added by ${item.author} · ${formatDate(item.createdAt)}</div>
  `;

  const rightEl = document.createElement("div");
  rightEl.className = "todo-right";
  if (isOwner) {
    const delBtn = document.createElement("button");
    delBtn.className = "todo-delete";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", () => {
      if (confirm("Delete this item?")) db.ref(`todos/${item.key}`).remove();
    });
    rightEl.appendChild(delBtn);
  }

  li.appendChild(checkEl);
  li.appendChild(bodyEl);
  li.appendChild(rightEl);

  return li;
}

function addItem() {
  const input = document.getElementById("todo-input");
  const text = input.value.trim();
  if (!text) return;

  db.ref("todos").push({
    text,
    author: currentUser,
    done: false,
    createdAt: Date.now()
  });

  input.value = "";
}

function toggleItem(key, currentDone) {
  db.ref(`todos/${key}`).update({ done: !currentDone });
}

// ── Helpers ──
function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
