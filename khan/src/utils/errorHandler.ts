// 공통 에러 처리 유틸리티
import type { ApiResponse } from "../../libs/api/config";

export interface ErrorHandlerOptions {
	showAlert?: boolean;
	defaultMessage?: string;
	onError?: (message: string, statusCode?: number) => void;
}

/**
 * API 에러를 처리하는 공통 함수
 */
export function handleApiError(
	error: unknown,
	options: ErrorHandlerOptions = {}
): string {
	const {
		showAlert = false,
		defaultMessage = "서버와 통신 중 오류가 발생했습니다.",
		onError,
	} = options;

	let errorMessage = defaultMessage;

	// Axios 에러 처리
	if (error && typeof error === "object" && "response" in error) {
		const axiosError = error as {
			response?: {
				status?: number;
				data?: ApiResponse;
			};
		};

		const response = axiosError.response;
		const statusCode = response?.status;
		const responseData = response?.data;

		if (statusCode === 400) {
			// 400 에러: 서버에서 내려주는 메시지 사용
			errorMessage = responseData?.message || "잘못된 요청입니다.";
		} else if (statusCode === 403) {
			// 403 에러: 토큰 관련 에러
			errorMessage = "접근 권한이 없습니다. 다시 로그인해주세요.";
		} else if (responseData && !responseData.success && responseData.message) {
			// 기타 에러: 서버 응답 메시지가 있으면 사용
			errorMessage = responseData.message;
		} else {
			// 그 외의 경우: 기본 메시지
			errorMessage = defaultMessage;
		}
	}
	// 일반 Error 객체 처리
	else if (error instanceof Error) {
		errorMessage = error.message || defaultMessage;
	}

	// 알림 표시
	if (showAlert) {
		alert(errorMessage);
	}

	// 콜백 함수 실행
	if (onError) {
		const statusCode =
			error && typeof error === "object" && "response" in error
				? (error as { response?: { status?: number } }).response?.status
				: undefined;
		onError(errorMessage, statusCode);
	}
	return errorMessage;
}

/**
 * React 컴포넌트에서 사용하기 위한 커스텀 훅
 */
export function useErrorHandler() {
	return {
		handleError: (error: unknown, setError: (message: string) => void) => {
			const message = handleApiError(error);
			setError(message);
		},

		handleErrorWithAlert: (error: unknown) => {
			handleApiError(error, { showAlert: true });
		},

		// 403 에러 시 자동 로그아웃 처리
		handleErrorWithAuth: (
			error: unknown,
			setError: (message: string) => void,
			onUnauthorized?: () => void
		) => {
			const message = handleApiError(error, {
				onError: (_msg, statusCode) => {
					if (statusCode === 403 && onUnauthorized) {
						onUnauthorized(); // 리프레쉬 토큰 이용한 재로그인?
					}
				},
			});
			setError(message);
		},
	};
}
