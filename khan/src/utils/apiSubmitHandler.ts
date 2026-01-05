import type { ApiResponse } from "../../libs/api/config";

export interface SubmitHandlerOptions {
	/** API 호출 프로미스 배열 */
	promises: Promise<ApiResponse<unknown>>[];
	/** 성공 시 표시할 메시지 */
	successMessage: string;
	/** 실패 시 표시할 메시지 (선택) */
	failureMessage?: string;
	/** 부모 창에 전송할 메시지 타입 (선택) */
	parentMessageType?: string;
	/** 부모 창에 전송할 추가 데이터 (선택) */
	parentMessageData?: Record<string, unknown>;
	/** 성공 시 창을 자동으로 닫을지 여부 (기본값: true) */
	autoClose?: boolean;
	/** 창을 닫기 전 대기 시간 (ms, 기본값: 300) */
	closeDelay?: number;
	/** 콘솔 로그 메시지 (선택) */
	logMessage?: string;
}

export interface SubmitHandlerResult {
	success: boolean;
	successCount: number;
	failedCount: number;
	responses: ApiResponse<unknown>[];
}

/**
 * API 호출을 처리하고 결과를 사용자에게 알리는 통합 핸들러
 */
export async function handleApiSubmit(
	options: SubmitHandlerOptions
): Promise<SubmitHandlerResult> {
	const {
		promises,
		successMessage,
		failureMessage,
		parentMessageType,
		parentMessageData = {},
		autoClose = true,
		closeDelay = 300,
		logMessage,
	} = options;

	try {
		// 모든 API 호출 대기
		const responses = await Promise.all(promises);

		// 각 응답의 success 상태 확인
		const successResults = responses.map(
			(res: ApiResponse<unknown>, index: number) => ({
				index,
				success: res.success,
				data: res.data,
			})
		);

		const successCount = successResults.filter(
			(r: { index: number; success: boolean; data: unknown }) => r.success
		).length;
		const failedCount = successResults.filter(
			(r: { index: number; success: boolean; data: unknown }) => !r.success
		).length;

		// 콘솔 로깅
		if (logMessage) {
			console.log(`${logMessage} 완료:`, {
				successCount,
				failedCount,
				responses,
			});
		}

		// 사용자 알림
		if (failedCount > 0) {
			const message =
				failureMessage ||
				`${successCount}개는 성공했으나, ${failedCount}개는 실패했습니다.`;
			alert(message);
		} else {
			alert(successMessage);
		}

		// 부모 창에 메시지 전송
		if (window.opener && parentMessageType) {
			window.opener.postMessage(
				{
					type: parentMessageType,
					success: failedCount === 0,
					successCount,
					failedCount,
					...parentMessageData,
				},
				window.location.origin
			);
		}

		// 서버 응답 처리 완료 후 약간의 여유시간을 두고 창 닫기
		// 모든 응답이 성공한 경우에만 자동으로 닫기
		if (autoClose && window.opener && failedCount === 0) {
			setTimeout(() => {
				window.close();
			}, closeDelay);
		}

		return {
			success: failedCount === 0,
			successCount,
			failedCount,
			responses,
		};
	} catch (error) {
		console.error("API 제출 중 오류 발생:", error);
		throw error;
	}
}
