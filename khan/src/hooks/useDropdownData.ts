import { useState, useCallback, useRef } from "react";
import type { ApiResponse } from "../../libs/api/config";

/**
 * 드롭다운 데이터 로딩을 위한 커스텀 훅
 * API 병렬 호출 및 캐싱을 통해 성능을 최적화합니다.
 */

export interface DropdownConfig<T> {
	/** API 호출 함수 */
	fetchFn: () => Promise<ApiResponse<T[]>>;
	/** 상태 업데이트 함수 */
	setter: React.Dispatch<React.SetStateAction<T[]>>;
	/** 캐시 키 (선택) */
	cacheKey?: string;
}

export interface UseDropdownDataOptions {
	/** 캐시 유효 시간 (ms, 기본값: 5분) */
	cacheTtl?: number;
}

export interface UseDropdownDataResult {
	/** 드롭다운 데이터 로드 중 상태 */
	loading: boolean;
	/** 드롭다운 데이터 병렬 로드 */
	loadDropdowns: <T>(configs: DropdownConfig<T>[]) => Promise<void>;
	/** 캐시 초기화 */
	clearCache: () => void;
}

interface CacheEntry {
	data: unknown[];
	timestamp: number;
}

const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5분

export function useDropdownData(
	options?: UseDropdownDataOptions
): UseDropdownDataResult {
	const { cacheTtl = DEFAULT_CACHE_TTL } = options || {};

	const [loading, setLoading] = useState(false);
	const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

	/**
	 * 캐시에서 데이터 조회
	 */
	const getFromCache = useCallback(
		(key: string): unknown[] | null => {
			const entry = cacheRef.current.get(key);
			if (!entry) return null;

			// 캐시 만료 확인
			if (Date.now() - entry.timestamp > cacheTtl) {
				cacheRef.current.delete(key);
				return null;
			}

			return entry.data;
		},
		[cacheTtl]
	);

	/**
	 * 캐시에 데이터 저장
	 */
	const setToCache = useCallback((key: string, data: unknown[]) => {
		cacheRef.current.set(key, {
			data,
			timestamp: Date.now(),
		});
	}, []);

	/**
	 * 드롭다운 데이터 병렬 로드
	 */
	const loadDropdowns = useCallback(
		async <T>(configs: DropdownConfig<T>[]): Promise<void> => {
			setLoading(true);

			try {
				// 캐시 확인 및 API 호출 필요 여부 판단
				const needsFetch: {
					config: DropdownConfig<T>;
					index: number;
				}[] = [];

				configs.forEach((config, index) => {
					const cacheKey = config.cacheKey || `dropdown_${index}`;
					const cached = getFromCache(cacheKey);

					if (cached) {
						// 캐시된 데이터 사용
						config.setter(cached as T[]);
					} else {
						needsFetch.push({ config, index });
					}
				});

				// 캐시에 없는 데이터만 API 호출 (병렬)
				if (needsFetch.length > 0) {
					const promises = needsFetch.map(({ config }) =>
						config.fetchFn()
					);

					const results = await Promise.all(promises);

					// 결과 처리
					results.forEach((result, idx) => {
						const { config, index } = needsFetch[idx];
						const cacheKey = config.cacheKey || `dropdown_${index}`;

						if (result.success && result.data) {
							config.setter(result.data);
							setToCache(cacheKey, result.data);
						}
					});
				}
			} finally {
				setLoading(false);
			}
		},
		[getFromCache, setToCache]
	);

	/**
	 * 캐시 초기화
	 */
	const clearCache = useCallback(() => {
		cacheRef.current.clear();
	}, []);

	return {
		loading,
		loadDropdowns,
		clearCache,
	};
}

export default useDropdownData;
