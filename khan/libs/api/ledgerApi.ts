import { apiRequest } from "./config";
import type { ApiResponse } from "./config";

export interface LedgerEntry {
	ledgerId: number;
	ledgerDate: string;
	assetType: "GOLD" | "MONEY";
	transactionType: "INCOME" | "EXPENSE";
	goldAmount: number | null;
	moneyAmount: number | null;
	description: string | null;
}

// BE 의 CustomPage 는 Spring PageImpl 을 flat 으로 직렬화한다.
// number/size/totalElements/totalPages 모두 top-level 필드.
export interface LedgerListResponse {
	content: LedgerEntry[];
	number: number;
	size: number;
	totalElements: number;
	totalPages: number;
}

export interface LedgerBalance {
	totalGold: number;
	totalMoney: number;
}

export interface LedgerCreateRequest {
	ledgerDate: string;
	assetType: "GOLD" | "MONEY";
	transactionType: "INCOME" | "EXPENSE";
	goldAmount?: number | null;
	moneyAmount?: number | null;
	description?: string;
}

export interface LedgerUpdateRequest {
	ledgerDate: string;
	transactionType: "INCOME" | "EXPENSE";
	goldAmount?: number | null;
	moneyAmount?: number | null;
	description?: string;
}

export const ledgerApi = {
	getLedgerList: async (
		startDate: string,
		endDate: string,
		page: number,
		size: number,
		assetType?: "GOLD" | "MONEY"
	): Promise<ApiResponse<LedgerListResponse>> => {
		const params: Record<string, string | number> = {
			startDate,
			endDate,
			page: page - 1,
			size,
		};
		if (assetType) params.assetType = assetType;

		return apiRequest.get<LedgerListResponse>("account/ledger/list", { params });
	},

	getLedger: async (id: number): Promise<ApiResponse<LedgerEntry>> => {
		return apiRequest.get<LedgerEntry>(`account/ledger/${id}`);
	},

	getBalance: async (): Promise<ApiResponse<LedgerBalance>> => {
		return apiRequest.get<LedgerBalance>("account/ledger/balance");
	},

	createLedger: async (data: LedgerCreateRequest): Promise<ApiResponse<string>> => {
		return apiRequest.post<string>("account/ledger", data);
	},

	updateLedger: async (id: number, data: LedgerUpdateRequest): Promise<ApiResponse<string>> => {
		return apiRequest.patch<string>(`account/ledger/${id}`, data);
	},

	deleteLedger: async (id: number): Promise<ApiResponse<string>> => {
		return apiRequest.delete<string>(`account/ledger/${id}`);
	},
};
