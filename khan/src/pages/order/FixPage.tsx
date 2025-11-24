import { useState, useEffect, useCallback, useRef } from "react";
import Pagination from "../../components/common/Pagination";
import BulkActionBar from "../../components/common/order/BulkActionBar";
import OrderSearch from "../../components/common/order/OrderSearch";
import { useErrorHandler } from "../../utils/errorHandler";
import { fixApi } from "../../../libs/api/fix";
import { orderApi } from "../../../libs/api/order";
import FactorySearch from "../../components/common/factory/FactorySearch";
import type { SearchFilters } from "../../components/common/order/OrderSearch";
import type { FactorySearchDto } from "../../types/factory";
import type { OrderDto } from "../../types/order";
import MainList from "../../components/common/order/MainList";
import { getLocalDate } from "../../utils/dateUtils";
import "../../styles/pages/OrderPage.css";

export const FixPage = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [fixes, setFixes] = useState<OrderDto[]>([]); // 수리 데이터 상태
	const [selectedFix, setSelectedFix] = useState<string[]>([]); // 수리 선택으로 변경
	const [factories, setFactories] = useState<string[]>([]);
	const [stores, setStores] = useState<string[]>([]);
	const [setTypes, setSetTypes] = useState<string[]>([]);
	const [colors, setColors] = useState<string[]>([]);
	const [dropdownLoading, setDropdownLoading] = useState(false);
	const { handleError } = useErrorHandler();

	// 제조사 변경 관련 상태
	const [isFactorySearchOpen, setIsFactorySearchOpen] = useState(false);
	const [selectedFixForFactory, setSelectedFixForFactory] =
		useState<string>("");

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
		sortOrder: "",
	});

	// 검색 필터 변경 핸들러
	const handleFilterChange = <K extends keyof SearchFilters>(
		field: K,
		value: SearchFilters[K]
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));

		// start 선택 시 end 자동 보정 (문자열 날짜 비교)
		if (field === "start" && (value as string) > prevEnd()) {
			setSearchFilters((prev) => ({ ...prev, end: value as string }));
		}
	};

	const prevEnd = () => searchFilters.end;

	// 주문 데이터 로드 함수
	const loadFixes = useCallback(
		async (filters: SearchFilters, page: number = 1) => {
			setLoading(true);
			setError("");

			// 페이지 변경 시 선택 상태 초기화
			setSelectedFix([]);
			try {
				const response = await fixApi.getFixes(
					filters.start,
					filters.end,
					"FIX",
					filters.search,
					filters.factory,
					filters.store,
					filters.setType,
					filters.color,
					filters.sortField,
					filters.sortOrder as "ASC" | "DESC" | "",
					page
				);

				if (response.success && response.data) {
					const pageData = response.data.page;
					const content = response.data.content || [];

					setFixes(content || []);
					setCurrentPage(page);
					setTotalPages(pageData.totalPages || 1);
					setTotalElements(pageData.totalElements || 0);
				}
			} catch (err) {
				handleError(err);
				setFixes([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[] // eslint-disable-line react-hooks/exhaustive-deps
	);

	// 검색 실행
	const handleSearch = () => {
		setCurrentPage(1);
		loadFixes(searchFilters, 1);
	};

	// 검색 초기화
	const handleReset = () => {
		const resetFilters: SearchFilters = {
			search: "",
			start: getLocalDate(),
			end: getLocalDate(),
			factory: "",
			store: "",
			setType: "",
			color: "",
			sortField: "",
			sortOrder: "",
		};
		setSearchFilters(resetFilters);
		setCurrentPage(1);
		loadFixes(resetFilters, 1);
	};

	const handleFixCreate = () => {
		// 수리 생성 팝업 - order_type=FIX 파라미터로 수리 주문 생성
		const url = "/orders/create/fix";
		const NAME = "fixCreatePopup";
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=800";

		if (orderCreationPopup.current && !orderCreationPopup.current.closed) {
			orderCreationPopup.current.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				orderCreationPopup.current = newPopup;

				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						clearInterval(checkClosed);
						orderCreationPopup.current = null;
					}
				}, 1000);
			}
		}
	};

	const handleSelectFix = (flowCode: string, checked: boolean) => {
		if (checked) {
			// 선택 추가
			setSelectedFix((prev) => [...prev, flowCode]);
		} else {
			// 선택 해제
			setSelectedFix((prev) => prev.filter((id) => id !== flowCode));
		}
	};

	const stockRegisterPopups = useRef<Map<string, Window>>(new Map());

	// 대량 작업 핸들러
	const handleStockRegister = () => {
		if (selectedFix.length === 0) {
			alert("등록할 값을 먼저 선택해주세요.");
			return;
		}

		const ids = selectedFix.join(",");
		const stock = "STOCK";

		const url = `/orders/register-stock?ids=${ids}&type=${stock}`;
		const NAME = `stockRegisterBulk`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=400";

		const existingPopup = stockRegisterPopups.current.get(NAME);

		if (existingPopup && !existingPopup.closed) {
			existingPopup.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				stockRegisterPopups.current.set(NAME, newPopup);

				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						stockRegisterPopups.current.delete(NAME);
						clearInterval(checkClosed);
						// 팝업 닫힘 시 자동 새로고침 제거 - 메시지 이벤트에서만 처리
					}
				}, 1000);
			}
		}
	};

	const handleSalesRegister = () => {
		if (selectedFix.length === 0) {
			alert("등록할 값을 먼저 선택해주세요.");
			return;
		}

		const ids = selectedFix.join(",");
		const sale = "SALES";

		const url = `/orders/register-stock?ids=${ids}&type=${sale}`;
		const NAME = `stockRegisterBulk`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=400";

		const existingPopup = stockRegisterPopups.current.get(NAME);

		if (existingPopup && !existingPopup.closed) {
			existingPopup.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				stockRegisterPopups.current.set(NAME, newPopup);

				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						stockRegisterPopups.current.delete(NAME);
						clearInterval(checkClosed);
						// 팝업 닫힘 시 자동 새로고침 제거 - 메시지 이벤트에서만 처리
					}
				}, 1000);
			}
		}
	};

	const handleBulkDelete = async () => {
		if (selectedFix.length === 0) {
			alert("삭제할 값을 먼저 선택해주세요.");
			return;
		}

		const confirmMessage = `선택된 ${selectedFix.length}개 값을 삭제하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);

				// 선택된 모든 수리 삭제 요청
				const deletePromises = selectedFix.map((flowCode) =>
					orderApi.deleteOrder(flowCode)
				);

				await Promise.all(deletePromises);

				alert(`선택된 ${selectedFix.length}개 값이 성공적으로 삭제되었습니다.`);

				// 선택 초기화 및 목록 새로고침
				setSelectedFix([]);
				await loadFixes(searchFilters, currentPage);
			} catch (err) {
				handleError(err);
			} finally {
				setLoading(false);
			}
		}
	};

	// 수리 상세 페이지로 이동
	const handleFixClick = (flowCode: string) => {
		const fixData = fixes.find((fix) => fix.flowCode === flowCode);

		if (fixData?.imagePath) {
			sessionStorage.setItem("tempImagePath", fixData.imagePath);
		}

		const url = `/orders/update/fix/${flowCode}`;
		const NAME = `fixUpdate_${flowCode}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=400";
		const existingPopup = orderUpdatePopups.current.get(flowCode);

		if (existingPopup && !existingPopup.closed) {
			existingPopup.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				orderUpdatePopups.current.set(flowCode, newPopup);

				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						orderUpdatePopups.current.delete(flowCode);
						clearInterval(checkClosed);
					}
				}, 1000);
			}
		}
	};

	// 수리 상태 변경
	const handleStatusChange = async (flowCode: string, newStatus: string) => {
		const confirmMessage = `수리 상태를 "${newStatus}"로 변경하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);
				await orderApi.updateOrderStatus(flowCode, newStatus);
				alert("수리 상태가 성공적으로 변경되었습니다.");
				await loadFixes(searchFilters, currentPage);
			} catch (err) {
				handleError(err);
			} finally {
				setLoading(false);
			}
		}
	};

	// 제조사 클릭 핸들러
	const handleFactoryClick = (flowCode: string) => {
		if (window.confirm("공장을 변경하시겠습니까?")) {
			setSelectedFixForFactory(flowCode);
			setIsFactorySearchOpen(true);
		}
	};

	// 제조사 선택 핸들러
	const handleFactorySelect = useCallback(
		async (factory: FactorySearchDto) => {
			try {
				setLoading(true);
				await orderApi.updateOrderFactory(
					selectedFixForFactory,
					factory.factoryId!
				);

				alert("제조사가 성공적으로 변경되었습니다.");

				// 현재 페이지 데이터 새로고침
				await loadFixes(searchFilters, currentPage);

				// 팝업 상태 정리
				setIsFactorySearchOpen(false);
				setSelectedFixForFactory("");
			} catch (err) {
				handleError(err);
			} finally {
				setLoading(false);
			}
		},
		[] // eslint-disable-line react-hooks/exhaustive-deps
	);

	// 제조사 검색 팝업 닫기 핸들러
	const handleFactorySearchClose = useCallback(() => {
		setIsFactorySearchOpen(false);
		setSelectedFixForFactory("");
	}, []);

	const fetchDropdownData = async () => {
		setDropdownLoading(true);
		try {
			// 공장 데이터 가져오기 -> 서버에서 distinct 이용해 종합 페이지에서 가져오도록
			const factoryResponse = await orderApi.getFilterFactories(
				searchFilters.start,
				searchFilters.end,
				"FIX"
			);
			setFactories(factoryResponse.data || []);

			// 판매처 데이터 가져오기
			const storeResponse = await orderApi.getFilterStores(
				searchFilters.start,
				searchFilters.end,
				"FIX"
			);
			setStores(storeResponse.data || []);

			// 세트타입 데이터 가져오기
			const setTypeResponse = await orderApi.getFilterSetTypes(
				searchFilters.start,
				searchFilters.end,
				"FIX"
			);
			setSetTypes(setTypeResponse.data || []);
			const colorResponse = await orderApi.getFilterColors(
				searchFilters.start,
				searchFilters.end,
				"FIX"
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
			setError("");

			await Promise.all([loadFixes(searchFilters, 1), fetchDropdownData()]);
		};

		const creationPopupRef = orderCreationPopup;
		const updatePopupsRef = orderUpdatePopups;
		const stockRegisterPopupsRef = stockRegisterPopups;

		initializeData();

		const handleOrderCreated = (event: MessageEvent) => {
			if (event.data && event.data.type === "ORDER_CREATED") {
				loadFixes(searchFilters, 1);
				setCurrentPage(1);
			}

			// 재고등록 및 판매등록 완료 메시지 처리 (새로고침만)
			if (
				event.data &&
				(event.data.type === "STOCK_REGISTERED" ||
					event.data.type === "SALES_REGISTERED")
			) {
				setSelectedFix([]);
				loadFixes(searchFilters, currentPage);
			}
		};

		window.addEventListener("message", handleOrderCreated);

		return () => {
			window.removeEventListener("message", handleOrderCreated);
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

			// 재고등록 팝업들 정리
			stockRegisterPopupsRef.current.forEach((popup) => {
				if (popup && !popup.closed) {
					// 팝업 참조만 제거 (실제 창은 닫지 않음)
				}
			});
			stockRegisterPopupsRef.current.clear();
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<div className="page">
				{/* 에러 메시지 */}
				{error && (
					<div className="error-message">
						<span>⚠️</span>
						<p>{error}</p>
					</div>
				)}

				{/* 검색 영역 */}
				<OrderSearch
					searchFilters={searchFilters}
					onFilterChange={handleFilterChange}
					onSearch={handleSearch}
					onReset={handleReset}
					onCreate={handleFixCreate}
					factories={factories}
					stores={stores}
					setTypes={setTypes}
					colors={colors}
					loading={loading}
					dropdownLoading={dropdownLoading}
					onStart={true}
				/>

				{/* 수리 목록 */}
				<div className="list">
					<MainList
						dtos={fixes}
						selected={selectedFix}
						currentPage={currentPage}
						loading={loading}
						onSelect={handleSelectFix}
						onClick={handleFixClick}
						onStatusChange={handleStatusChange}
						onFactoryClick={handleFactoryClick}
					/>

					{/* 하단 액션 바 */}
					<BulkActionBar
						selectedCount={selectedFix.length}
						onStockRegister={handleStockRegister}
						onSalesRegister={handleSalesRegister}
						onDelete={handleBulkDelete}
						className="order"
					/>

					{/* 페이지네이션 */}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={(page) => {
							setCurrentPage(page);
							loadFixes(searchFilters, page);
						}}
						className="order"
					/>
				</div>

				{/* 제조사 검색 팝업 */}
				{isFactorySearchOpen && (
					<FactorySearch
						onSelectFactory={handleFactorySelect}
						onClose={handleFactorySearchClose}
					/>
				)}
			</div>
		</>
	);
};

export default FixPage;
