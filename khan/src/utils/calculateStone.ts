import type { StoneInfo } from "../types/stone";

export const calculateStoneDetails = (stoneInfos: StoneInfo[]) => {
	const details = {
		purchaseStonePrice: 0,
		mainStonePrice: 0,
		assistanceStonePrice: 0,
		stoneAddLaborCost: 0,
		mainStoneCount: 0,
		assistanceStoneCount: 0,
		stoneWeight: 0,
	};
	if (!stoneInfos) return details;
	stoneInfos.forEach((stone) => {
		const quantity = stone.quantity || 0,
			weight = stone.stoneWeight || 0,
			purchaseCost = stone.purchaseCost || 0,
			laborCost = stone.laborCost || 0,
			addLaborCost = stone.addLaborCost || 0;
		if (stone.includeStone) {
			details.stoneWeight += Number(weight) * Number(quantity);

			// 스톤 총 매입가 = (매입비용 + 가공비 + 추가가공비) × 수량
			details.purchaseStonePrice +=
				(purchaseCost + laborCost + addLaborCost) * quantity;

			// 개별 항목도 유지 (레거시 호환성)
			details.stoneAddLaborCost += addLaborCost * quantity;
			if (stone.mainStone) {
				details.mainStoneCount += quantity;
				details.mainStonePrice += laborCost * quantity;
			} else {
				details.assistanceStoneCount += quantity;
				details.assistanceStonePrice += laborCost * quantity;
			}
		}
	});
	details.purchaseStonePrice =
		Math.round(details.purchaseStonePrice * 1000) / 1000;
	details.mainStonePrice = Math.round(details.mainStonePrice * 1000) / 1000;
	details.assistanceStonePrice =
		Math.round(details.assistanceStonePrice * 1000) / 1000;
	details.stoneAddLaborCost =
		Math.round(details.stoneAddLaborCost * 1000) / 1000;
	details.stoneWeight = Math.round(details.stoneWeight * 1000) / 1000;

	return details;
};
