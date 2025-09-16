import { apiRequest } from "./config";
import type { ApiResponse } from "./config";

interface Priority {
    priorityName: string;
    priorityDate: number;
}

export const priorityApi = {
    // 우선순위 목록 조회
    getPriorities: async (): Promise<ApiResponse<Priority[]>> => {
        return apiRequest.get<Priority[]>('order/priorities');
    },
}