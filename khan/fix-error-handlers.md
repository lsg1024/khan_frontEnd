# Error Handler 수정 가이드

## 완료된 파일

✅ src/utils/errorHandler.ts - showAlert 기본값 true로 변경, data 객체 상세 오류 메시지 처리
✅ src/pages/account/StorePage.tsx
✅ src/pages/account/FactoryPage.tsx  
✅ src/pages/account/AccountFormPage.tsx
✅ src/pages/LoginPage.tsx - 이미 alert 사용중

## 수정이 필요한 파일 목록 (31개)

### Stone 관련 (2개)

- [ ] src/pages/stone/StoneSearchPage.tsx
- [ ] src/pages/stone/StonePage.tsx

### Stock 관련 (10개)

- [ ] src/pages/stock/TotalRentalListPage.tsx
- [ ] src/pages/stock/StockUpdatePage.tsx
- [ ] src/pages/stock/StockReturnPage.tsx
- [ ] src/pages/stock/StockRegisterPage.tsx
- [ ] src/pages/stock/StockPage.tsx
- [ ] src/pages/stock/StockHistoryPage.tsx
- [ ] src/pages/stock/StockDetailPage.tsx
- [ ] src/pages/stock/StockDeletePage.tsx
- [ ] src/pages/stock/StockCreatePage.tsx
- [ ] src/pages/stock/RentalDashBoardPage.tsx

### Search 관련 (3개)

- [ ] src/pages/search/StoreSearchPage.tsx
- [ ] src/pages/search/ProductSearchPage.tsx
- [ ] src/pages/search/FactorySearchPage.tsx

### Sale 관련 (4개)

- [ ] src/pages/sale/SalePage.tsx
- [ ] src/pages/sale/SaleDetailPage.tsx
- [ ] src/pages/sale/SaleCreatePage.tsx
- [ ] src/pages/sale/AccountsReceivablePage.tsx

### Product 관련 (3개)

- [ ] src/pages/product/ProductDetailPage.tsx
- [ ] src/pages/product/ProductCreatePage.tsx
- [ ] src/pages/product/CataLogPage.tsx

### Order 관련 (7개)

- [ ] src/pages/order/StoneInfoPage.tsx
- [ ] src/pages/order/OrderUpdatePage.tsx
- [ ] src/pages/order/OrderPage.tsx
- [ ] src/pages/order/OrderDeletePage.tsx
- [ ] src/pages/order/OrderCreatePage.tsx
- [ ] src/pages/order/FixPage.tsx
- [ ] src/pages/order/DeliveryPage.tsx

### 기타 (1개)

- [ ] src/pages/SettingsPage.tsx

## 수정 패턴

### 1. error state 선언 제거

```tsx
// 제거
const [error, setError] = useState<string>("");
```

### 2. setError 호출 제거

```tsx
// 이전
setError("");
setError("오류 메시지");

// 변경 후
alert("오류 메시지"); // 또는 그냥 제거
```

### 3. handleError 호출 간소화

```tsx
// 이전
handleError(err, setError);

// 변경 후
handleError(err);
```

### 4. catch 블록에서 setError 제거

```tsx
// 이전
} catch (err) {
    setError("오류 발생");
}

// 변경 후
} catch (err) {
    handleError(err);
}
```

### 5. isApiSuccess 체크에서 setError 제거

```tsx
// 이전
if (!isApiSuccess(res)) {
	setError(res.message || "실패");
	return;
}

// 변경 후
if (!isApiSuccess(res)) {
	alert(res.message || "실패");
	return;
}
```

### 6. error UI 제거

```tsx
// 제거
{
	error && (
		<div className="error-message">
			<span>⚠️</span>
			<p>{error}</p>
		</div>
	);
}
```

### 7. useCallback 의존성 배열에 handleError 추가 (필요시)

```tsx
// 이전
}, []);

// 변경 후
}, [handleError]);
```

## 서버 응답 예시

```json
{
	"success": false,
	"message": "NO",
	"data": {
		"storeInfo": "상점 정보는 필수입니다.",
		"accountName": "거래처명을 입력해주세요."
	}
}
```

errorHandler는 이제 자동으로:

1. message를 alert로 표시
2. data 객체의 상세 오류도 함께 표시

```
NO

상세 오류:
storeInfo: 상점 정보는 필수입니다.
accountName: 거래처명을 입력해주세요.
```

## 주요 변경사항 요약

- ✅ 모든 에러는 alert로 표시 (HTML 영역 차지하지 않음)
- ✅ 서버의 상세 오류 메시지도 자동으로 표시
- ✅ error state로 인한 불필요한 리렌더링 제거
- ✅ UI가 더 깔끔해짐 (error-message 요소 제거)
