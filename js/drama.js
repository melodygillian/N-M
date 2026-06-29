// ============================================================
//  DRAMA.JS  —  Drama Collection (Firebase + Storage)
// ============================================================

let currentUser = null;
let pendingImageDataURL = null;  // base64 from file upload
let pendingImageURL = null;      // from URL paste

document.addEventListener("DOMContentLoaded", () => {
  requireUser(user => {
    currentUser = user;
    renderUserBadge(user);
    initDrama();
  });

  // Add modal
  document.getElementById("add-drama-btn").addEventListener("click", () => {
    resetModal();
    document.getElementById("drama-modal").style.display = "flex";
  });
  document.getElementById("drama-modal-close").addEventListener("click", () => {
    document.getElementById("drama-modal").style.display = "none";
  });
  document.getElementById("drama-modal").addEventListener("click", e => {
    if (e.target === document.getElementById("drama-modal"))
      document.getElementById("drama-modal").style.display = "none";
  });

  // Image URL input preview
  document.getElementById("drama-url-input").addEventListener("input", e => {
    const url = e.target.value.trim();
    const preview = document.getElementById("drama-preview");
    if (url) {
      preview.src = url;
      preview.style.display = "block";
      pendingImageURL = url;
      pendingImageDataURL = null;
    } else {
      preview.style.display = "none";
      pendingImageURL = null;
    }
  });

  // File upload preview
  document.getElementById("drama-file-input").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      pendingImageDataURL = ev.target.result;
      pendingImageURL = null;
      const preview = document.getElementById("drama-preview");
      preview.src = pendingImageDataURL;
      preview.style.display = "block";
      document.getElementById("drama-url-input").value = "";
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("drama-submit-btn").addEventListener("click", submitDrama);

  // Detail modal close
  document.getElementById("detail-close").addEventListener("click", () => {
    document.getElementById("detail-modal").style.display = "none";
  });
  document.getElementById("detail-modal").addEventListener("click", e => {
    if (e.target === document.getElementById("detail-modal"))
      document.getElementById("detail-modal").style.display = "none";
  });
});

function initDrama() {
  db.ref("dramas").orderByChild("createdAt").on("value", snapshot => {
    const grid = document.getElementById("drama-grid");
    const empty = document.getElementById("drama-empty");
    grid.innerHTML = "";

    if (!snapshot.exists()) {
      grid.appendChild(empty);
      return;
    }

    const dramas = [];
    snapshot.forEach(child => dramas.push({ key: child.key, ...child.val() }));
    dramas.reverse();

    dramas.forEach(drama => grid.appendChild(buildCard(drama)));
  });
}

function buildCard(drama) {
  const card = document.createElement("div");
  card.className = "drama-card";

  const hasImg = drama.imageUrl || drama.imageData;
  const imgEl = hasImg
    ? `<img class="drama-card-poster" src="${drama.imageUrl || drama.imageData}" alt="${escapeHtml(drama.title)}" loading="lazy" />`
    : `<div class="drama-card-poster-placeholder">no poster</div>`;

  // Compute average rating
  let ratingDisplay = "";
  if (drama.ratings) {
    const vals = Object.values(drama.ratings);
    const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    ratingDisplay = `<span class="star-avg">★ ${avg}</span>`;
  }

  card.innerHTML = `
    ${imgEl}
    <div class="drama-card-info">
      <div class="drama-card-title">${escapeHtml(drama.title)}</div>
      <div class="drama-card-stars">${ratingDisplay}</div>
    </div>
  `;

  card.addEventListener("click", () => openDetail(drama.key));
  return card;
}

function openDetail(key) {
  const modal = document.getElementById("detail-modal");
  const inner = document.getElementById("detail-inner");
  inner.innerHTML = "<p style='color:#555;font-style:italic;text-align:center;padding:40px 0'>loading...</p>";
  modal.style.display = "flex";

  db.ref(`dramas/${key}`).once("value", snapshot => {
    if (!snapshot.exists()) return;
    const drama = { key, ...snapshot.val() };
    renderDetail(drama, inner);
  });

  // Live updates for ratings/comments
  db.ref(`dramas/${key}`).on("value", snapshot => {
    if (!snapshot.exists()) return;
    const drama = { key, ...snapshot.val() };
    if (modal.style.display !== "none") renderDetail(drama, inner);
  });
}

function renderDetail(drama, container) {
  const hasImg = drama.imageUrl || drama.imageData;
  const myRating = drama.ratings?.[currentUser] || 0;
  const isOwner = drama.addedBy === currentUser;

  // Average
  let avgHtml = "";
  if (drama.ratings) {
    const vals = Object.values(drama.ratings);
    const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    avgHtml = `<span style="font-size:0.78rem;color:var(--d-silver);font-family:'IM Fell English',serif;font-style:italic;">avg ${avg} / 5</span>`;
  }

  container.innerHTML = `
    <div class="detail-poster-row">
      ${hasImg
        ? `<img class="detail-poster" src="${drama.imageUrl || drama.imageData}" alt="${escapeHtml(drama.title)}" />`
        : `<div class="detail-poster-placeholder">no poster</div>`
      }
      <div class="detail-meta">
        <div class="detail-title">${escapeHtml(drama.title)}</div>
        <div class="stars-row">
          <span class="stars-label">${currentUser}'s rating</span>
          <div class="star-input" id="star-input-${drama.key}">
            ${[1,2,3,4,5].map(n =>
              `<button class="star-btn${myRating >= n ? " filled" : ""}" data-val="${n}" aria-label="${n} star${n>1?"s":""}">★</button>`
            ).join("")}
          </div>
          ${myRating ? `<span class="my-rating-display">${myRating}/5</span>` : ""}
        </div>
        <div style="margin-top:6px">${avgHtml}</div>
        ${isOwner ? `<button class="detail-delete-btn" id="drama-del-btn">remove from collection</button>` : ""}
      </div>
    </div>

    <div class="comments-section">
      <div class="comments-heading">what we thought</div>
      <div class="comment-list" id="comment-list-${drama.key}"></div>
      <div class="comment-compose">
        <input type="text" class="comment-input" id="comment-input-${drama.key}" placeholder="leave a comment..." maxlength="300" />
        <button class="comment-send" id="comment-send-${drama.key}">post</button>
      </div>
    </div>
  `;

  // Star click
  container.querySelectorAll(".star-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseInt(btn.dataset.val);
      db.ref(`dramas/${drama.key}/ratings/${currentUser}`).set(val);
    });
  });

  // Delete
  if (isOwner) {
    container.querySelector("#drama-del-btn").addEventListener("click", () => {
      if (confirm("Remove this from the collection?")) {
        db.ref(`dramas/${drama.key}`).remove();
        document.getElementById("detail-modal").style.display = "none";
      }
    });
  }

  // Load comments
  loadComments(drama.key, container.querySelector(`#comment-list-${drama.key}`));

  // Post comment
  container.querySelector(`#comment-send-${drama.key}`).addEventListener("click", () => {
    const input = container.querySelector(`#comment-input-${drama.key}`);
    const text = input.value.trim();
    if (!text) return;
    db.ref(`dramas/${drama.key}/comments`).push({
      text,
      author: currentUser,
      createdAt: Date.now()
    });
    input.value = "";
  });
}

function loadComments(dramaKey, container) {
  db.ref(`dramas/${dramaKey}/comments`).orderByChild("createdAt").on("value", snapshot => {
    container.innerHTML = "";
    if (!snapshot.exists()) return;
    snapshot.forEach(child => {
      const c = child.val();
      const div = document.createElement("div");
      div.className = "comment-item";
      const canDel = c.author === currentUser;
      div.innerHTML = `
        <div class="comment-author">
          <div class="note-user-dot ${c.author}" style="width:6px;height:6px;border-radius:50%;background:${c.author==='Hannah'?'#028391':'#F85525'};flex-shrink:0"></div>
          ${c.author}
          <span class="timestamp">${formatTime(c.createdAt)}</span>
          ${canDel ? `<button class="comment-delete" data-key="${child.key}" data-drama="${dramaKey}">✕</button>` : ""}
        </div>
        <div class="comment-text">${escapeHtml(c.text)}</div>
      `;
      if (canDel) {
        div.querySelector(".comment-delete").addEventListener("click", e => {
          db.ref(`dramas/${e.target.dataset.drama}/comments/${e.target.dataset.key}`).remove();
        });
      }
      container.appendChild(div);
    });
  });
}

async function submitDrama() {
  const title = document.getElementById("drama-title-input").value.trim();
  if (!title) { alert("Please enter a title."); return; }

  const btn = document.getElementById("drama-submit-btn");
  btn.textContent = "saving...";
  btn.disabled = true;

  let imageUrl = null;
  let imageData = null;

  if (pendingImageDataURL) {
    // Store as base64 inline (simple, no Storage needed for small images)
    imageData = pendingImageDataURL;
  } else if (pendingImageURL) {
    imageUrl = pendingImageURL;
  }

  await db.ref("dramas").push({
    title,
    imageUrl,
    imageData,
    addedBy: currentUser,
    createdAt: Date.now()
  });

  document.getElementById("drama-modal").style.display = "none";
  btn.textContent = "add to collection";
  btn.disabled = false;
}

function resetModal() {
  document.getElementById("drama-title-input").value = "";
  document.getElementById("drama-url-input").value = "";
  document.getElementById("drama-file-input").value = "";
  document.getElementById("drama-preview").style.display = "none";
  pendingImageDataURL = null;
  pendingImageURL = null;
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
