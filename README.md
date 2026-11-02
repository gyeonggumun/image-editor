# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.


## Image Studio 작업실

시작 화면에서 이미지 편집, 크기 조절, 화질 보정, PDF 변환을 선택합니다. 편집 작업과 PDF 목록은 도구를 이동해도 유지되며, 페이지를 새로고침하면 초기화됩니다.

- **정밀 편집**: 1~1,000px 글자 크기(0.5px 간격), 소수점 좌표, 자간·행간·굵기·텍스트 영역 너비. 방향키 1px, Shift+방향키 10px 이동.
- **크기 조절**: 원본 크기로 불러오기, 가로·세로 픽셀 입력, 비율 잠금, 요소 동시 조절, SNS 규격, 전체 맞춤/채우기/늘이기.
- **화질 보정**: 선명도 커널, 밝기·대비·채도, 원본 비교, 1×/2×/4× 저장. 보간 기반 확대이며 생성형 AI 디테일 복원은 아닙니다.
- **내보내기**: PNG/JPG/WebP/PDF. 선택 표시와 가이드는 저장되지 않습니다. JPG/WebP 품질을 선택할 수 있습니다.
- **PDF 변환**: 최대 20장의 PNG/JPG/WebP, 페이지 순서 조절·삭제, A4 세로/가로·여백, 이미지 원본 비율.

이미지 처리는 브라우저에서 실행됩니다. 입력 파일은 30MB 이하, 입력·출력은 한 변 8,192px 이하 및 총 1,600만 픽셀 이하입니다. 이미지 없는 영역과 투명 배경은 흰색으로 출력합니다. 기존 영역 마스크는 표시만 하며 실제 개체 삭제는 하지 않습니다. 클라우드 템플릿은 기존 `/api/templates` 설정을 사용하고 배경 이미지 자체는 포함하지 않습니다.

### 검증

```sh
node --test tests/image-tools.test.js
npm run build
```

회귀 테스트는 크기 제한, 요소 비례 조절, 이미지 교체/크기 변경 실행 취소·다시 실행, 선명도 및 텍스트 줄바꿈을 확인합니다.
