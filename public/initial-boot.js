(function () {
  try {
    var supports = window.CSS && window.CSS.supports;
    var mode = supports &&
      supports("color", "color-mix(in srgb, red, blue)") &&
      (supports("backdrop-filter", "blur(1px)") || supports("-webkit-backdrop-filter", "blur(1px)"))
      ? "standard" : "compat";
    document.documentElement.setAttribute("data-render-mode", mode);
  } catch {
    document.documentElement.setAttribute("data-render-mode", "compat");
  }

  try {
    var storedTheme = localStorage.getItem("absensi-cn-theme");
    var theme = storedTheme === "light" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    var themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", theme === "dark" ? "#101b2a" : "#047857");
  } catch {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }

  try {
    if (location.pathname === "/" && !sessionStorage.getItem("absensi-cn-auth")) {
      var heroPreload = document.createElement("link");
      heroPreload.rel = "preload";
      heroPreload.as = "image";
      heroPreload.href = "/images/optimized/cn-hero.jpg";
      heroPreload.imageSrcset = "/images/optimized/cn-panel.jpg 960w, /images/optimized/cn-hero.jpg 1920w";
      heroPreload.imageSizes = "100vw";
      heroPreload.fetchPriority = "high";
      document.head.appendChild(heroPreload);
    }
  } catch {
    // Storage can be unavailable in strict privacy mode.
  }

  function reloadFreshDocument() {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set("__app_reload", String(Date.now()));
      window.location.replace(url.toString());
    } catch {
      window.location.reload();
    }
  }

  function showInitialLoadError() {
    if (window.__absensiAppReady) return;
    var loader = document.getElementById("initial-loader");
    if (!loader) return;
    loader.classList.add("is-error");
    var title = loader.querySelector(".initial-loader__title");
    var subtitle = loader.querySelector(".initial-loader__subtitle");
    if (title) title.textContent = "Halaman belum berhasil dimuat";
    if (subtitle) subtitle.textContent = "Periksa koneksi lalu muat ulang halaman.";
  }

  window.__absensiShowInitialLoadError = showInitialLoadError;
  window.__absensiReloadFresh = reloadFreshDocument;
  window.__absensiInitialLoaderTimeout = window.setTimeout(showInitialLoadError, 15000);
  window.addEventListener("error", function (event) {
    if (event.target && event.target.tagName === "SCRIPT" && event.target.dataset.appEntry !== undefined) {
      showInitialLoadError();
    }
  }, true);
  document.addEventListener("DOMContentLoaded", function () {
    var retry = document.querySelector(".initial-loader__retry");
    if (retry) retry.addEventListener("click", reloadFreshDocument);
  });
})();
