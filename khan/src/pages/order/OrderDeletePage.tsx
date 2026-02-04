import { useState, useEffect, useCallback, useRef } from "react";
import Pagination from "../../components/common/Pagination";
import OrderSearch from "../../components/common/order/OrderSearch";
import type { SearchFilters } from "../../components/common/order/OrderSearch";
import { useErrorHandler } from "../../utils/errorHandler";
import { orderApi } from "../../../libs/api/orderApi";
import type { OrderDto } from "../../types/orderDto";
import MainList from "../../components/common/order/MainList";
import { getLocalDate } from "../../utils/dateUtils";
import { openProductDetailPopup } from "../../utils/popupUtils";
import "../../styles/pages/order/OrderPage.css";

export const OrderDeletedPage = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [deleteds, setDeleteds] = useState<OrderDto[]>([]); // 삭제된 주문 데이터 상태
	const [selectedDeleted, setSelectedDeleted] = useState<string[]>([]); // 삭제된 주문 선택
	const [factories, setFactories] = useState<string[]>([]);
	const [stores, setStores] = useState<string[]>([]);
	const [setTypes, setSetTypes] = useState<string[]>([]);
	const [colors, setColors] = useState<string[]>([]);
	const [dropdownLoading, setDropdownLoading] = useState(false);
	const { handleError } = useErrorHandler();

	// 체크박스 선택 관련 상태 (단일 선택만 허용)
	const orderCreationPopup = useRef<Window | null>(null);
	const orderUpdatePopups = useRef<Map<string, Window>>(new Map());

	// 검색 관련 상태
	const [searchFilters, setSearchFilters] = useState<SearchFilters>({
		search: "",
		start: getLocalDate(),
		end: getLocalDate(),
		factory: "",
		store: "",
		setType: "",
		color: "",
		sortField: "",
		sortOrder: "" as const,
	});

	// 검색 필터 변경 핸들러
	const handleFilterChange = <K extends keyof SearchFilters>(
		field: K,
		value: SearchFilters[K],
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));

		// start 선택 시 end 자동 보정 (문자열 날짜 비교)
		if (field === "start" && (value as string) > prevEnd()) {
			setSearchFilters((prev) => ({ ...prev, end: value as string }));
		}
	};

	const prevEnd = () => searchFilters.end;

	// 주문 데이터 로드 함수
	const loadDeleteds = useCallback(
		async (filters: typeof searchFilters, page: number = 1) => {
			setLoading(true);

			// 페이지 변경 시 선택 상태 초기화
			setSelectedDeleted([]);
			try {
				const response = await orderApi.getDeletedOrders(
					filters.start,
					filters.end,
					"DELETED",
					filters.search,
					filters.factory,
					filters.store,
					filters.setType,
					filters.color,
					filters.sortField,
					filters.sortOrder as "ASC" | "DESC" | "",
					page,
				);

				if (response.success && response.data) {
					const pageData = response.data.page;
					const content = response.data.content || [];

					setDeleteds(content || []);
					setCurrentPage(page);
					setTotalPages(pageData.totalPages || 1);
					setTotalElements(pageData.totalElements || 0);
				}
			} catch (err) {
				handleError(err);
				setDeleteds([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[], // eslint-disable-line react-hooks/exhaustive-deps
	);

	// 검색 실행
	const handleSearch = async () => {
		setCurrentPage(1);
		await Promise.all([loadDeleteds(searchFilters, 1), fetchDropdownData()]);
	};

	// 검색 초기화
	const handleReset = async () => {
		const resetFilters: SearchFilters = {
			search: "",
			start: getLocalDate(),
			end: getLocalDate(),
			factory: "",
			store: "",
			setType: "",
			color: "",
			sortField: "",
			sortOrder: "" as const,
		};
		setSearchFilters(resetFilters);
		setCurrentPage(1);
		await Promise.all([loadDeleteds(resetFilters, 1), fetchDropdownData()]);
	};

	// 체크박스 선택 기능 비활성화 (조회 전용)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleSelectDeleted = (_flowCode: string, _checked: boolean) => {
		// 삭제된 주문은 선택 기능 비활성화
		return;
	};

	// 상태 변경 기능 비활성화 (조회 전용)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleStatusChange = async (_flowCode: string, _newStatus: string) => {
		// 삭제된 주문은 상태 변경 금지
		return;
	};

	// 제조사 변경 기능 비활성화 (조회 전용)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleFactoryClick = (_flowCode: string) => {
		// 삭제된 주문은 제조사 변경 금지
		return;
	};

	const fetchDropdownData = async () => {
		setDropdownLoading(true);
		try {
			// 공장 데이터 가져오기 -> 서버에서 distinct 이용해 종합 페이지에서 가져오도록
			const factoryResponse = await orderApi.getFilterFactories(
				searchFilters.start,
				searchFilters.end,
				"DELETED",
			);
			setFactories(factoryResponse.data || []);

			// 판매처 데이터 가져오기
			const storeResponse = await orderApi.getFilterStores(
				searchFilters.start,
				searchFilters.end,
				"DELETED",
			);
			setStores(storeResponse.data || []);

			// 세트타입 데이터 가져오기
			const setTypeResponse = await orderApi.getFilterSetTypes(
				searchFilters.start,
				searchFilters.end,
				"DELETED",
			);
			setSetTypes(setTypeResponse.data || []);
			const colorResponse = await orderApi.getFilterColors(
				searchFilters.start,
				searchFilters.end,
				"DELETED",
			);
			setColors(colorResponse.data || []);
		} catch (err) {
			console.error("드롭다운 데이터 로드 실패:", err);
		} finally {
			setDropdownLoading(false);
		}
	};

	useEffect(() => {
		const initializeData = async () => {
			setCurrentPage(1);

			await Promise.all([loadDeleteds(searchFilters, 1), fetchDropdownData()]);
		};

		const creationPopupRef = orderCreationPopup;
		const updatePopupsRef = orderUpdatePopups;

		initializeData();

		return () => {
			// 주문 생성 팝업 정리
			if (creationPopupRef.current && !creationPopupRef.current.closed) {
				creationPopupRef.current = null;
			}

			// 주문 상세 팝업들 정리
			updatePopupsRef.current.forEach((popup) => {
				if (popup && !popup.closed) {
					// 팝업 참조만 제거 (실제 창은 닫지 않음)
				}
			});
			updatePopupsRef.current.clear();
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<div className="page">
				{/* 검색 영역 */}
				<OrderSearch
					searchFilters={searchFilters}
					onFilterChange={handleFilterChange}
					onSearch={handleSearch}
					onReset={handleReset}
					factories={factories}
					stores={stores}
					setTypes={setTypes}
					colors={colors}
					loading={loading}
					dropdownLoading={dropdownLoading}
					onStart={true}
				/>

				{/* 삭제 목록 */}
				<div className="list">
					<MainList
						dtos={deleteds}
						selected={selectedDeleted}
						currentPage={currentPage}
						loading={loading}
						onSelect={handleSelectDeleted}
						onStatusChange={handleStatusChange}
						onFactoryClick={handleFactoryClick}
						onImageClick={(productId) => openProductDetailPopup(productId)}
					/>{" "}
					{/* 페이지네이션 */}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={(page) => {
							setCurrentPage(page);
							loadDeleteds(searchFilters, page);
						}}
						className="order"
					/>
				</div>
				{/* 삭제된 주문은 제조사 변경 기능 비활성화 */}
			</div>
		</>
	);
};
export default OrderDeletedPage;
