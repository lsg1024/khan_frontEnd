import React, { useEffect, useRef } from "react";
import type { ProductDto } from "../../../types/productDto";
import "../../../styles/components/search/ProductSearch.css";

interface ProductSearchProps {
	onSelectProduct: (product: ProductDto) => void;
	onClose?: () => void;
	grade?: string;
	initialSearch?: string; // 초기 검색어 (팝업 열릴 때 자동 검색)
}

const ProductSearch: React.FC<ProductSearchProps> = ({
	onSelectProduct,
	onClose,
	grade: grade = "1",
	initialSearch = "",
}) => {
	// 함수들을 ref로 저장하여 리렌더링 시에도 동일한 참조 유지
	const onSelectProductRef = useRef(onSelectProduct);
	const onCloseRef = useRef(onClose);

	useEffect(() => {
		onSelectProductRef.current = onSelectProduct;
		onCloseRef.current = onClose;
	});

	useEffect(() => {
		// 팝업 창 열기 (grade, initialSearch 파라미터 전달)
		const params = new URLSearchParams();
		params.set("grade", grade);
		if (initialSearch) params.set("search", initialSearch);
		const popup = window.open(
			`/product-search?${params.toString()}`,
			"productSearch",
			"width=1200,height=750,scrollbars=yes,resizable=yes"
		);

		// 팝업에서 상품 선택 시 메시지 처리
		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === "PRODUCT_SELECTED") {
				onSelectProductRef.current(event.data.data);
				window.removeEventListener("message", handleMessage);
			}
		};

		window.addEventListener("message", handleMessage);

		// 팝업이 닫힐 때 이벤트 리스너 정리
		const checkClosed = setInterval(() => {
			if (popup?.closed) {
				window.removeEventListener("message", handleMessage);
				clearInterval(checkClosed);
				// 팝업이 닫힐 때 부모에게 알림
				onCloseRef.current?.();
			}
		}, 1000);

		// 클린업 함수
		return () => {
			window.removeEventListener("message", handleMessage);
			clearInterval(checkClosed);
		};
	}, [grade, initialSearch]);

	return null; // 실제 UI는 팝업에서 렌더링
};

export default ProductSearch;
