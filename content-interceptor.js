// world: "MAIN" + document_start — 페이지 JS보다 먼저 실행해야 자막 요청을 놓치지 않는다.
// 캡처한 데이터는 CustomEvent로 content-ui.js에 전달한다.

(function () {
  const SUBTITLE_PATTERN = /vod\.inflearn\.com\/.*\/subtitles\/json/;
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const pageUrl = location.href; // 응답 도착 시 다른 강의로 이동했을 수 있음 — 요청 시점 URL을 캡처
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === "string" ? args[0] : (args[0]?.url ?? "");

    if (SUBTITLE_PATTERN.test(url)) {
      // 페이지가 응답을 읽을 수 있도록 clone 후 처리
      response.clone().json().then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          document.dispatchEvent(
            new CustomEvent("__inflearnSubtitleCaptured", { detail: { subtitles: data, pageUrl } })
          );
        }
      }).catch(() => {});
    }

    return response;
  };
})();
