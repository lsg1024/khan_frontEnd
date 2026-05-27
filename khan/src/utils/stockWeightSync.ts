/**
 * 재고 행의 무게 필드 동기화 유틸리티
 *
 * 비즈니스 규칙 (kkhan 보석 MSA — 재고 생성/수정 페이지):
 *   총중량(totalWeight) = 금중량(goldWeight, 재질기반) + 알중량(stoneWeight)
 *
 * - totalWeight / stoneWeight / materialId / materialName 중 어느 하나라도 변경되면
 *   위 항등식을 유지하도록 나머지 필드를 자동 보정한다.
 * - 알중량(stoneWeight)이 세팅되는 순간 총중량이 비어 있거나 알중량보다 작으면
 *   총중량을 알중량에 맞춰 자동으로 채운다 (총컬럼 자동 반영 요구사항).
 * - 재질이 바뀔 때도 금중량을 재계산하여 "재질이 바뀌면 금중량도 같이 바뀐다"를
 *   UI 상 즉시 반영.
 *
 * 이 함수는 pure function 이며 호출자가 기존 row 와 shallow merge 하는 방식으로
 * 사용한다. React setState 의 함수형 업데이터 안에서 호출되어야 안전하다.
 */
import type { StockOrderRows } from "../types/stockDto";

/**
 * 무게 동기화 대상이 되는 필드 집합.
 * 이 필드들이 변경될 때에만 동기화 로직이 트리거된다.
 */
const WEIGHT_SYNC_FIELDS: ReadonlySet<keyof StockOrderRows> = new Set([
	"stoneWeight",
	"totalWeight",
	"materialId",
	"materialName",
]);

/** 무게 동기화 대상 필드인지 확인 */
export const isWeightSyncField = (field: keyof StockOrderRows): boolean =>
	WEIGHT_SYNC_FIELDS.has(field);

/** 소수점 3자리 고정 문자열로 변환 */
const toWeightString = (n: number): string =>
	(Math.round(n * 1000) / 1000).toFixed(3);

/**
 * 단일 필드 업데이트에 대해 무게 항등식을 유지하는 변경 집합을 반환한다.
 * - 반환값은 "변경해야 하는 필드만" 담은 Partial 객체
 * - 무게와 무관한 필드가 들어오면 `{ [field]: value }` 만 반환
 *
 * 사용 예:
 *   setStockRows(prev => prev.map(row =>
 *     row.id === id ? { ...row, ...syncStockWeightFields(row, field, value) } : row
 *   ));
 */
export const syncStockWeightFields = (
	row: StockOrderRows,
	field: keyof StockOrderRows,
	value: unknown
): Partial<StockOrderRows> => {
	// 기본 변경: 요청된 필드만 먼저 반영
	const updates: Partial<StockOrderRows> = {
		[field]: value,
	} as Partial<StockOrderRows>;

	if (!isWeightSyncField(field)) {
		return updates;
	}

	// 아래 계산은 "이번에 변경된 값이 이미 반영된 가상 row" 를 기준으로 한다.
	const nextTotalWeight =
		field === "totalWeight"
			? Number(value) || 0
			: Number(row.totalWeight || 0);

	const nextStoneWeightRaw =
		field === "stoneWeight" ? String(value ?? "") : row.stoneWeight ?? "";
	const nextStoneWeight = parseFloat(String(nextStoneWeightRaw)) || 0;

	if (field === "stoneWeight") {
		// 알중량이 변경된 경우
		// 1) 총중량이 알중량 이상이면 총중량 유지, 금중량만 재계산
		// 2) 총중량이 비어있거나 알중량보다 작으면 총중량을 알중량에 맞춰 채움
		// 3) 알중량이 0 이면 금중량 = 기존 총중량
		if (nextTotalWeight >= nextStoneWeight && nextTotalWeight > 0) {
			updates.goldWeight = toWeightString(
				Math.max(0, nextTotalWeight - nextStoneWeight)
			);
		} else if (nextStoneWeight > 0) {
			updates.totalWeight = nextStoneWeight;
			updates.goldWeight = "0.000";
		} else {
			updates.goldWeight = toWeightString(nextTotalWeight);
		}
		updates.stoneWeightTotal = nextStoneWeight;
	} else if (field === "totalWeight") {
		// 총중량이 변경된 경우: 금중량 = 총중량 - 알중량
		updates.goldWeight = toWeightString(
			Math.max(0, nextTotalWeight - nextStoneWeight)
		);
	} else {
		// 재질(materialId / materialName) 변경: 금중량을 다시 계산해서 최신 동기화.
		// 수식 자체는 총중량/알중량만 쓰지만, 재질이 바뀔 때마다 금중량 셀을 재확정하는
		// "재질 변경 시 금중량 값도 같이 변경" 요구사항을 UI 레벨에서 만족시킨다.
		if (nextTotalWeight > 0 || nextStoneWeight > 0) {
			updates.goldWeight = toWeightString(
				Math.max(0, nextTotalWeight - nextStoneWeight)
			);
		}
	}

	return updates;
};
