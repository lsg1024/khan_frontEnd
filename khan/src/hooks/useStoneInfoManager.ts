import { useRef, useCallback } from "react";
import { calculateStoneDetails } from "../utils/calculateStone";
import type { StoneInfo } from "../types/stoneDto";

/**
 * 스톤 정보가 있는 행 데이터의 기본 인터페이스
 */
export interface StoneInfoRow {
	id: string;
	stoneInfos?: StoneInfo[];
}

/**
 * 스톤 정보 업데이트 필드들
 */
export interface StoneCalculatedFields {
	mainStonePrice: number;
	assistanceStonePrice: number;
	stoneAddLaborCost: number;
	mainStoneCount: number;
	assistanceStoneCount: number;
	stoneWeight: number;
	stoneWeightTotal?: number;
}

export type StoneInfoManagerUrlType = "order" | "stock";

interface UseStoneInfoManagerProps<T extends StoneInfoRow> {
	/** 행 데이터 배열 */
	rows: T[];
	/** 행 업데이트 함수 */
	updateRow: (id: string, field: keyof T, value: unknown) => void;
	/** 팝업 URL 타입 (order: /orders/stone-info, stock: /stock/stone-info) */
	urlType?: StoneInfoManagerUrlType;
	/** stoneWeight를 문자열로 저장할지 여부 (Stock, Sale은 true) */
	stoneWeightAsString?: boolean;
	/** 가격 계산 건너뛰기 여부 (수리 모드에서 사용) */
	skipPriceCalculation?: boolean;
}

interface UseStoneInfoManagerResult {
	/** 스톤 정보 관리 팝업 열기 */
	openStoneInfoManager: (rowId: string) => void;
}

/**
 * 스톤 정보 관리 팝업을 위한 공통 hook
 *
 * @example
 * // OrderCreatePage에서 사용
 * const { openStoneInfoManager } = useStoneInfoManager({
 *   rows: orderRows,
 *   updateRow: updateOrderRow,
 *   urlType: 'order',
 * });
 *
 * @example
 * // StockCreatePage에서 사용
 * const { openStoneInfoManager } = useStoneInfoManager({
 *   rows: stockRows,
 *   updateRow: updateStockRow,
 *   urlType: 'stock',
 *   stoneWeightAsString: true,
 * });
 */
export function useStoneInfoManager<T extends StoneInfoRow>({
	rows,
	updateRow,
	urlType = "order",
	stoneWeightAsString = false,
	skipPriceCalculation = false,
}: UseStoneInfoManagerProps<T>): UseStoneInfoManagerResult {
	const rowsRef = useRef<T[]>(rows);

	// rows가 변경될 때마다 ref 업데이트
	rowsRef.current = rows;

	const openStoneInfoManager = useCallback(
		(rowId: string) => {
			const baseUrl =
				urlType === "order" ? "/orders/stone-info" : "/stock/stone-info";
			const url = `${baseUrl}?rowId=${rowId}&origin=${window.location.origin}`;
			const NAME = `stoneInfo_${rowId}`;
			const FEATURES = "resizable=yes,scrollbars=yes,width=1200,height=800";

			const popup = window.open(url, NAME, FEATURES);
			if (popup) {
				popup.focus();

				const handleMessage = (event: MessageEvent) => {
					if (event.origin !== window.location.origin) return;

					// 팝업에서 스톤 정보 요청 시 응답
					if (
						event.data.type === "REQUEST_STONE_INFO" &&
						event.data.rowId === rowId
					) {
						const row = rowsRef.current.find((r) => r.id === rowId);
						popup.postMessage(
							{
								type: "STONE_INFO_DATA",
								stoneInfos: row?.stoneInfos || [],
							},
							window.location.origin
						);
					}
					// 팝업에서 스톤 정보 저장 시 처리
					else if (
						event.data.type === "STONE_INFO_SAVE" &&
						event.data.rowId === rowId
					) {
						const stoneInfos = event.data.stoneInfos as StoneInfo[];

						// 스톤 정보 업데이트
						updateRow(rowId, "stoneInfos" as keyof T, stoneInfos);

						// 스톤 정보 변경 시 알 단가 자동 계산
						const calculatedStoneData = calculateStoneDetails(stoneInfos);

						// 수리 모드에서는 가격 0으로 설정, 그 외에는 계산된 값 사용
						updateRow(
							rowId,
							"mainStonePrice" as keyof T,
							skipPriceCalculation ? 0 : calculatedStoneData.mainStonePrice
						);
						updateRow(
							rowId,
							"assistanceStonePrice" as keyof T,
							skipPriceCalculation ? 0 : calculatedStoneData.assistanceStonePrice
						);
						updateRow(
							rowId,
							"stoneAddLaborCost" as keyof T,
							skipPriceCalculation ? 0 : calculatedStoneData.stoneAddLaborCost
						);
						updateRow(
							rowId,
							"mainStoneCount" as keyof T,
							calculatedStoneData.mainStoneCount
						);
						updateRow(
							rowId,
							"assistanceStoneCount" as keyof T,
							calculatedStoneData.assistanceStoneCount
						);
						updateRow(
							rowId,
							"stoneWeightTotal" as keyof T,
							calculatedStoneData.stoneWeight
						);

						// stoneWeight 필드 처리 (타입에 따라 문자열 또는 숫자)
						const stoneWeightValue = stoneWeightAsString
							? calculatedStoneData.stoneWeight.toString()
							: calculatedStoneData.stoneWeight;
						updateRow(rowId, "stoneWeight" as keyof T, stoneWeightValue);
					}
				};

				window.addEventListener("message", handleMessage);

				// 팝업이 닫힐 때 이벤트 리스너 제거
				const checkClosed = setInterval(() => {
					if (popup.closed) {
						window.removeEventListener("message", handleMessage);
						clearInterval(checkClosed);
					}
				}, 1000);
			}
		},
		[updateRow, urlType, stoneWeightAsString, skipPriceCalculation]
	);

	return { openStoneInfoManager };
}

// 하위 호환성을 위한 기존 인터페이스 유지 (deprecated)
export type { UseStoneInfoManagerProps as UseStoneInfoManagerOptions };
