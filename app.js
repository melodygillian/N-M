// ============================================================
//  USER IDENTITY
//  Handles the "who are you?" selection on every page load
// ============================================================

const USERS = {
  Hannah: { displayName: "Hannah", color: "#028391", accent: "#01204E" },
  Melonely: { displayName: "Melonely", color: "#F85525", accent: "#FAA968" }
};

function getCurrentUser() {
  return sessionStorage.getItem("nm_user");
}

function setCurrentUser(name) {
  sessionStorage.setItem("nm_user", name);
}

function requireUser(onReady) {
  const existing = getCurrentUser();
  if (existing && USERS[existing]) {
    onReady(existing);
    return;
  }
  showUserPicker(onReady);
}

function showUserPicker(onReady) {
  const overlay = document.createElement("div");
  overlay.id = "user-picker-overlay";
  overlay.innerHTML = `
    <div class="picker-box">
      <p class="picker-label">who are you?</p>
      <div class="picker-buttons">
        <button class="picker-btn" data-user="Hannah">
          <div class="picker-avatar">
            <img src="assets/hannah.jpg" alt="Hannah"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="avatar-fallback" style="display:none">H</div>
          </div>
          <span>Hannah</span>
        </button>
        <button class="picker-btn" data-user="Melonely">
          <div class="picker-avatar">
            <img src="assets/melonely.jpg" alt="Melonely"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="avatar-fallback" style="display:none">M</div>
          </div>
          <span>Melonely</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelectorAll(".picker-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const user = btn.dataset.user;
      setCurrentUser(user);
      overlay.classList.add("fade-out");
      setTimeout(() => {
        overlay.remove();
        onReady(user);
      }, 400);
    });
  });
}

function renderUserBadge(user) {
  const badge = document.getElementById("user-badge");
  if (!badge) return;
  const u = USERS[user];
  badge.textContent = u.displayName;
  badge.style.background = u.color;
}

function switchUser() {
  sessionStorage.removeItem("nm_user");
  location.reload();
}
