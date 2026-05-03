<div align="center">
  <img src="assets/icon.png" width="128" alt="인프런 자막 다운로더" />

  # 인프런 자막 다운로더

  인프런 강의 자막을 텍스트 파일로 저장하는 Chrome 확장 프로그램

</div>

---

## 설치 방법

Chrome 웹 스토어에 등록되어 있지 않으므로 아래 방법으로 직접 설치하세요.

1. 이 저장소를 ZIP으로 다운로드 (GitHub 페이지 우측 상단 `Code → Download ZIP`)
2. ZIP 파일을 **영구 보관할 위치**에 압축 해제
3. Chrome 주소창에 `chrome://extensions` 입력
4. 우측 상단 **개발자 모드** 켜기
5. **압축해제된 확장 프로그램을 로드합니다** 클릭 → 압축 해제한 폴더 선택

> 로드한 폴더를 삭제하거나 이동하면 동작하지 않습니다.

[Chrome 공식 가이드 — 압축 해제된 확장 프로그램 로드](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world?hl=ko#load-unpacked)

## 사용 방법

![screenshot](assets/screenshot.png)

1. 인프런 강의 페이지에서 **스크립트** 탭 열기
2. 스크립트 탭 우측 상단에 나타난 다운로드 버튼(↓) 클릭
3. **전체 복사** 또는 **텍스트 다운로드** 선택

## 작동 방식

별도의 API 요청을 보내지 않습니다. 강의 재생 시 자막 API 응답을 캡처해 저장합니다.

```
강의 재생 → 브라우저가 자막 API 요청 → 응답 캡처 → 다운로드 버튼 활성화
```

내부적으로 `window.fetch`를 오버라이드해 자막 URL(`vod.inflearn.com/.../subtitles/json`)에 해당하는 응답만 추출합니다. 임의로 API를 호출하거나 인증 정보에 접근하지 않습니다.

## 주의사항

- **개인 학습 목적으로만** 사용하세요.
- 다운로드한 자막을 무단 배포하거나 상업적으로 이용하는 행위는 인프런 이용약관에 위배될 소지가 있으니 주의하세요.
- 인프런 사이트 업데이트에 따라 동작하지 않을 수 있습니다.

## 라이선스

[MIT](LICENSE)
