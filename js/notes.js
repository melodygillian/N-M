// ============================================================
//  NOTES.JS  —  Leave a Note  (Firebase Realtime Database)
// ============================================================

let currentUser = null;
let replyTargetKey = null;

document.addEventListener("DOMContentLoaded", () => {
  requireUser(user => {
    currentUser = user;
    renderUserBadge(user);
    initNotes();
  });

  // Char counter
  const input = document.getElementById("note-input");
  const counter = document.getElementById("char-count");
  input.addEventListener("input", () => {
    counter.textContent = `${input.value.length} / 600`;
  });

  // Send note
  document.getElementById("send-btn").addEventListener("click", sendNote);
  document.getElementById("note-input").addEventListener("keydown", e => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendNote();
  });

  // Modal close
  document.getElementById("modal-close").addEventListener("click", closeReplyModal);
  document.getElementById("modal-send").addEventListener("click", sendReply);
  document.getElementById("reply-modal").addEventListener("click", e => {
    if (e.target === document.getElementById("reply-modal")) closeReplyModal();
  });
});

function initNotes() {
  const notesRef = db.ref("notes");
  notesRef.on("value", snapshot => {
    const feed = document.getElementById("notes-feed");
    const empty = document.getElementById("empty-state");
    feed.innerHTML = "";

    if (!snapshot.exists()) {
      feed.innerHTML = '<p class="empty-state">no notes yet. be the first. ✉</p>';
      return;
    }

    const notes = [];
    snapshot.forEach(child => notes.push({ key: child.key, ...child.val() }));
    notes.reverse(); // newest first

    notes.forEach(note => {
      feed.appendChild(buildNoteCard(note));
    });
  });
}

function buildNoteCard(note) {
  const card = document.createElement("div");
  card.className = "note-card";
  card.dataset.key = note.key;

  const canDelete = note.author === currentUser;
  const timeStr = formatTime(note.createdAt);

  card.innerHTML = `
    <div class="note-header">
      <div class="note-user-dot ${note.author}"></div>
      <span class="note-author">${note.author}</span>
      <span class="timestamp" style="margin-left:auto">${timeStr}</span>
    </div>
    <div class="note-body">${escapeHtml(note.text)}</div>
    <div class="note-footer">
      <button class="reply-btn">↩ reply</button>
      ${canDelete ? `<button class="delete-note-btn">delete</button>` : ""}
    </div>
    <div class="replies-list" id="replies-${note.key}"></div>
  `;

  // Reply button
  card.querySelector(".reply-btn").addEventListener("click", () => {
    openReplyModal(note.key, note.author, note.text);
  });

  // Delete button
  if (canDelete) {
    card.querySelector(".delete-note-btn").addEventListener("click", () => {
      if (confirm("Delete this note?")) {
        db.ref(`notes/${note.key}`).remove();
      }
    });
  }

  // Load replies
  loadReplies(note.key, card.querySelector(`#replies-${note.key}`));

  return card;
}

function loadReplies(noteKey, container) {
  db.ref(`notes/${noteKey}/replies`).orderByChild("createdAt").on("value", snapshot => {
    container.innerHTML = "";
    if (!snapshot.exists()) return;

    snapshot.forEach(child => {
      const reply = child.val();
      const item = document.createElement("div");
      item.className = "reply-item";
      const canDel = reply.author === currentUser;
      item.innerHTML = `
        <div class="reply-author">
          <div class="note-user-dot ${reply.author}" style="width:6px;height:6px"></div>
          ${reply.author}
          <span class="timestamp">${formatTime(reply.createdAt)}</span>
          ${canDel ? `<button class="reply-delete" data-key="${child.key}" data-note="${noteKey}">✕</button>` : ""}
        </div>
        <div class="reply-text">${escapeHtml(reply.text)}</div>
      `;
      if (canDel) {
        item.querySelector(".reply-delete").addEventListener("click", e => {
          const rk = e.target.dataset.key;
          const nk = e.target.dataset.note;
          db.ref(`notes/${nk}/replies/${rk}`).remove();
        });
      }
      container.appendChild(item);
    });
  });
}

function sendNote() {
  const input = document.getElementById("note-input");
  const text = input.value.trim();
  if (!text) return;

  db.ref("notes").push({
    text,
    author: currentUser,
    createdAt: Date.now()
  });

  input.value = "";
  document.getElementById("char-count").textContent = "0 / 600";
}

function openReplyModal(noteKey, noteAuthor, noteText) {
  replyTargetKey = noteKey;
  document.getElementById("modal-context").textContent =
    `${noteAuthor}: "${noteText.substring(0, 80)}${noteText.length > 80 ? "…" : ""}"`;
  document.getElementById("reply-input").value = "";
  document.getElementById("reply-modal").style.display = "flex";
  document.getElementById("reply-input").focus();
}

function closeReplyModal() {
  document.getElementById("reply-modal").style.display = "none";
  replyTargetKey = null;
}

function sendReply() {
  const input = document.getElementById("reply-input");
  const text = input.value.trim();
  if (!text || !replyTargetKey) return;

  db.ref(`notes/${replyTargetKey}/replies`).push({
    text,
    author: currentUser,
    createdAt: Date.now()
  });

  closeReplyModal();
}

// ── Helpers ──
function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}
