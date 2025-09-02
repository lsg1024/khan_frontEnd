/**
 * 금 함량을 계산하는 함수
 * @param weight - 상품 무게 (문자열)
 * @param material - 재질 (14K, 18K 등)
 * @returns 계산된 순금 함량 문자열 또는 빈 문자열
 */
export const calculateGoldContent = (weight: string, material: string): string => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum)) return "";
    
    let purityInteger = 0;
    if (material === "14K") {
        purityInteger = 585; // 14K = 58.5%
    } else if (material === "18K") {
        purityInteger = 750; // 18K = 75%
    } else {
        return ""; // 14K, 18K가 아니면 계산하지 않음
    }
    
    // 부동소수점 문제 해결을 위해 정수로 변환 후 계산
    const weightInteger = Math.round(weightNum * 1000);
    const goldContentInteger = (weightInteger * purityInteger) / 1000; 
    const goldContent = goldContentInteger / 1000; 
    
    return `(순금: ${goldContent.toFixed(2)}g)`;
};

/**
 * 금의 순도 비율을 반환하는 함수
 * @param material - 재질 (14K, 18K 등)
 * @returns 순도 비율 (0~1) 또는 0
 */
export const getGoldPurity = (material: string): number => {
    if (material === "14K") {
        const result = 585 / 1000; // 58.5%
        return parseFloat(result.toFixed(3)); // 소수점 최대 3자리로 제한
    } else if (material === "18K") {
        const result = 750 / 1000; // 75%
        return parseFloat(result.toFixed(3)); // 소수점 최대 3자리로 제한
    }
    return 0;
};

/**
 * 순금 무게만 계산하는 함수
 * @param weight - 상품 무게 (문자열 또는 숫자)
 * @param material - 재질 (14K, 18K 등)
 * @returns 순금 무게 (숫자) 또는 0
 */
export const calculatePureGoldWeight = (weight: string | number, material: string): number => {
    const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;
    if (isNaN(weightNum)) return 0;
    
    let purityInteger = 0;
    if (material === "14K") {
        purityInteger = 585; // 14K = 58.5%
    } else if (material === "18K") {
        purityInteger = 750; // 18K = 75%
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
 * 전체 무게를 돈으로 계산
 * @param weight 
 * @returns 
 */
export const getGoldTransferWeight = (weight: string | number): number => {
    const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;
    if (isNaN(weightNum)) return 0;

    const weightInteger = Math.round(weightNum * 1000);
    const divisorInteger = 3.75 * 1000; // 3750

    const result = (weightInteger / divisorInteger);
    return parseFloat(result.toFixed(3)); // 소수점 최대 3자리로 제한
}