/**
 * 순금 무게만 계산하는 함수
 * @param weight - 상품 무게 (문자열 또는 숫자)
 * @param material - 재질 (14K, 18K, 24K 등)
 * @returns 순금 무게 (숫자) 또는 0
 */
export const calculatePureGoldWeight = (
	weight: string | number,
	material: string
): number => {
	const weightNum = typeof weight === "string" ? parseFloat(weight) : weight;
	if (isNaN(weightNum)) return 0;

	let purityInteger = 0;
	if (material === "14K") {
		purityInteger = 585; // 14K = 58.5%
	} else if (material === "18K") {
		purityInteger = 750; // 18K = 75%
	} else if (material === "24K") {
		purityInteger = 1000; // 24K = 100%
	} else {
		return 0;
	}

	// 부동소수점 문제 해결을 위해 정수로 변환 후 계산
	const weightInteger = Math.round(weightNum * 1000);
	const pureGoldInteger = (weightInteger * purityInteger) / 1000; // 1000으로 나누어 중간 계산

	const result = pureGoldInteger / 1000; // 다시 1000으로 나누어 최종 결과 계산
	return parseFloat(result.toFixed(3)); // 소수점 최대 3자리로 제한
};

/**
 * 금 중량을 돈으로 계산하는 함수
 * @param weight - 금 중량 (문자열 또는 숫자)
 * @returns 금 중량에 해당하는 돈 (숫자) 또는 0
 */
export const getGoldDonFromWeight = (weight: string | number): number => {
	const weightNum = typeof weight === "string" ? parseFloat(weight) : weight;
	if (isNaN(weightNum)) return 0;

	const don = weightNum / 3.75;
	return parseFloat(don.toFixed(3));
};

/**
 * 전체 무게를 돈으로 계산
 * @param weight
 * @returns
 */
export const getGoldTransferWeight = (
	weight: string | number,
	material: string
): number => {
	const weightNum = typeof weight === "string" ? parseFloat(weight) : weight;
	if (isNaN(weightNum)) return 0;

	let purityRatio = 0;

	if (material === "14K") {
		purityRatio = 0.585; // 58.5%
	} else if (material === "18K") {
		purityRatio = 0.75; // 75.0%
	} else if (material === "24K") {
		purityRatio = 1.0; // 100% (순금)
	} else {
		return 0;
	}

	const pureGoldGram = weightNum * purityRatio;
	const pureGoldDon = pureGoldGram / 3.75;

	return parseFloat(pureGoldDon.toFixed(3));
};

/**
 * 순금 무게만 계산하는 함수
 * @param weight - 상품 무게 (문자열 또는 숫자)
 * @param material - 재질 (14K, 18K, 24K 등)
 * @returns 순금 무게 (숫자) 또는 0
 */
export const calculatePureGoldWeightNoRound = (
	weight: string | number,
	material: string
): number => {
	const weightNum = typeof weight === "string" ? parseFloat(weight) : weight;
	if (isNaN(weightNum)) return 0;

	let purityInteger = 0;
	if (material === "14K") {
		purityInteger = 585; // 14K = 58.5%
	} else if (material === "18K") {
		purityInteger = 750; // 18K = 75%
	} else if (material === "24K") {
		purityInteger = 1000; // 24K = 100%
	} else {
		return 0;
	}

	// 부동소수점 문제 해결을 위해 정수로 변환 후 계산
	const weightInteger = Math.round(weightNum * 1000);
	const pureGoldInteger = (weightInteger * purityInteger) / 1000; // 1000으로 나누어 중간 계산

	return pureGoldInteger / 1000; // 다시 1000으로 나누어 최종 결과 계산
};

/**
 * 해리 값을 포함한 순금 중량 계산 함수
 * @param goldWeight - 금중량 (문자열 또는 숫자)
 * @param material - 재질 (14K, 18K, 24K 등)
 * @param harry - 해리 값 (문자열 또는 숫자, 기본값 1.0)
 * @returns 해리가 적용된 순금 중량 (숫자) 또는 0
 */
export const calculatePureGoldWeightWithHarry = (
	goldWeight: string | number,
	material: string,
	harry: string | number = 1.1
): number => {
	const goldWeightNum =
		typeof goldWeight === "string" ? parseFloat(goldWeight) : goldWeight;
	if (isNaN(goldWeightNum) || goldWeightNum <= 0) return 0;

	// 순금 중량 계산
	const pureGold = calculatePureGoldWeightNoRound(goldWeightNum, material);
	if (pureGold === 0) return 0;

	// 24K는 순금이므로 해리를 적용하지 않음
	if (material === "24K") {
		return parseFloat(pureGold.toFixed(5));
	}

	// 해리 값 처리 (14K, 18K 등)
	const harryNum = typeof harry === "string" ? parseFloat(harry) : harry;
	const validHarry = isNaN(harryNum) || harryNum <= 0 ? 1.0 : harryNum;

	// 해리 적용
	const result = pureGold * validHarry;

	console.log(goldWeightNum, validHarry, result);

	return parseFloat(result.toFixed(5)); // 소수점 최대 5자리로 제한
};
