import { useState, useEffect, useCallback, useRef } from "react";
import { orderApi } from "../../../libs/api/order";
import Pagination from "../../components/common/Pagination";
import BulkActionBar from "../../components/common/BulkActionBar";
import FactorySearch from "../../components/common/factory/FactorySearch";
import { useErrorHandler } from "../../utils/errorHandler";
import type { OrderDto } from "../../types/order";
import type { FactorySearchDto } from "../../types/factory";
import OrderSearch from "../../components/common/order/OrderSearch";
import type { SearchFilters } from "../../components/common/order/OrderSearch";
import MainList from "../../components/common/order/MainList";
import { getLocalDate } from "../../utils/dateUtils";
import "../../styles/pages/OrderPage.css";

export const OrderPage = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [dropdownLoading, setDropdownLoading] = useState(false);
	const [orders, setOrders] = useState<OrderDto[]>([]); // 주문 데이터 상태
	const [factories, setFactories] = useState<string[]>([]);
	const [stores, setStores] = useState<string[]>([]);
	const [setTypes, setSetTypes] = useState<string[]>([]);
	const [colors, setColors] = useState<string[]>([]);

	// 출고일 변경 관련 상태
	const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
	const [newDeliveryDate, setNewDeliveryDate] = useState<Date>(new Date());

	// 제조사 변경 관련 상태
	const [isFactorySearchOpen, setIsFactorySearchOpen] = useState(false);
	const [selectedOrderForFactory, setSelectedOrderForFactory] =
		useState<string>("");

	// 체크박스 선택 관련 상태 (다중 선택 허용)
	const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

	const { handleError } = useErrorHandler();

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
		value: SearchFilters[K]
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));

		// start 선택 시 end 자동 보정 (문자열 날짜 비교)
		if (field === "start" && (value as string) > prevEnd()) {
			setSearchFilters((prev) => ({ ...prev, end: value as string }));
		}
	};

	const prevEnd = () => searchFilters.end;

	const handleOrderCreate = () => {
		const url = "/orders/create/order";
		const NAME = "orderCreatePopup";
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=800";

		if (orderCreationPopup.current && !orderCreationPopup.current.closed) {
			orderCreationPopup.current.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				orderCreationPopup.current = newPopup;

				// 팝업 닫힘 감지를 위한 인터벌 설정 (참조 정리만 수행)
				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						console.log("주문 생성 팝업이 닫혔습니다.");
						// 참조만 정리하고 새로고침은 메시지 이벤트에서만 처리
						clearInterval(checkClosed);
						orderCreationPopup.current = null;
					}
				}, 1000);
			}
		}
	};

	const handleExcelDownload = async () => {
		try {
			setLoading(true);
			setError("");
			const response = await orderApi.downloadOrdersExcel(
				searchFilters.start,
				searchFilters.end,
				"ORDER",
				searchFilters.search,
				searchFilters.factory,
				searchFilters.store,
				searchFilters.setType,
				searchFilters.color
			);

			const blob = new Blob([response.data], {
				type: response.headers["content-type"],
			});

			const contentDisposition = response.headers["content-disposition"];
			let fileName = "주문장.xlsx"; // 기본 파일명
			if (contentDisposition) {
				const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
				if (fileNameMatch && fileNameMatch.length === 2) {
					fileName = decodeURIComponent(fileNameMatch[1]);
				}
			}

			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", fileName);
			document.body.appendChild(link);
			link.click();

			link.parentNode?.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err) {
			handleError(err, setError);
			alert("엑셀 다운로드에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// 주문 상세 페이지로 이동
	const handleDetailClick = (flowCode: string) => {
		const orderData = orders.find((order) => order.flowCode === flowCode);

		if (orderData?.imagePath) {
			sessionStorage.setItem("tempImagePath", orderData.imagePath);
		}

		const url = `/orders/update/order/${flowCode}`;
		const NAME = `orderUpdate_${flowCode}`;
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

	// 주문 상태 변경
	const handleStatusChange = async (flowCode: string, newStatus: string) => {
		const confirmMessage = `주문 상태를 ${newStatus}로 변경하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);
				const orderId = flowCode;
				await orderApi.updateOrderStatus(orderId, newStatus);
				alert("주문 상태가 성공적으로 변경되었습니다.");
				// 현재 페이지 데이터 새로고침
				await loadOrders(searchFilters, currentPage);
			} catch (err) {
				handleError(err, setError);
				alert(error);
			} finally {
				setLoading(false);
			}
		}
	};

	// 제조사 클릭 핸들러
	const handleFactoryClick = (flowCode: string) => {
		if (window.confirm("공장을 변경하시겠습니까?")) {
			setSelectedOrderForFactory(flowCode);
			setIsFactorySearchOpen(true);
		}
	};

	// 제조사 선택 핸들러
	const handleFactorySelect = useCallback(
		async (factory: FactorySearchDto) => {
			try {
				if (factory.factoryId === undefined || factory.factoryId === null) {
					alert("제조사 ID가 누락되었습니다. 다른 제조사를 선택해주세요.");
					return;
				}

				setLoading(true);
				await orderApi.updateOrderFactory(
					selectedOrderForFactory,
					factory.factoryId
				);

				alert("제조사가 성공적으로 변경되었습니다.");

				// 현재 페이지 데이터 새로고침
				await loadOrders(searchFilters, currentPage);

				// 팝업 상태 정리
				setIsFactorySearchOpen(false);
				setSelectedOrderForFactory("");
			} catch (err) {
				handleError(err, setError);
				alert("제조사 변경에 실패했습니다.");
			} finally {
				setLoading(false);
			}
		},
		[] // eslint-disable-line react-hooks/exhaustive-deps
	);

	// 제조사 검색 팝업 닫기 핸들러
	const handleFactorySearchClose = useCallback(() => {
		setIsFactorySearchOpen(false);
		setSelectedOrderForFactory("");
	}, []);

	// 체크박스 관련 핸들러 (다중 선택)
	const handleSelectOrder = (flowCode: string, checked: boolean) => {
		if (checked) {
			// 선택 추가
			setSelectedOrders((prev) => [...prev, flowCode]);
		} else {
			// 선택 해제
			setSelectedOrders((prev) => prev.filter((id) => id !== flowCode));
		}
	};

	// 검색 실행
	const handleSearch = () => {
		setCurrentPage(1);
		loadOrders(searchFilters, 1);
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
		loadOrders(resetFilters, 1);
	};

	// 주문 데이터 로드 함수
	const loadOrders = useCallback(
		async (filters: typeof searchFilters, page: number = 1) => {
			setLoading(true);
			setError("");

			setSelectedOrders([]);

			try {
				const response = await orderApi.getOrders(
					filters.start,
					filters.end,
					"ORDER",
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

					setOrders(content || []);
					setCurrentPage(page);
					setTotalPages(pageData.totalPages || 1);
					setTotalElements(pageData.totalElements || 0);

					return content;
				}
			} catch (err) {
				handleError(err, setError);
				setOrders([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[handleError]
	);

	// 대량 작업 핸들러
	const handleSaveDeliveryDate = async () => {
		console.log("click");
		if (selectedOrders.length === 0) return;

		const isoDateString = newDeliveryDate.toISOString();
		const confirmMessage = `선택된 ${selectedOrders.length}개 주문의 출고일을 ${
			isoDateString.split("T")[0]
		}(으)로 변경하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);
				// 선택된 모든 주문의 출고일 변경
				const promises = selectedOrders.map((orderId) =>
					orderApi.updateDeliveryDate(orderId, isoDateString)
				);
				await Promise.all(promises);
				alert(
					`${selectedOrders.length}개 주문의 출고일이 성공적으로 변경되었습니다.`
				);

				// 데이터 새로고침
				await loadOrders(searchFilters, currentPage);
			} catch (err) {
				handleError(err, setError);
				alert("출고일 변경에 실패했습니다.");
			} finally {
				setIsDatePickerOpen(false); // 날짜 선택창 닫기
				setLoading(false);
			}
		}
	};

	const handleChangeDeliveryDate = () => {
		if (selectedOrders.length !== 1) {
			alert("출고일 변경은 주문을 1개만 선택해야 합니다.");
			return;
		}

		const targetOrder = orders.find(
			(order) => order.flowCode === selectedOrders[0]
		);

		if (targetOrder) {
			const initialDate = targetOrder.shippingAt
				? new Date(targetOrder.shippingAt)
				: new Date();
			setNewDeliveryDate(initialDate);
		}
		setIsDatePickerOpen(true);
	};

	const handleCloseDatePicker = () => {
		setIsDatePickerOpen(false);
	};

	const stockRegisterPopups = useRef<Map<string, Window>>(new Map());

	const handleStockRegister = () => {
		if (selectedOrders.length === 0) {
			alert("등록할 주문을 먼저 선택해주세요.");
			return;
		}

		const ids = selectedOrders.join(",");
		const stock = "STOCK";

		const url = `/orders/register-stock?ids=${ids}&type=${stock}`;
		const NAME = `stockRegisterBulk`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=200";

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
		if (selectedOrders.length === 0) {
			alert("등록할 주문을 먼저 선택해주세요.");
			return;
		}

		const ids = selectedOrders.join(",");
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
					}
				}, 1000);
			}
		}
	};

	const handleBulkDelete = async () => {
		if (selectedOrders.length === 0) {
			alert("삭제할 값을 먼저 선택해주세요.");
			return;
		}

		const confirmMessage = `선택된 ${selectedOrders.length}개 값을 삭제하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);

				// 선택된 모든 주문 삭제 요청
				const deletePromises = selectedOrders.map((flowCode) =>
					orderApi.deleteOrder(flowCode)
				);

				await Promise.all(deletePromises);

				alert(
					`선택된 ${selectedOrders.length}개 값이 성공적으로 삭제되었습니다.`
				);

				// 선택 초기화 및 목록 새로고침
				setSelectedOrders([]);
				await loadOrders(searchFilters, currentPage);
			} catch (err) {
				handleError(err, setError);
				alert("주문 삭제에 실패했습니다.");
			} finally {
				setLoading(false);
			}
		}
	};

	const fetchDropdownData = async () => {
		setDropdownLoading(true);
		try {
			const factoryResponse = await orderApi.getFilterFactories(
				searchFilters.start,
				searchFilters.end,
				"ORDER"
			);
			setFactories(factoryResponse.data || []);

			const storeResponse = await orderApi.getFilterStores(
				searchFilters.start,
				searchFilters.end,
				"ORDER"
			);
			setStores(storeResponse.data || []);

			const setTypeResponse = await orderApi.getFilterSetTypes(
				searchFilters.start,
				searchFilters.end,
				"ORDER"
			);
			setSetTypes(setTypeResponse.data || []);

			const colorResponse = await orderApi.getFilterColors(
				searchFilters.start,
				searchFilters.end,
				"ORDER"
			);
			setColors(colorResponse.data || []);
		} catch {
			// 에러 처리
		} finally {
			setDropdownLoading(false);
		}
	};

	useEffect(() => {
		const initializeData = async () => {
			setCurrentPage(1);
			setError("");
			await Promise.all([loadOrders(searchFilters, 1), fetchDropdownData()]);
		};

		const creationPopupRef = orderCreationPopup;
		const updatePopupsRef = orderUpdatePopups;
		const stockRegisterPopupsRef = stockRegisterPopups;

		initializeData();

		const handleOrderCreated = (event: MessageEvent) => {
			if (event.data && event.data.type === "ORDER_CREATED") {
				if (event.data.flowCodes && event.data.flowCodes.length > 0) {
					// 주문 목록 새로고침
					loadOrders(searchFilters, 1);
					setCurrentPage(1);
				}
			}

			// 재고등록 및 판매등록 완료 메시지 처리 (새로고침만)
			if (
				event.data &&
				(event.data.type === "STOCK_REGISTERED" ||
					event.data.type === "SALES_REGISTERED")
			) {
				// 선택 해제 및 목록 새로고침만 처리 (alert 제거)
				setSelectedOrders([]);
				loadOrders(searchFilters, currentPage);
			}
		};

		window.addEventListener("message", handleOrderCreated);

		return () => {
			window.removeEventListener("message", handleOrderCreated);

			if (creationPopupRef.current && !creationPopupRef.current.closed) {
				creationPopupRef.current = null;
			}

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

	// 로딩 상태 렌더링
	if (loading) {
		return (
			<>
				<div className="loading-container">
					<div className="spinner"></div>
					<p>주문을 불러오는 중...</p>
				</div>
			</>
		);
	}

	return (
		<>
			<div className="order-page">
				{/* 에러 메시지 */}
				{error && (
					<div className="error-message">
						<span>⚠️</span>
						<p>{error}</p>
					</div>
				)}

				{/* 출고일 변경 모달 */}
				{isDatePickerOpen && (
					<div className="date-picker-modal-overlay">
						<div className="date-picker-modal">
							<h3>출고일 변경</h3>
							<p>주문번호: {selectedOrders}</p>
							<input
								type="date"
								value={newDeliveryDate.toISOString().split("T")[0]}
								onChange={(e) => setNewDeliveryDate(new Date(e.target.value))}
								className="date-picker-input"
							/>
							<div className="date-picker-actions">
								<button
									onClick={handleSaveDeliveryDate}
									className="date-btn-save"
								>
									저장
								</button>
								<button
									onClick={handleCloseDatePicker}
									className="date-btn-cancel"
								>
									취소
								</button>
							</div>
						</div>
					</div>
				)}

				{/* 검색 영역 */}
				<OrderSearch
					searchFilters={searchFilters}
					onFilterChange={handleFilterChange}
					onSearch={handleSearch}
					onReset={handleReset}
					onCreate={handleOrderCreate}
					onExcel={handleExcelDownload}
					factories={factories}
					stores={stores}
					setTypes={setTypes}
					colors={colors}
					loading={loading}
					dropdownLoading={dropdownLoading}
					onStart={true}
				/>

				{/* 주문 목록 */}
				<div className="order-list">
					<MainList
						dtos={orders}
						selected={selectedOrders}
						currentPage={currentPage}
						loading={loading}
						onSelect={handleSelectOrder}
						onClick={handleDetailClick}
						onStatusChange={handleStatusChange}
						onFactoryClick={handleFactoryClick}
					/>

					{/* 대량 작업 바 */}
					<BulkActionBar
						selectedCount={selectedOrders.length}
						onChangeDeliveryDate={handleChangeDeliveryDate}
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
							loadOrders(searchFilters, page);
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

export default OrderPage;
