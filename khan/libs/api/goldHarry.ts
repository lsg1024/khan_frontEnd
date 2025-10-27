import { apiRequest } from "./config";
import type { ApiResponse } from "./config";
import type { goldHarryResponse } from "../../src/types/goldHarry";


export const goldHarryApi = {

    getGoldHarry: async (): Promise<ApiResponse<goldHarryResponse[]>> => {
        return apiRequest.get<goldHarryResponse[]>("account/gold-harries");
    }
}