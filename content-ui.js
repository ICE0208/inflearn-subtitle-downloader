// Icon: Font Awesome Free — download (CC BY 4.0) https://fontawesome.com
const DOWNLOAD_ICON_SVG = `<svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="14" height="14"><path fill="currentColor" d="M342.1 249.9L219.3 372.7c-7.2 7.2-17.1 11.3-27.3 11.3s-20.1-4.1-27.3-11.3L41.9 249.9c-6.4-6.4-9.9-15-9.9-24C32 207.2 47.2 192 65.9 192l62.1 0 0-128c0-17.7 14.3-32 32-32h64c17.7 0 32 14.3 32 32V192l62.1 0c18.7 0 33.9 15.2 33.9 33.9c0 9-3.6 17.6-9.9 24zM32 416H352c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/></svg>`;

// 인프런 마크업이 바뀌면 여기만 수정한다
const SELECTORS = {
  scriptPanel: 'aside.tab-aside',
  closeBtn: '[class*="mantine-CloseButton"]',
};

let subtitleData = null;
let lastUrl = location.href;
let injectTimer = null;
let menuAbort = null;

document.addEventListener("__inflearnSubtitleCaptured", (e) => {
  const { subtitles, pageUrl } = e.detail;
  if (!Array.isArray(subtitles) || !subtitles.length) return;
  if (!sameLecture(pageUrl, location.href)) return; // 다른 강의의 지연된 응답 무시
  subtitleData = subtitles;
  const btn = document.getElementById("inflearn-dl-btn");
  btn ? syncBtnState(btn) : scheduleInject();
});

// tab·subtitleLanguage 파라미터는 같은 강의 내에서 변경되므로 제외하고 비교
function sameLecture(url1, url2) {
  const strip = (href) => {
    const u = new URL(href);
    u.searchParams.delete("tab");
    u.searchParams.delete("subtitleLanguage");
    return u.toString();
  };
  return strip(url1) === strip(url2);
}

// SPA 이동 시 상태 초기화 — 탭 열기/닫기 등 같은 강의 내 URL 변경은 무시
new MutationObserver(() => {
  if (location.href === lastUrl) return;
  const prevUrl = lastUrl;
  lastUrl = location.href;
  if (sameLecture(prevUrl, lastUrl)) return;
  subtitleData = null;
  menuAbort?.abort();
  menuAbort = null;
  document.getElementById("inflearn-dl-btn")?.remove();
  document.getElementById("inflearn-dl-menu")?.remove();
}).observe(document, { childList: true, subtree: true });

// 버튼 주입 트리거 — URL 옵저버와 분리 (같은 옵저버면 버튼 제거가 재주입을 순환 트리거함)
new MutationObserver(() => {
  if (!tryInject()) scheduleInject();
}).observe(document.body, { childList: true, subtree: true });

function scheduleInject() {
  clearTimeout(injectTimer);
  injectTimer = setTimeout(tryInject, 150);
}

function isScriptPanelOpen() {
  const p = new URL(location.href).searchParams;
  return p.get("tab") === "script" || p.has("subtitleLanguage");
}

function tryInject() {
  if (!isScriptPanelOpen() || document.getElementById("inflearn-dl-btn")) return false;

  const target = findScriptHeader();
  if (!target) return false;

  injectStyles();
  const { group, closeBtn } = target;
  const btn = buildBtn();
  closeBtn ? group.insertBefore(btn, closeBtn) : group.appendChild(btn);
  return true;
}

function findScriptHeader() {
  const panel = document.querySelector(SELECTORS.scriptPanel);
  if (!panel) return null;

  // data-script-id는 스크립트 패널 전용 — 다른 탭과 구분
  if (!panel.querySelector('[data-script-id]')) return null;

  const closeBtn = panel.querySelector(SELECTORS.closeBtn);
  const group = closeBtn?.parentElement ?? panel;

  return { group, closeBtn };
}

function injectStyles() {
  if (document.getElementById("inflearn-dl-styles")) return;
  const style = document.createElement("style");
  style.id = "inflearn-dl-styles";
  style.textContent = `
    #inflearn-dl-btn {
      display: inline-flex; align-items: center; justify-content: center;
      background: transparent; border: none; border-radius: 4px;
      padding: 4px; line-height: 1; transition: color 100ms ease;
      color: #ced4da; cursor: not-allowed;
    }
    #inflearn-dl-btn.ready { color: #868e96; cursor: pointer; }
    #inflearn-dl-btn.ready:hover { color: #495057; }
    .inflearn-dl-item {
      padding: 8px 14px; cursor: pointer; border-radius: 4px; margin: 0 4px;
    }
    .inflearn-dl-item:hover { background: var(--mantine-color-gray-0, #f8f9fa); }
  `;
  document.head.appendChild(style);
}

function buildBtn() {
  const btn = document.createElement("button");
  btn.id = "inflearn-dl-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "자막 다운로드");
  btn.innerHTML = DOWNLOAD_ICON_SVG;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!subtitleData) return;
    toggleMenu(btn);
  });
  syncBtnState(btn);
  return btn;
}

function syncBtnState(btn) {
  btn.classList.toggle("ready", !!subtitleData);
  btn.title = subtitleData
    ? "자막 다운로드"
    : "강의를 재생하면 자막을 내려받을 수 있어요";
}

function closeMenu() {
  const menu = document.getElementById("inflearn-dl-menu");
  if (!menu) return;
  menuAbort?.abort();
  menuAbort = null;
  menu.style.opacity = "0";
  setTimeout(() => menu.remove(), 150);
}

function toggleMenu(anchor) {
  if (document.getElementById("inflearn-dl-menu")) return closeMenu();

  const menu = document.createElement("div");
  menu.id = "inflearn-dl-menu";
  menu.style.cssText = `
    position: fixed;
    background: var(--mantine-color-white, #fff);
    border: 1px solid var(--mantine-color-gray-2, #dee2e6);
    border-radius: var(--mantine-radius-md, 8px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
    padding: 6px 0; z-index: 300; width: max-content;
    min-width: 160px; font-size: 13px;
    color: var(--mantine-color-gray-7, #495057);
    opacity: 0; transition: opacity 150ms ease;
  `;

  appendMenuItem(menu, "전체 복사", copyAll, { text: "복사됨 ✓", delay: 700 });
  appendMenuItem(menu, "텍스트 다운로드", downloadTXT);

  const rect = anchor.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 16}px`;
  menu.style.right = `${window.innerWidth - rect.right}px`;
  document.body.appendChild(menu);
  requestAnimationFrame(() => { menu.style.opacity = "1"; });

  menuAbort = new AbortController();
  // 메뉴를 연 클릭이 즉시 닫히지 않도록 다음 틱에 등록
  // capture: true — 자식 컴포넌트의 stopPropagation 영향 없이 항상 감지
  setTimeout(() => {
    document.addEventListener("click", (e) => {
      if (!anchor.contains(e.target) && !menu.contains(e.target)) closeMenu();
    }, { capture: true, signal: menuAbort.signal });
  }, 0);
}

function appendMenuItem(menu, label, fn, success) {
  const item = document.createElement("div");
  item.className = "inflearn-dl-item";
  item.textContent = label;
  item.addEventListener("click", async () => {
    try {
      await fn();
    } catch {
      item.textContent = "실패 — 다시 시도해 주세요";
      item.style.color = "var(--mantine-color-red-6, #e03131)";
      setTimeout(closeMenu, 1200);
      return;
    }
    if (success) {
      item.textContent = success.text;
      item.style.color = "var(--mantine-color-green-6, #2f9e44)";
      setTimeout(closeMenu, success.delay);
    } else {
      closeMenu();
    }
  });
  menu.appendChild(item);
}

async function copyAll() {
  await navigator.clipboard.writeText(subtitleData.map((sub) => sub.text).join("\n"));
}

function downloadTXT() {
  triggerDownload(
    subtitleData.map((sub) => `[${msToHuman(sub.start)}] ${sub.text}`).join("\n"),
    buildFilename("txt"),
    "text/plain;charset=utf-8"
  );
}

function buildFilename(ext) {
  const raw =
    document.querySelector("h1.player-title")?.textContent?.trim() ||
    document.querySelector("video[data-unit-title]")?.dataset.unitTitle ||
    "subtitle";
  return `${raw.replace(/[<>:"/\\|?*]/g, "").slice(0, 80) || "subtitle"}.${ext}`;
}

function msToHuman(ms) {
  const pad = (n) => String(n).padStart(2, "0");
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function triggerDownload(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0); // 다운로드 시작 후 revoke되도록 다음 틱으로 미룸
}
