import { useRef, useCallback } from "react";

/**
 * 팝업 창 관리를 위한 커스텀 훅
 * 팝업 열기, 포커스, 닫힘 감지를 통합 관리합니다.
 */

export interface UsePopupManagerOptions {
	/** 팝업 닫힘 감지 간격 (ms) */
	checkInterval?: number;
	/** 팝업 차단 시 표시할 메시지 */
	blockedMessage?: string;
}

export interface PopupManagerResult {
	/** 단일 팝업 열기 (이미 열려있으면 포커스) */
	openSinglePopup: (
		openFn: () => Window | null,
		onClose?: () => void
	) => Window | null;
	/** 다중 팝업 열기 (ID 기반 관리) */
	openMultiPopup: (
		id: string | number,
		openFn: () => Window | null,
		onClose?: () => void
	) => Window | null;
	/** 단일 팝업 참조 */
	singlePopupRef: React.RefObject<Window | null>;
	/** 다중 팝업 맵 참조 */
	multiPopupsRef: React.RefObject<Map<string | number, Window>>;
}

const DEFAULT_OPTIONS: UsePopupManagerOptions = {
	checkInterval: 1000,
	blockedMessage: "팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.",
};

export function usePopupManager(
	options?: UsePopupManagerOptions
): PopupManagerResult {
	const { checkInterval, blockedMessage } = {
		...DEFAULT_OPTIONS,
		...options,
	};

	const singlePopupRef = useRef<Window | null>(null);
	const multiPopupsRef = useRef<Map<string | number, Window>>(new Map());

	/**
	 * 단일 팝업 열기
	 * 이미 열려있는 팝업이 있으면 포커스만 합니다.
	 */
	const openSinglePopup = useCallback(
		(openFn: () => Window | null, onClose?: () => void): Window | null => {
			// 이미 열린 팝업이 있으면 포커스
			if (singlePopupRef.current && !singlePopupRef.current.closed) {
				singlePopupRef.current.focus();
				return singlePopupRef.current;
			}

			// 새 팝업 열기
			const newPopup = openFn();
			if (newPopup) {
				singlePopupRef.current = newPopup;

				// 팝업 닫힘 감지
				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						clearInterval(checkClosed);
						singlePopupRef.current = null;
						onClose?.();
					}
				}, checkInterval);

				return newPopup;
			} else {
				alert(blockedMessage);
				return null;
			}
		},
		[checkInterval, blockedMessage]
	);

	/**
	 * 다중 팝업 열기 (ID 기반)
	 * 동일 ID의 팝업이 열려있으면 포커스만 합니다.
	 */
	const openMultiPopup = useCallback(
		(
			id: string | number,
			openFn: () => Window | null,
			onClose?: () => void
		): Window | null => {
			const existingPopup = multiPopupsRef.current.get(id);

			// 이미 열린 팝업이 있으면 포커스
			if (existingPopup && !existingPopup.closed) {
				existingPopup.focus();
				return existingPopup;
			}

			// 새 팝업 열기
			const newPopup = openFn();
			if (newPopup) {
				multiPopupsRef.current.set(id, newPopup);

				// 팝업 닫힘 감지
				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						clearInterval(checkClosed);
						multiPopupsRef.current.delete(id);
						onClose?.();
					}
				}, checkInterval);

				return newPopup;
			} else {
				alert(blockedMessage);
				return null;
			}
		},
		[checkInterval, blockedMessage]
	);

	return {
		openSinglePopup,
		openMultiPopup,
		singlePopupRef,
		multiPopupsRef,
	};
}

export default usePopupManager;
