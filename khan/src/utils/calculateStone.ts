import type { StoneInfo } from "../types/stone";

export const calculateStoneDetails = (stoneInfos: StoneInfo[]) => {
	const details = {
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
			laborCost = stone.laborCost || 0;
		if (stone.includeStone) {
			details.stoneWeight += Number(weight) * Number(quantity);
			if (stone.mainStone) {
				details.mainStoneCount += quantity;
				details.mainStonePrice += laborCost * quantity;
			} else {
				details.assistanceStoneCount += quantity;
				details.assistanceStonePrice += laborCost * quantity;
			}
		}
	});
	details.mainStonePrice = Math.round(details.mainStonePrice * 1000) / 1000;
	details.assistanceStonePrice =
		Math.round(details.assistanceStonePrice * 1000) / 1000;
	details.stoneWeight = Math.round(details.stoneWeight * 1000) / 1000;

	return details;
};
