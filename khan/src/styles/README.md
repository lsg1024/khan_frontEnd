# CSS 폴더 구조 가이드

## 📁 폴더 구조

```
src/styles/
├── index.css                 # 메인 스타일 진입점
├── variables.css             # CSS 변수 및 토큰
├── global.css               # 전역 스타일 및 리셋
├── components/              # 공통 컴포넌트 스타일
│   └── common.css          # 버튼, 카드, 폼 등 공통 컴포넌트
├── pages/                   # 페이지별 전용 스타일
│   ├── LoginPage.css       # 로그인 페이지 스타일
│   └── HomePage.css        # 홈페이지 스타일
└── utils/                   # 유틸리티 클래스
    └── utilities.css       # 마진, 패딩, 텍스트 등 유틸리티
```

## 🎨 사용 방법

### 1. 전역 스타일 적용

`src/main.tsx` 또는 `src/App.tsx`에서:

```typescript
import "./styles/index.css";
```

### 2. 페이지별 스타일 적용

각 페이지 컴포넌트에서:

```typescript
// LoginPage.tsx
import "../styles/pages/LoginPage.css";

// HomePage.tsx
import "../styles/pages/HomePage.css";
```

### 3. CSS 변수 활용

```css
.my-component {
  color: var(--primary-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
}
```

## 🏗️ 확장 가이드

### 새 페이지 스타일 추가

1. `src/styles/pages/NewPage.css` 파일 생성
2. 페이지 컴포넌트에서 import
3. 페이지별 클래스명 패턴: `.new-page`, `.new-page-container` 등

### 새 컴포넌트 스타일 추가

1. `src/styles/components/ComponentName.css` 파일 생성
2. 공통으로 사용되면 `index.css`에 import 추가
3. 컴포넌트별 클래스명 패턴: `.component-name`, `.component-name__element` 등

### CSS 변수 추가

`variables.css`에 새로운 변수 정의:

```css
:root {
  --new-color: #123456;
  --new-spacing: 2rem;
}
```

## 📝 네이밍 컨벤션

- **페이지**: `kebab-case` (예: `.login-page`, `.user-profile`)
- **컴포넌트**: `kebab-case` (예: `.btn`, `.card`, `.form-control`)
- **상태**: `is-` 또는 `has-` 접두사 (예: `.is-active`, `.has-error`)
- **크기**: 접미사 사용 (예: `.btn-sm`, `.btn-lg`)
- **색상**: 의미 기반 (예: `.btn-primary`, `.text-danger`)

## 🎯 Best Practices

1. **CSS 변수 우선 사용**: 하드코딩된 값 대신 CSS 변수 활용
2. **컴포넌트 단위**: 재사용 가능한 컴포넌트 스타일 작성
3. **반응형 설계**: 모바일 우선 접근법 적용
4. **성능 최적화**: 필요한 스타일만 import
5. **일관성 유지**: 동일한 패턴과 네이밍 규칙 준수
