import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { AssistantStoneDto } from "../../src/types/AssistantStoneDto";

type AssistantStoneResponse = AssistantStoneDto;
type AssistantStoneListResponse = AssistantStoneDto[];


export const assistantStoneApi = {
    getAssistantStones: async (): Promise<ApiResponse<AssistantStoneListResponse>> => {
        return apiRequest.get<AssistantStoneListResponse>("product/assistant_stones");
    },
    
    getAssistantStoneInfo: async (id: string): Promise<ApiResponse<AssistantStoneResponse>> => {
        return apiRequest.get<AssistantStoneResponse>(`api/assistant_stone/${id}`);
    },

    createAssistantStone: async (data: {assistantStoneName: string, assistantStoneNote?: string}): Promise<ApiResponse<string>> => {
        return apiRequest.post<string>("product/assistant_stones", data);
    },

    updateAssistantStone: async (id: string, data: {assistantStoneName: string, assistantStoneNote?: string}): Promise<ApiResponse<string>> => {
        return apiRequest.patch<string>(`product/assistant_stones/${id}`, data);
    },

    deleteAssistantStone: async (id: string): Promise<ApiResponse<string>> => {
        return apiRequest.delete<string>(`product/assistant_stones/${id}`);
    },
};