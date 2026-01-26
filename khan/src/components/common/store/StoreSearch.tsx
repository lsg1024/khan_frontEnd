import React, { useEffect, useRef } from "react";
import type { StoreSearchDto, AccountInfoDto } from "../../../types/storeDto";
import "../../../styles/components/search/StoreSearch.css";

interface StoreSearchProps {
	onSelectStore: (store: StoreSearchDto | AccountInfoDto) => void;
	onClose?: () => void;
	useReceivableApi?: boolean; // 미수 금액 포함 API 사용 여부
	initialSearch?: string; // 초기 검색어 (팝업 열릴 때 자동 검색)
}

const StoreSearch: React.FC<StoreSearchProps> = ({
	onSelectStore,
	onClose,
	useReceivableApi: useReceivableApi = false,
	initialSearch = "",
}) => {
	// 함수들을 ref로 저장하여 리렌더링 시에도 동일한 참조 유지
	const onSelectStoreRef = useRef(onSelectStore);
	const onCloseRef = useRef(onClose);

	// ref 업데이트
	useEffect(() => {
		onSelectStoreRef.current = onSelectStore;
		onCloseRef.current = onClose;
	});

	// 컴포넌트가 마운트되면 자동으로 팝업 열기
	useEffect(() => {
		// 팝업 창 열기 (useReceivableApi, initialSearch 파라미터 전달)
		const params = new URLSearchParams();
		if (useReceivableApi) params.set("useReceivable", "true");
		if (initialSearch) params.set("search", initialSearch);
		const queryString = params.toString();
		const url = `/store-search${queryString ? `?${queryString}` : ""}`;

		// 새 팝업 열기 - 같은 이름으로 열면 기존 팝업이 자동으로 대체됨
		const popup = window.open(
			url,
			"storeSearch",
			"width=1000,height=450,scrollbars=yes,resizable=yes"
		);

		if (!popup) {
			return;
		}

		// 팝업에서 거래처 선택 시 메시지 처리
		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === "STORE_SELECTED") {
				onSelectStoreRef.current(event.data.data);
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
	}, [useReceivableApi, initialSearch]);

	return null; // 실제 UI는 팝업에서 렌더링
};

export default StoreSearch;
