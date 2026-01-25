// 공통 에러 처리 유틸리티
import type { ApiResponse } from "../../libs/api/config";
import { useToast } from "../components/common/toast/Toast";

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
		showAlert = true, // 기본값을 true로 변경하여 항상 alert 표시
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
		const responseData = response?.data;

		// 서버 에러 응답: ApiResponse<T> 형식 { success: false, message: string, data: null }
		if (
			responseData &&
			typeof responseData === "object" &&
			"message" in responseData
		) {
			errorMessage = responseData.message || defaultMessage;
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
 * React 컴포넌트에서 사용하기 위한 커스텀 훅 (Toast 알림 사용)
 */
export function useErrorHandler() {
	const { showToast } = useToast();

	return {
		handleError: (error: unknown, context?: string) => {
			let errorMessage = "서버와 통신 중 오류가 발생했습니다.";

			// Axios 에러 처리
			if (error && typeof error === "object" && "response" in error) {
				const axiosError = error as {
					response?: {
						status?: number;
						data?: ApiResponse;
					};
				};

				const response = axiosError.response;
				const responseData = response?.data;

				// 서버 에러 응답: ApiResponse<T> 형식
				if (
					responseData &&
					typeof responseData === "object" &&
					"message" in responseData
				) {
					errorMessage = responseData.message || errorMessage;
				}
			}
			// 일반 Error 객체 처리
			else if (error instanceof Error) {
				errorMessage = error.message || errorMessage;
			}

			// 콘솔에 에러 로그 출력
			console.error(`[${context || "Error"}]:`, error);

			// Toast로 에러 메시지 표시
			showToast(errorMessage, "error", 5000);
		},
	};
}

/**
 * @deprecated Use useErrorHandler hook instead
 * 레거시 alert 기반 에러 처리 함수 (하위 호환성을 위해 유지)
 */
