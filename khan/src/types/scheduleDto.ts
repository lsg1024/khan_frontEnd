// 반복 타입
export type RepeatType = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

// 일정 생성/수정 요청
export interface ScheduleRequest {
	title: string;
	content?: string;
	startAt: string;
	endAt: string;
	allDay?: boolean;
	repeatType?: RepeatType;
	color?: string;
}

// 일정 응답
export interface ScheduleResponse {
	scheduleId: string;
	title: string;
	content: string;
	startAt: string;
	endAt: string;
	allDay: boolean;
	repeatType: RepeatType;
	repeatTypeDescription: string;
	color: string;
	createdBy: string;
	createdAt: string;
}

// 일정 목록 조회 파라미터
export interface ScheduleListParams {
	start: string;
	end: string;
}
