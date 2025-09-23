/**
 * 주어진 날짜에서 영업일(주말 제외)을 더해서 새로운 날짜를 반환합니다.
 * @param startDate 시작 날짜 (Date 객체 또는 날짜 문자열)
 * @param businessDays 추가할 영업일 수
 * @returns 계산된 날짜 (Date 객체)
 */
export const addBusinessDays = (
	startDate: Date | string,
	businessDays: number
): Date => {
	const date = new Date(startDate);
	let daysAdded = 0;

	while (daysAdded < businessDays) {
		date.setDate(date.getDate() + 1);

		// 토요일(6)과 일요일(0)을 제외
		const dayOfWeek = date.getDay();
		if (dayOfWeek !== 0 && dayOfWeek !== 6) {
			daysAdded++;
		}
	}

	return date;
};

export const formatDateToString = (date: Date): string => {
	const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

export const getLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1, 두 자리로 포맷
    const day = String(today.getDate()).padStart(2, '0');      // 두 자리로 포맷

    return `${year}-${month}-${day}`;
};

export const formatToLocalDate = (dateString: string): string => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};
