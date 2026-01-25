/**
 * 팝업 창 관련 유틸리티 함수들
 */

export interface PopupOptions {
	width?: number;
	height?: number;
	resizable?: boolean;
	scrollbars?: boolean;
}

const DEFAULT_OPTIONS: PopupOptions = {
	width: 1200,
	height: 800,
	resizable: true,
	scrollbars: true,
};

/**
 * 팝업 옵션을 문자열로 변환
 */
function buildFeatures(options: PopupOptions): string {
	const merged = { ...DEFAULT_OPTIONS, ...options };
	const features = [
		`width=${merged.width}`,
		`height=${merged.height}`,
		merged.resizable ? "resizable=yes" : "resizable=no",
		merged.scrollbars ? "scrollbars=yes" : "scrollbars=no",
	];
	return features.join(",");
}

/**
 * 상품 상세 팝업 열기
 */
export function openProductDetailPopup(productId: string): Window | null {
	const url = `/catalog/detail/${productId}`;
	const features = buildFeatures({ width: 1400, height: 900 });
	return window.open(url, "product_detail", features);
}

/**
 * 상품 생성 팝업 열기
 */
export function openProductCreatePopup(): Window | null {
	const url = "/catalog/create";
	const features = buildFeatures({ width: 1400, height: 900 });
	return window.open(url, "product_create", features);
}

/**
 * 상품 수정 팝업 열기
 */
export function openProductEditPopup(productId: string): Window | null {
	const url = `/catalog/edit/${productId}`;
	const features = buildFeatures({ width: 1400, height: 900 });
	return window.open(url, "product_edit", features);
}

/**
 * 스톤 검색 팝업 열기
 */
export function openStoneSearchPopup(index: number): Window | null {
	const popupUrl = `/stone-search?parentOrigin=${encodeURIComponent(
		window.location.origin
	)}&stoneIndex=${index}`;
	const features = buildFeatures({ width: 800, height: 600 });
	return window.open(popupUrl, `stoneSearch_${index}`, features);
}

/**
 * 스톤 생성 팝업 열기
 */
export function openStoneCreatePopup(): Window | null {
	const url = "/stone/create";
	const features = buildFeatures({ width: 1000, height: 700 });
	return window.open(url, "stone_create", features);
}

/**
 * 스톤 수정 팝업 열기
 */
export function openStoneEditPopup(stoneId: string): Window | null {
	const url = `/stone/edit/${stoneId}`;
	const features = buildFeatures({ width: 1000, height: 700 });
	return window.open(url, `stone_edit_${stoneId}`, features);
}

/**
 * 거래처 생성 팝업 열기
 */
export function openAccountCreatePopup(
	type: "store" | "factory"
): Window | null {
	const url = `/accounts/detail?type=${type}`;
	const features = buildFeatures({ width: 800, height: 800 });
	return window.open(url, `account_create_${type}`, features);
}

/**
 * 거래처 상세/수정 팝업 열기
 */
export function openAccountDetailPopup(
	type: "store" | "factory",
	accountId: string
): Window | null {
	const url = `/accounts/detail/${accountId}?type=${type}`;
	const features = buildFeatures({ width: 800, height: 800 });
	return window.open(url, `account_detail_${accountId}`, features);
}

/**
 * 주문 생성 팝업 열기
 */
export function openOrderCreatePopup(
	mode: "order" | "fix" | "expact"
): Window | null {
	const url = `/orders/create/${mode}`;
	const features = buildFeatures({ width: 1400, height: 900 });
	return window.open(url, `order_create_${mode}`, features);
}

/**
 * 주문 수정 팝업 열기
 */
export function openOrderUpdatePopup(
	mode: "order" | "fix" | "expact",
	flowCode: string
): Window | null {
	const url = `/orders/update/${mode}/${flowCode}`;
	const features = buildFeatures({ width: 1400, height: 600 });
	return window.open(url, `order_update_${flowCode}`, features);
}

/**
 * 재고 생성 팝업 열기
 */
export function openStockCreatePopup(
	mode: "normal" | "return" | "expact"
): Window | null {
	const url = `/stocks/create/${mode}`;
	const features = buildFeatures({ width: 1400, height: 800 });
	return window.open(url, `stock_create_${mode}`, features);
}

/**
 * 재고 수정 팝업 열기
 */
export function openStockUpdatePopup(flowCode: string): Window | null {
	const url = `/stocks/update/${flowCode}`;
	const features = buildFeatures({ width: 1400, height: 350 });
	return window.open(url, `stock_update_${flowCode}`, features);
}

/**
 * 판매 생성 팝업 열기
 */
export function openSaleCreatePopup(): Window | null {
	const url = "/sales/create";
	const features = buildFeatures({ width: 1400, height: 800 });
	return window.open(url, "sale_create", features);
}

/**
 * 판매 상세 팝업 열기
 */
export function openSaleDetailPopup(
	saleType: string,
	flowCode: string
): Window | null {
	const url = `/sales/detail/${saleType}/${flowCode}`;
	const features = buildFeatures({ width: 1400, height: 500 });
	return window.open(url, `sale_detail_${flowCode}`, features);
}
