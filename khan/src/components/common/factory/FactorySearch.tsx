import React, { useEffect, useRef } from "react";
import type { FactorySearchDto } from "../../../types/factory";
import "../../../styles/components/factorySearch.css";

interface FactorySearchProps {
	onSelectFactory: (factory: FactorySearchDto) => void;
	onClose?: () => void;
}

const FactorySearch: React.FC<FactorySearchProps> = ({
	onSelectFactory,
	onClose
}) => {
	// 함수들을 ref로 저장하여 리렌더링 시에도 동일한 참조 유지
	const onSelectFactoryRef = useRef(onSelectFactory);
	const onCloseRef = useRef(onClose);

	// ref 업데이트
	useEffect(() => {
		onSelectFactoryRef.current = onSelectFactory;
		onCloseRef.current = onClose;
	});

	// 컴포넌트가 마운트되면 자동으로 팝업 열기
	useEffect(() => {
		// 팝업 창 열기
		const popup = window.open(
			"/factory-search",
			"factorySearch",
			"width=1000,height=450,scrollbars=yes,resizable=yes"
		);

		// 팝업에서 제조사 선택 시 메시지 처리
		const handleMessage = (event: MessageEvent) => {
			if (event.data?.type === "FACTORY_SELECTED") {
				onSelectFactoryRef.current(event.data.data);
				window.removeEventListener("message", handleMessage);
			}
		};

		window.addEventListener("message", handleMessage);

		// 팝업이 닫힐 때 이벤트 리스너 정리
		const checkClosed = setInterval(() => {
			if (popup?.closed) {
				window.removeEventListener("message", handleMessage);
				clearInterval(checkClosed);
				onCloseRef.current?.();
			}
		}, 1000);

		return () => {
			window.removeEventListener("message", handleMessage);
			clearInterval(checkClosed);
		};
	}, []); 

	return null;
};

export default FactorySearch;
