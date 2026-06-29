// ============================================================
//  INDEX.JS  —  typewriter title animation
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("typewriter-title");
  const cursor = document.getElementById("cursor");
  const text = "N & M";
  let i = 0;

  function type() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      setTimeout(type, i === 1 ? 300 : Math.random() * 120 + 80);
    } else {
      // blinking cursor stays after typing
      cursor.style.opacity = "1";
    }
  }

  // Small delay before starting
  setTimeout(type, 600);
});
