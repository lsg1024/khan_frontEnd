export interface SensConfigRequest {
	accessKey: string;
	secretKey: string;
	serviceId: string;
	senderPhone: string;
}

export interface SensConfigResponse {
	id: number;
	accessKey: string;
	serviceId: string;
	senderPhone: string;
	enabled: boolean;
}

export interface SendMessageRequest {
	storeIds: number[];
	content: string;
}

export interface SendResult {
	storeName: string;
	phone: string;
	status: string;
	errorMessage?: string;
}

export interface MessageHistoryItem {
	id: number;
	receiverPhone: string;
	receiverName: string;
	content: string;
	status: string;
	errorMessage?: string;
	sentBy: string;
	createdAt: string;
}

export interface MessageHistoryPageResponse {
	content: MessageHistoryItem[];
	totalPages: number;
	totalElements: number;
	number: number;
	size: number;
}
