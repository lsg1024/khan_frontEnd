# 페이지네이션 시스템 사용법

## 개요

재사용 가능한 페이지네이션 훅과 컴포넌트를 제공합니다.

## 사용법

### 1. 훅 사용

```tsx
import { usePagination } from "../hooks/usePagination";

function MyPage() {
  const pagination = usePagination(20, (page) => {
    // 페이지 변경시 실행될 콜백
    loadData(page);
  });

  const loadData = async (page: number) => {
    // API 호출
    const response = await apiRequest.get(`/api/data?page=${page}&size=20`);

    // 페이지네이션 상태 업데이트
    pagination.setPaginationState({
      currentPage: response.data.page.currentPage,
      totalPages: response.data.page.totalPages,
      totalElements: response.data.page.totalElements,
      pageSize: response.data.page.size,
    });
  };
}
```

### 2. 컴포넌트 사용

```tsx
import Pagination from "../components/common/Pagination";
import PageInfo from "../components/common/PageInfo";

function MyPage() {
  return (
    <div>
      {/* 헤더에 페이지 정보 표시 */}
      <PageInfo pagination={pagination.paginationState} />

      {/* 데이터 표시 */}
      <div>{/* 데이터 렌더링 */}</div>

      {/* 하단에 페이지네이션 */}
      <Pagination pagination={pagination} />
    </div>
  );
}
```

## API

### usePagination 훅

- `paginationState`: 현재 페이지네이션 상태
- `setPaginationState`: 페이지네이션 상태 업데이트
- `goToPage`: 특정 페이지로 이동
- `nextPage`: 다음 페이지로 이동
- `prevPage`: 이전 페이지로 이동
- `reset`: 상태 초기화
- `canGoNext`: 다음 페이지 이동 가능 여부
- `canGoPrev`: 이전 페이지 이동 가능 여부
- `getVisiblePages`: 표시할 페이지 번호 배열

### Pagination 컴포넌트

- `pagination`: usePagination 훅 반환값
- `className`: 추가 CSS 클래스

### PageInfo 컴포넌트

- `pagination`: 페이지네이션 상태 객체
- `className`: 추가 CSS 클래스
