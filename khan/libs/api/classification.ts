import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { ClassificationDto, ClassificationRequest } from "../../src/types/classification";

type ClassificationResponseSingle = ClassificationDto;
type ClassificationResponseList = ClassificationDto[];

export const classificationApi = {
    getClassifications: async (name?: string): Promise<ApiResponse<ClassificationResponseList>> => {
        const params = name ? { name } : {};
        return apiRequest.get<ClassificationResponseList>('product/classifications', { params });
    },

    getClassification: async (id: string): Promise<ApiResponse<ClassificationResponseSingle>> => {
        return apiRequest.get<ClassificationResponseSingle>(`product/classifications/${id}`);
    },

    createClassification: async (data: Partial<ClassificationRequest>): Promise<ApiResponse<string>> => {
        return apiRequest.post<string>("product/classifications", data);
    },

    updateClassification: async (id: string, data: Partial<ClassificationRequest>): Promise<ApiResponse<string>> => {
        return apiRequest.patch<string>(`product/classifications/${id}`, data);
    },

    deleteClassification: async (id: string): Promise<ApiResponse<string>> => {
        return apiRequest.delete<string>(`product/classifications/${id}`);
    },
    
    getClassificationName: async (id: string): Promise<ApiResponse<string>> => {
        return apiRequest.get<string>(`api/classification/${id}`);
    }
};
