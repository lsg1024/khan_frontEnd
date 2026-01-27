import { apiRequest } from "./config";
import type {
	ScheduleRequest,
	ScheduleResponse,
	ScheduleListParams,
} from "../../src/types/scheduleDto";

// 일정 생성
export const createSchedule = async (data: ScheduleRequest) => {
	return apiRequest.post<number, ScheduleRequest>("/account/schedule", data);
};

// 일정 목록 조회 (기간별)
export const getSchedules = async (params: ScheduleListParams) => {
	const queryParams = new URLSearchParams();
	queryParams.append("start", params.start);
	queryParams.append("end", params.end);

	return apiRequest.get<ScheduleResponse[]>(
		`/account/schedules?${queryParams.toString()}`
	);
};

// 일정 상세 조회
export const getScheduleDetail = async (id: string | number) => {
	return apiRequest.get<ScheduleResponse>(`/account/schedule/${id}`);
};

// 일정 수정
export const updateSchedule = async (
	id: string | number,
	data: ScheduleRequest
) => {
	return apiRequest.patch<string, ScheduleRequest>(
		`/account/schedule/${id}`,
		data
	);
};

// 일정 삭제
export const deleteSchedule = async (id: string | number) => {
	return apiRequest.delete<string>(`/account/schedule/${id}`);
};
