# Khan Frontend

귀금속 판매 및 재고 관리 시스템의 프론트엔드 애플리케이션입니다.

## 기술 스택

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **Styling**: CSS (모듈화된 스타일 시트)
- **Print**: QZ Tray, react-to-print
- **기타**: date-fns, bwip-js (바코드), react-calendar

## 프로젝트 구조

```
khan/
├── libs/                      # 공통 라이브러리
│   ├── api/                   # API 클라이언트 및 엔드포인트
│   │   ├── config.ts          # Axios 설정, 인터셉터, 토큰 관리
│   │   ├── productApi.ts      # 상품 API
│   │   ├── orderApi.ts        # 주문 API
│   │   ├── stockApi.ts        # 재고 API
│   │   ├── saleApi.ts         # 판매 API
│   │   ├── catalogApi.ts      # 카탈로그 API (STORE 역할 전용)
│   │   └── ...
│   └── domain.ts              # 도메인/테넌트 관련 유틸리티
├── src/
│   ├── components/            # 재사용 가능한 컴포넌트
│   │   ├── common/            # 공통 컴포넌트 (Toast, Table, Modal 등)
│   │   ├── layout/            # 레이아웃 컴포넌트
│   │   │   ├── Layout.tsx     # 메인 레이아웃 (TopBar + Sidebar)
│   │   │   └── StoreLayout.tsx # STORE 역할 전용 레이아웃
│   │   └── ...
│   ├── pages/                 # 페이지 컴포넌트
│   │   ├── account/           # 거래처 관리 (판매처, 제조사)
│   │   ├── gold_money/        # 금시세 관리
│   │   ├── order/             # 주문 관리
│   │   ├── product/           # 상품 카탈로그
│   │   ├── purchase/          # 매입 관리
│   │   ├── sale/              # 판매 관리
│   │   ├── search/            # 검색 팝업
│   │   ├── setting/           # 설정
│   │   ├── stock/             # 재고 관리
│   │   ├── stone/             # 스톤 관리
│   │   └── store/             # STORE 역할 전용 페이지
│   ├── styles/                # CSS 스타일시트
│   │   ├── components/        # 컴포넌트별 스타일
│   │   └── pages/             # 페이지별 스타일
│   ├── types/                 # TypeScript 타입 정의
│   ├── utils/                 # 유틸리티 함수
│   │   ├── tokenUtils.ts      # JWT 토큰 관리
│   │   ├── errorHandler.ts    # 에러 처리
│   │   └── ...
│   ├── hooks/                 # 커스텀 React Hooks
│   ├── service/               # 서비스 레이어 (QZ Tray 등)
│   ├── App.tsx                # 메인 앱 컴포넌트 (라우팅)
│   └── main.tsx               # 엔트리 포인트
├── public/                    # 정적 파일
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 주요 기능

### 1. 상품 관리 (Catalog)
- 상품 목록 조회 및 검색
- 상품 등록/수정/삭제
- 상품 상세 정보 (이미지, 스톤 정보, 가격 정책)

### 2. 주문 관리 (Order)
- 주문 생성/수정/삭제
- FIX 주문 관리
- 배송 예정 관리

### 3. 재고 관리 (Stock)
- 재고 등록/수정
- 재고 이력 조회
- 대여 관리
- 반품/삭제 처리

### 4. 판매 관리 (Sale)
- 판매 생성
- 영수증 출력 (QZ Tray 연동)
- 미수금 관리

### 5. 거래처 관리 (Account)
- 판매처 관리
- 제조사 관리

### 6. 스톤 관리 (Stone)
- 스톤 목록 관리
- 스톤별 상품 조회

### 7. 금시세 관리 (Gold Money)
- 일별 금시세 조회/등록

### 8. STORE 역할 전용 카탈로그
- 가격 정보 없는 상품 카탈로그
- 별도 레이아웃 (`/store/catalog`)

## 역할 기반 라우팅

| 역할 | 접근 가능 경로 |
|------|---------------|
| STORE | `/store/catalog`, `/store/catalog/:productId` |
| 기타 (ADMIN, USER 등) | 모든 경로 |

## 설치 및 실행

### 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 `http://localhost:5173`에서 실행됩니다.

### 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

### 빌드 미리보기

```bash
npm run preview
```

## 환경 설정

### API 서버
- Production: `https://api.kkhan.co.kr`
- Local: `http://localhost:8080`

API 서버 URL은 `libs/api/config.ts`에서 설정됩니다.

### 멀티 테넌트
서브도메인 기반 멀티 테넌트를 지원합니다. JWT 토큰에 포함된 `tenantId`와 현재 서브도메인이 일치해야 합니다.

## Docker 배포

```bash
docker-compose up -d
```

또는 개별 빌드:

```bash
docker build -t khan-frontend .
docker run -p 80:80 khan-frontend
```

## 프린터 연동

QZ Tray를 사용하여 영수증 프린터와 연동합니다.

1. [QZ Tray](https://qz.io/download/) 설치
2. 인증서 설정 (필요시)
3. 프린터 연결 후 사용

## 개발 가이드

### 코드 스타일
```bash
npm run lint
```

### 타입 체크
```bash
npx tsc --noEmit
```

### 새 페이지 추가
1. `src/pages/` 하위에 페이지 컴포넌트 생성
2. `src/styles/pages/` 하위에 스타일 파일 생성
3. `src/App.tsx`에 라우트 추가

### 새 API 추가
1. `libs/api/` 하위에 API 파일 생성 또는 기존 파일에 추가
2. `src/types/` 하위에 DTO 타입 정의

## 라이선스

Private - All rights reserved
