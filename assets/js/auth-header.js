// Renders the header auth slot on every page. Expects:
//   <div data-auth-slot ...></div>
// somewhere inside the header. Also wires sign-out if a
//   <button data-auth-signout>
// exists (used on profile.html).
(function () {
  if (!window.PickAuth) return;

  function slotHTML(user) {
    if (user) {
      const initial = (user.displayName || user.email || "?").trim().charAt(0).toUpperCase() || "?";
      const avatar = user.photoURL
        ? `<img src="${user.photoURL}" alt="" class="w-9 h-9 rounded-full object-cover" referrerpolicy="no-referrer"/>`
        : `<div class="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dim text-on-primary flex items-center justify-center font-headline font-bold text-sm">${initial}</div>`;
      return `
        <a href="profile.html" class="hover:opacity-90 transition-opacity" title="${user.displayName || user.email || '프로필'}">
          ${avatar}
        </a>`;
    }
    return `
      <a href="login.html" class="inline-flex items-center gap-2 bg-primary-fixed text-primary font-body font-semibold text-sm py-2 px-4 rounded-full hover:bg-primary-fixed-dim transition-colors">
        <span class="material-symbols-outlined text-[18px]">login</span>
        <span class="hidden sm:inline">로그인</span>
      </a>`;
  }

  function render(user) {
    document.querySelectorAll("[data-auth-slot]").forEach(el => {
      el.innerHTML = slotHTML(user);
    });
    document.querySelectorAll("[data-auth-name]").forEach(el => {
      el.textContent = user ? (user.displayName || user.email || "사용자") : "게스트 사용자";
    });
    document.querySelectorAll("[data-auth-email]").forEach(el => {
      el.textContent = user?.email || (user ? `${user.provider} 계정` : "로컬 저장 중");
    });
    document.querySelectorAll("[data-auth-avatar]").forEach(el => {
      const initial = user ? ((user.displayName || user.email || "?").trim().charAt(0).toUpperCase() || "?") : "게";
      if (user?.photoURL) {
        el.innerHTML = `<img src="${user.photoURL}" alt="" class="w-full h-full rounded-full object-cover" referrerpolicy="no-referrer"/>`;
      } else {
        el.textContent = initial;
      }
    });
    document.querySelectorAll("[data-auth-only]").forEach(el => {
      el.classList.toggle("hidden", !user);
    });
    document.querySelectorAll("[data-auth-guest]").forEach(el => {
      el.classList.toggle("hidden", !!user);
    });
  }

  PickAuth.init();
  PickAuth.onChange(render);

  document.addEventListener("click", async (e) => {
    const signOutBtn = e.target.closest("[data-auth-signout]");
    if (!signOutBtn) return;
    e.preventDefault();
    try {
      await PickAuth.signOut();
      location.href = "index.html";
    } catch (err) {
      console.error(err);
      alert("로그아웃 실패: " + (err?.message || "알 수 없는 오류"));
    }
  });
})();
