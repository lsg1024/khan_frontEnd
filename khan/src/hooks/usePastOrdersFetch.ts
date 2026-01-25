import { useState, useCallback } from "react";
import { orderApi } from "../../libs/api/orderApi";
import type { PastOrderDto } from "../types/orderDto";

interface UsePastOrdersFetchResult {
	pastOrdersCache: Map<string, PastOrderDto[]>;
	currentDisplayedPastOrders: PastOrderDto[];
	fetchPastOrders: (
		storeId: string,
		productId: string,
		materialName: string
	) => Promise<void>;
	clearCache: () => void;
	setCurrentDisplayedPastOrders: React.Dispatch<
		React.SetStateAction<PastOrderDto[]>
	>;
}

export function usePastOrdersFetch(
	onError?: (error: unknown) => void
): UsePastOrdersFetchResult {
	const [pastOrdersCache, setPastOrdersCache] = useState<
		Map<string, PastOrderDto[]>
	>(new Map());
	const [currentDisplayedPastOrders, setCurrentDisplayedPastOrders] = useState<
		PastOrderDto[]
	>([]);

	const fetchPastOrders = useCallback(
		async (storeId: string, productId: string, materialName: string) => {
			const cacheKey = `${storeId}-${productId}-${materialName}`;

			// 캐시에 있으면 캐시된 데이터 사용
			if (pastOrdersCache.has(cacheKey)) {
				setCurrentDisplayedPastOrders(pastOrdersCache.get(cacheKey) || []);
				return;
			}

			try {
				const response = await orderApi.getPastOrders(
					parseInt(storeId),
					parseInt(productId),
					materialName
				);

				if (response.success && response.data) {
					setPastOrdersCache((prev) =>
						new Map(prev).set(cacheKey, response.data!)
					);
					setCurrentDisplayedPastOrders(response.data);
				}
			} catch (err) {
				onError?.(err);
			}
		},
		[pastOrdersCache, onError]
	);

	const clearCache = useCallback(() => {
		setPastOrdersCache(new Map());
		setCurrentDisplayedPastOrders([]);
	}, []);

	return {
		pastOrdersCache,
		currentDisplayedPastOrders,
		fetchPastOrders,
		clearCache,
		setCurrentDisplayedPastOrders,
	};
}
