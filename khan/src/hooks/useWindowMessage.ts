import { useEffect, useRef, useCallback } from "react";

/**
 * 윈도우 메시지 통신을 위한 커스텀 훅
 * 부모-자식 창 간의 postMessage 통신을 추상화합니다.
 */

export type MessageHandler<T = unknown> = (data: T) => void;

export interface UseWindowMessageOptions {
	/** 메시지 수신 시 origin 검증 여부 */
	validateOrigin?: boolean;
	/** 메시지 처리 전 딜레이 (서버 트랜잭션 대기용) */
	defaultDelay?: number;
}

export interface WindowMessageResult {
	/** 메시지 핸들러 등록 */
	on: <T = unknown>(type: string, handler: MessageHandler<T>, delay?: number) => void;
	/** 메시지 핸들러 해제 */
	off: (type: string) => void;
	/** 부모 창에 메시지 전송 */
	sendToParent: (type: string, data?: Record<string, unknown>) => void;
	/** 모든 핸들러 해제 */
	clear: () => void;
}

const DEFAULT_OPTIONS: UseWindowMessageOptions = {
	validateOrigin: true,
	defaultDelay: 500,
};

interface HandlerEntry {
	handler: MessageHandler;
	delay: number;
}

export function useWindowMessage(
	options?: UseWindowMessageOptions
): WindowMessageResult {
	const { validateOrigin, defaultDelay } = {
		...DEFAULT_OPTIONS,
		...options,
	};

	const handlersRef = useRef<Map<string, HandlerEntry>>(new Map());

	// 메시지 리스너 등록
	useEffect(() => {
		const listener = (event: MessageEvent) => {
			// origin 검증
			if (validateOrigin && event.origin !== window.location.origin) {
				return;
			}

			const messageType = event.data?.type;
			if (!messageType) return;

			const entry = handlersRef.current.get(messageType);
			if (entry) {
				// 딜레이가 있으면 setTimeout으로 실행
				if (entry.delay > 0) {
					setTimeout(() => entry.handler(event.data), entry.delay);
				} else {
					entry.handler(event.data);
				}
			}
		};

		window.addEventListener("message", listener);
		return () => window.removeEventListener("message", listener);
	}, [validateOrigin]);

	/**
	 * 메시지 핸들러 등록
	 */
	const on = useCallback(
		<T = unknown>(
			type: string,
			handler: MessageHandler<T>,
			delay?: number
		) => {
			handlersRef.current.set(type, {
				handler: handler as MessageHandler,
				delay: delay ?? defaultDelay ?? 0,
			});
		},
		[defaultDelay]
	);

	/**
	 * 메시지 핸들러 해제
	 */
	const off = useCallback((type: string) => {
		handlersRef.current.delete(type);
	}, []);

	/**
	 * 부모 창에 메시지 전송
	 */
	const sendToParent = useCallback(
		(type: string, data?: Record<string, unknown>) => {
			if (window.opener) {
				window.opener.postMessage(
					{ type, ...data },
					window.location.origin
				);
			}
		},
		[]
	);

	/**
	 * 모든 핸들러 해제
	 */
	const clear = useCallback(() => {
		handlersRef.current.clear();
	}, []);

	return {
		on,
		off,
		sendToParent,
		clear,
	};
}

export default useWindowMessage;
