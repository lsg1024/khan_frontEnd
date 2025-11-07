import { useState, useEffect, useCallback, useRef } from "react";
import Pagination from "../../components/common/Pagination";
import BulkActionBar from "../../components/common/BulkActionBar";
import OrderSearch from "../../components/common/order/OrderSearch";
import type { SearchFilters } from "../../components/common/order/OrderSearch";
import { useErrorHandler } from "../../utils/errorHandler";
import { deliveryApi } from "../../../libs/api/delivery";
import { orderApi } from "../../../libs/api/order";
import FactorySearch from "../../components/common/factory/FactorySearch";
import type { FactorySearchDto } from "../../types/factory";
import type { OrderDto } from "../../types/order";
import MainList from "../../components/common/order/MainList";
import { getLocalDate } from "../../utils/dateUtils";
import "../../styles/pages/OrderPage.css";

export const ExpactPage = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [expacts, setExpacts] = useState<OrderDto[]>([]);
	const [selectedExpact, setSelectedExpact] = useState<string[]>([]);
	const [factories, setFactories] = useState<string[]>([]);
	const [stores, setStores] = useState<string[]>([]);
	const [setTypes, setSetTypes] = useState<string[]>([]);
	const [colors, setColors] = useState<string[]>([]);
	const [dropdownLoading, setDropdownLoading] = useState(false);
	const { handleError } = useErrorHandler();

	// 제조사 변경 관련 상태
	const [isFactorySearchOpen, setIsFactorySearchOpen] = useState(false);
	const [selectedExpactForFactory, setSelectedExpactForFactory] =
		useState<string>("");

	const orderCreationPopup = useRef<Window | null>(null);
	const orderUpdatePopups = useRef<Map<string, Window>>(new Map());
	const stockRegisterPopups = useRef<Map<string, Window>>(new Map());

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
		value: SearchFilters[K]
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));

		// start 선택 시 end 자동 보정 (문자열 날짜 비교)
		if (field === "start" && (value as string) > prevEnd()) {
			setSearchFilters((prev) => ({ ...prev, end: value as string }));
		}
	};

	const prevEnd = () => searchFilters.end;

	// 검색 실행
	const handleSearch = () => {
		setCurrentPage(1);
		loadExpacts(searchFilters, 1);
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
			sortOrder: "" as const,
		};
		setSearchFilters(resetFilters);
		setCurrentPage(1);
		loadExpacts(resetFilters, 1);
	};

	// 체크박스 관련 핸들러 (다중 선택)
	const handleSelectExpact = (flowCode: string, checked: boolean) => {
		if (checked) {
			// 선택 추가
			setSelectedExpact((prev) => [...prev, flowCode]);
		} else {
			// 선택 해제
			setSelectedExpact((prev) => prev.filter((id) => id !== flowCode));
		}
	};

	const handleExpactClick = (flowCode: string) => {
		const expactData = expacts.find((expact) => expact.flowCode === flowCode);

		if (expactData?.imagePath) {
			sessionStorage.setItem("tempImagePath", expactData.imagePath);
		}

		const url = `/orders/update/expact/${flowCode}`;
		const NAME = `expactUpdate_${flowCode}`;
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

	// 대량 작업 핸들러
	const handleStockRegister = () => {
		if (selectedExpact.length === 0) {
			alert("등록할 값을 선택해주세요.");
			return;
		}

		try {
			const url = "/stock/register";
			const NAME = "stockRegister";
			const FEATURES = "resizable=yes,scrollbars=yes,width=1200,height=800";

			// 기존 팝업이 열려있으면 닫기
			const existingPopup = stockRegisterPopups.current.get(NAME);
			if (existingPopup && !existingPopup.closed) {
				existingPopup.close();
				stockRegisterPopups.current.delete(NAME);
			}

			// 새 팝업 열기
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				stockRegisterPopups.current.set(NAME, newPopup);

				// 선택된 출고 정보를 팝업으로 전달
				newPopup.addEventListener("load", () => {
					const selectedOrders = expacts.filter((expact) =>
						selectedExpact.includes(expact.flowCode!)
					);
					newPopup.postMessage(
						{
							type: "BULK_STOCK_REGISTER",
							data: selectedOrders,
						},
						"*"
					);
				});

				// 팝업 닫힘 감지
				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						stockRegisterPopups.current.delete(NAME);
						clearInterval(checkClosed);
					}
				}, 1000);
			}
		} catch (err) {
			console.error("재고등록 팝업 열기 실패:", err);
			alert("재고등록 팝업을 열 수 없습니다.");
		}
	};

	const handleSalesRegister = () => {
		if (selectedExpact.length === 0) {
			alert("등록할 값을 선택해주세요.");
			return;
		}

		try {
			const url = "/stock/register";
			const NAME = "salesRegister";
			const FEATURES = "resizable=yes,scrollbars=yes,width=1200,height=800";

			// 기존 팝업이 열려있으면 닫기
			const existingPopup = stockRegisterPopups.current.get(NAME);
			if (existingPopup && !existingPopup.closed) {
				existingPopup.close();
				stockRegisterPopups.current.delete(NAME);
			}

			// 새 팝업 열기
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				stockRegisterPopups.current.set(NAME, newPopup);

				// 선택된 출고 정보를 팝업으로 전달
				newPopup.addEventListener("load", () => {
					const selectedOrders = expacts.filter((expact) =>
						selectedExpact.includes(expact.flowCode!)
					);
					newPopup.postMessage(
						{
							type: "BULK_SALES_REGISTER",
							data: selectedOrders,
						},
						"*"
					);
				});

				// 팝업 닫힘 감지
				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						stockRegisterPopups.current.delete(NAME);
						clearInterval(checkClosed);
					}
				}, 1000);
			}
		} catch (err) {
			console.error("판매등록 팝업 열기 실패:", err);
			alert("판매등록 팝업을 열 수 없습니다.");
		}
	};

	const handleBulkDelete = async () => {
		if (selectedExpact.length === 0) {
			alert("삭제할 값을 선택해주세요.");
			return;
		}

		if (
			window.confirm(
				`선택된 ${selectedExpact.length}개의 값을 삭제하시겠습니까?`
			)
		) {
			try {
				setLoading(true);
				// 각 출고를 개별적으로 삭제
				for (const flowCode of selectedExpact) {
					await orderApi.deleteOrder(flowCode);
				}
				alert("선택된 값이 성공적으로 삭제되었습니다.");
				setSelectedExpact([]);
				await loadExpacts(searchFilters, currentPage);
			} catch (err) {
				handleError(err, setError);
				alert("출고 삭제에 실패했습니다.");
			} finally {
				setLoading(false);
			}
		}
	};

	const handleStatusChange = async (flowCode: string, newStatus: string) => {
		const confirmMessage = `출고 상태를 "${newStatus}"로 변경하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);
				await orderApi.updateOrderStatus(flowCode, newStatus);
				alert("출고 상태가 성공적으로 변경되었습니다.");
				await loadExpacts(searchFilters, currentPage);
			} catch (err) {
				handleError(err, setError);
				alert("출고 상태 변경에 실패했습니다.");
			} finally {
				setLoading(false);
			}
		}
	};

	// 제조사 클릭 핸들러
	const handleFactoryClick = (flowCode: string) => {
		if (window.confirm("공장을 변경하시겠습니까?")) {
			setSelectedExpactForFactory(flowCode);
			setIsFactorySearchOpen(true);
		}
	};

	// 제조사 검색 팝업 닫기 핸들러
	const handleFactorySearchClose = useCallback(() => {
		setIsFactorySearchOpen(false);
		setSelectedExpactForFactory("");
	}, []);

	// 제조사 선택 핸들러
	const handleFactorySelect = useCallback(
		async (factory: FactorySearchDto) => {
			try {
				setLoading(true);
				await orderApi.updateOrderFactory(
					selectedExpactForFactory,
					factory.factoryId!
				);

				alert("제조사가 성공적으로 변경되었습니다.");

				// 현재 페이지 데이터 새로고침
				await loadExpacts(searchFilters, currentPage);

				// 팝업 상태 정리
				setIsFactorySearchOpen(false);
				setSelectedExpactForFactory("");
			} catch (err) {
				handleError(err, setError);
				alert("제조사 변경에 실패했습니다.");
			} finally {
				setLoading(false);
			}
		},
		[] // eslint-disable-line react-hooks/exhaustive-deps
	);

	const loadExpacts = useCallback(
		async (filters: typeof searchFilters, page: number = 1) => {
			setLoading(true);
			setError("");

			setSelectedExpact([]);
			try {
				const response = await deliveryApi.getExpacts(
					filters.start,
					filters.end,
					"EXPACT",
					filters.search,
					filters.factory,
					filters.store,
					filters.setType,
					page
				);

				if (response.success && response.data) {
					const pageData = response.data.page;
					const content = response.data.content || [];

					setExpacts(content || []);
					setCurrentPage(page);
					setTotalPages(pageData.totalPages || 1);
					setTotalElements(pageData.totalElements || 0);
				}
			} catch (err) {
				handleError(err, setError);
				setExpacts([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[] // eslint-disable-line react-hooks/exhaustive-deps
	);

	const fetchDropdownData = async () => {
		setDropdownLoading(true);
		try {
			// 공장 데이터 가져오기 -> 서버에서 distinct 이용해 종합 페이지에서 가져오도록
			const factoryResponse = await orderApi.getFilterFactories(
				searchFilters.start,
				searchFilters.end,
				"EXPACT"
			);
			setFactories(factoryResponse.data || []);

			// 판매처 데이터 가져오기
			const storeResponse = await orderApi.getFilterStores(
				searchFilters.start,
				searchFilters.end,
				"EXPACT"
			);
			setStores(storeResponse.data || []);

			// 세트타입 데이터 가져오기
			const setTypeResponse = await orderApi.getFilterSetTypes(
				searchFilters.start,
				searchFilters.end,
				"EXPACT"
			);
			setSetTypes(setTypeResponse.data || []);
			// 색상 데이터 가져오기
			const colorResponse = await orderApi.getFilterColors(
				searchFilters.start,
				searchFilters.end,
				"EXPACT"
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

			await Promise.all([loadExpacts(searchFilters, 1), fetchDropdownData()]);
		};

		const creationPopupRef = orderCreationPopup;
		const updatePopupsRef = orderUpdatePopups;
		const stockRegisterPopupsRef = stockRegisterPopups;

		initializeData();

		// 메시지 이벤트 핸들러
		const handleMessage = (event: MessageEvent) => {
			// 기존 메시지 타입 처리
			if (event.data?.type === "STOCK_REGISTER_COMPLETED") {
				alert("재고등록이 완료되었습니다.");
				setSelectedExpact([]);
				loadExpacts(searchFilters, currentPage);
			} else if (event.data?.type === "SALES_REGISTER_COMPLETED") {
				alert("판매등록이 완료되었습니다.");
				setSelectedExpact([]);
				loadExpacts(searchFilters, currentPage);
			}
			// 새로운 메시지 타입 처리 (새로고침만)
			else if (
				event.data?.type === "STOCK_REGISTERED" ||
				event.data?.type === "SALES_REGISTERED"
			) {
				// 선택 해제 및 목록 새로고침만 처리 (alert 제거)
				setSelectedExpact([]);
				loadExpacts(searchFilters, currentPage);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);

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

			// 재고/판매 등록 팝업들 정리
			stockRegisterPopupsRef.current.forEach((popup) => {
				if (popup && !popup.closed) {
					popup.close();
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
					// onCreate={handleCreate} // 출고는 생성 기능 없음
					factories={factories}
					stores={stores}
					setTypes={setTypes}
					colors={colors}
					loading={loading}
					dropdownLoading={dropdownLoading}
					onStart={false}
				/>

				{/* 수리 목록 */}
				<div className="list">
					<MainList
						dtos={expacts}
						selected={selectedExpact}
						currentPage={currentPage}
						loading={loading}
						onSelect={handleSelectExpact}
						onClick={handleExpactClick}
						onStatusChange={handleStatusChange}
						onFactoryClick={handleFactoryClick}
					/>

					{/* 하단 액션 바 */}
					<BulkActionBar
						selectedCount={selectedExpact.length}
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
							loadExpacts(searchFilters, page);
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

export default ExpactPage;
