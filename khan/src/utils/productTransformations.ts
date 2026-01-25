import type { ProductStoneDto, StoneInfo } from "../types/stoneDto";

/**
 * ProductStoneDto 배열을 StoneInfo 배열로 변환합니다.
 * 등급(grade)에 따른 가공비(laborCost)를 적용합니다.
 *
 * @param productStoneDtos - 상품의 스톤 정보 배열
 * @param grade - 적용할 등급 (예: "1", "2", "3")
 * @returns 변환된 StoneInfo 배열
 */
export function transformProductStones(
	productStoneDtos: ProductStoneDto[],
	grade: string
): StoneInfo[] {
	if (!productStoneDtos || productStoneDtos.length === 0) {
		return [];
	}

	return productStoneDtos.map((stone) => {
		// 등급에 맞는 정책 찾기
		const matchingPolicy = stone.stoneWorkGradePolicyDtos.find(
			(policy) => policy.grade === grade
		);

		// 매칭되는 정책이 없으면 첫 번째 정책의 가공비 사용
		const laborCost = matchingPolicy
			? matchingPolicy.laborCost
			: stone.stoneWorkGradePolicyDtos[0]?.laborCost || 0;

		return {
			stoneId: stone.stoneId,
			stoneName: stone.stoneName,
			stoneWeight: stone.stoneWeight,
			purchaseCost: stone.stonePurchase,
			laborCost: laborCost,
			quantity: stone.stoneQuantity,
			mainStone: stone.mainStone,
			includeStone: stone.includeStone,
			addLaborCost: 0,
		};
	});
}

/**
 * 등급에 해당하는 상품 단가를 가져옵니다.
 *
 * @param priceDtos - 상품 가격 정보 배열
 * @param grade - 조회할 등급
 * @returns 해당 등급의 가공비, 없으면 첫 번째 가격의 가공비 또는 0
 */
export function getProductLaborCostByGrade(
	priceDtos: Array<{ grade?: string; laborCost?: number }>,
	grade: string
): number {
	if (!priceDtos || priceDtos.length === 0) {
		return 0;
	}

	const matchingPrice = priceDtos.find((p) => p.grade === grade);
	return matchingPrice?.laborCost ?? priceDtos[0]?.laborCost ?? 0;
}

/**
 * 숫자를 안전하게 파싱합니다.
 * 빈 문자열이나 유효하지 않은 값은 0을 반환합니다.
 *
 * @param value - 변환할 값
 * @returns 파싱된 숫자 또는 0
 */
export function getSafeNumber(value: string | number | undefined | null): number {
	if (value === undefined || value === null || value === "") {
		return 0;
	}
	const num = typeof value === "string" ? parseFloat(value) : value;
	return isNaN(num) ? 0 : num;
}

/**
 * 가격을 포맷팅합니다. (천 단위 콤마)
 *
 * @param value - 포맷할 값
 * @returns 포맷된 문자열
 */
export function formatPrice(value: number | string | undefined): string {
	const num = getSafeNumber(value as string | number);
	return num.toLocaleString();
}

/**
 * 중량을 포맷팅합니다. (소수점 3자리)
 *
 * @param value - 포맷할 값
 * @returns 포맷된 문자열
 */
export function formatWeight(value: number | string | undefined): string {
	const num = getSafeNumber(value as string | number);
	return num.toFixed(3);
}
