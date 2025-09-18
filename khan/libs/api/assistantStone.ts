import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { AssistantStoneDto } from "../../src/types/AssistantStoneDto";

export const assistantStoneApi = {
    // 보조석 목록 조회
    getAssistantStones: async (name?: string): Promise<ApiResponse<AssistantStoneDto[]>> => {
        const params = name ? { name } : {};
        return apiRequest.get<AssistantStoneDto[]>("product/assistant_stones", { params });
    },  
}