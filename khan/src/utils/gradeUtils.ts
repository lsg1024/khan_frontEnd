/**
 * 등급 관련 유틸리티 함수들
 */

/**
 * GRADE_x 형태의 등급을 한국어 등급으로 변환
 * @param grade - 변환할 등급 문자열 (예: "GRADE_1", "GRADE_2")
 * @returns 한국어 등급 문자열 (예: "1등급", "2등급")
 */
export const convertGradeToKorean = (grade: string): string => {
	const match = grade.match(/GRADE_(\d+)/);
	if (match) {
		return `${match[1]}등급`;
	}
	return grade; // 매칭되지 않으면 원본 반환
};

/**
 * 한국어 등급을 GRADE_x 형태로 변환
 * @param koreanGrade - 변환할 한국어 등급 (예: "1등급", "2등급")
 * @returns GRADE_x 형태의 등급 문자열 (예: "GRADE_1", "GRADE_2")
 */
export const convertKoreanToGrade = (koreanGrade: string): string => {
	const match = koreanGrade.match(/(\d+)등급/);
	if (match) {
		return `GRADE_${match[1]}`;
	}
	return koreanGrade; // 매칭되지 않으면 원본 반환
};
