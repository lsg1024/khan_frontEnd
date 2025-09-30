import type { StoneInfo } from "../types/stone";

export const calculateStoneDetails = (stoneInfos: StoneInfo[]) => {
    const details = {
        mainStonePrice: 0,
        assistanceStonePrice: 0,
        additionalStonePrice: 0,
        mainStoneCount: 0,
        assistanceStoneCount: 0,
        stoneWeightTotal: 0,
    };
    if (!stoneInfos) return details;
    stoneInfos.forEach((stone) => {
        const quantity = stone.quantity || 0,
            weight = stone.stoneWeight || 0,
            laborCost = stone.laborCost || 0;
        if (stone.includeStone) {
            details.stoneWeightTotal += Number(weight) * Number(quantity);
            if (stone.mainStone) {
                details.mainStoneCount += quantity;
                details.mainStonePrice += laborCost * quantity;
            } else {
                details.assistanceStoneCount += quantity;
                details.assistanceStonePrice += laborCost * quantity;
            }
        }
    });
    return details;
};