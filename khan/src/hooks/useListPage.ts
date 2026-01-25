import { useState, useCallback } from "react";
import type { PageInfo } from "../types/pageDto";

/**
 * 목록 페이지를 위한 공통 상태 관리 훅
 * 페이지네이션, 로딩, 선택 상태 등을 통합 관리합니다.
 */

export interface UseListPageOptions<T, F> {
	/** 초기 필터 값 */
	initialFilters: F;
	/** 데이터 로드 함수 */
	loadFn: (filters: F, page: number) => Promise<{
		content: T[];
		page: PageInfo;
	} | null>;
	/** 페이지 크기 (기본값: 20) */
	pageSize?: number;
}

export interface UseListPageResult<T, F> {
	// 상태
	items: T[];
	loading: boolean;
	currentPage: number;
	totalPages: number;
	totalElements: number;
	selectedItems: string[];
	filters: F;

	// 액션
	loadData: (filters: F, page?: number) => Promise<void>;
	setFilters: React.Dispatch<React.SetStateAction<F>>;
	handleFilterChange: <K extends keyof F>(field: K, value: F[K]) => void;
	handleSearch: () => Promise<void>;
	handleReset: (resetFilters: F) => Promise<void>;
	handlePageChange: (page: number) => Promise<void>;
	handleSelect: (id: string, checked: boolean) => void;
	handleSelectAll: (checked: boolean) => void;
	clearSelection: () => void;
	setLoading: (loading: boolean) => void;
}

export function useListPage<T extends { flowCode?: string }, F>({
	initialFilters,
	loadFn,
	pageSize = 20,
}: UseListPageOptions<T, F>): UseListPageResult<T, F> {
	const [items, setItems] = useState<T[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const [filters, setFilters] = useState<F>(initialFilters);

	/**
	 * 데이터 로드
	 */
	const loadData = useCallback(
		async (filtersToUse: F, page: number = 1) => {
			setLoading(true);
			setSelectedItems([]); // 데이터 로드 시 선택 초기화

			try {
				const result = await loadFn(filtersToUse, page);

				if (result) {
					setItems(result.content);
					setCurrentPage(page);
					setTotalPages(result.page.totalPages || 1);
					setTotalElements(result.page.totalElements || 0);
				} else {
					setItems([]);
					setCurrentPage(1);
					setTotalPages(0);
					setTotalElements(0);
				}
			} catch {
				setItems([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[loadFn]
	);

	/**
	 * 필터 변경 핸들러
	 */
	const handleFilterChange = useCallback(<K extends keyof F>(field: K, value: F[K]) => {
		setFilters((prev) => {
			const newFilters = { ...prev, [field]: value };

			// 시작일이 종료일보다 큰 경우 자동 보정
			if (
				field === "start" &&
				"end" in newFilters &&
				typeof value === "string" &&
				typeof (newFilters as Record<string, unknown>).end === "string"
			) {
				const endValue = (newFilters as Record<string, unknown>).end as string;
				if (value > endValue) {
					(newFilters as Record<string, unknown>).end = value;
				}
			}

			return newFilters;
		});
	}, []);

	/**
	 * 검색 실행
	 */
	const handleSearch = useCallback(async () => {
		setCurrentPage(1);
		await loadData(filters, 1);
	}, [filters, loadData]);

	/**
	 * 검색 초기화
	 */
	const handleReset = useCallback(
		async (resetFilters: F) => {
			setFilters(resetFilters);
			setCurrentPage(1);
			await loadData(resetFilters, 1);
		},
		[loadData]
	);

	/**
	 * 페이지 변경
	 */
	const handlePageChange = useCallback(
		async (page: number) => {
			await loadData(filters, page);
		},
		[filters, loadData]
	);

	/**
	 * 개별 선택/해제
	 */
	const handleSelect = useCallback((id: string, checked: boolean) => {
		setSelectedItems((prev) =>
			checked ? [...prev, id] : prev.filter((item) => item !== id)
		);
	}, []);

	/**
	 * 전체 선택/해제
	 */
	const handleSelectAll = useCallback(
		(checked: boolean) => {
			if (checked) {
				const allIds = items
					.map((item) => item.flowCode)
					.filter((id): id is string => !!id);
				setSelectedItems(allIds);
			} else {
				setSelectedItems([]);
			}
		},
		[items]
	);

	/**
	 * 선택 초기화
	 */
	const clearSelection = useCallback(() => {
		setSelectedItems([]);
	}, []);

	return {
		// 상태
		items,
		loading,
		currentPage,
		totalPages,
		totalElements,
		selectedItems,
		filters,

		// 액션
		loadData,
		setFilters,
		handleFilterChange,
		handleSearch,
		handleReset,
		handlePageChange,
		handleSelect,
		handleSelectAll,
		clearSelection,
		setLoading,
	};
}

export default useListPage;
