import { useState, useEffect, useCallback, useRef } from "react";
import { orderApi } from "../../../libs/api/order";
import Pagination from "../../components/common/Pagination";
import BulkActionBar from "../../components/common/order/BulkActionBar";
import FactorySearch from "../../components/common/factory/FactorySearch";
import { useErrorHandler } from "../../utils/errorHandler";
import { useBulkActions } from "../../hooks/useBulkActions";
import type { OrderDto } from "../../types/order";
import type { FactorySearchDto } from "../../types/factory";
import OrderSearch from "../../components/common/order/OrderSearch";
import type { SearchFilters } from "../../components/common/order/OrderSearch";
import MainList from "../../components/common/order/MainList";
import { getLocalDate } from "../../utils/dateUtils";
import { useTenant } from "../../tenant/UserTenant";
import {
	printDeliveryBarcode,
	printProductBarcode,
} from "../../service/barcodePrintService";
import "../../styles/pages/OrderPage.css";

export const OrderPage = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [dropdownLoading, setDropdownLoading] = useState(false);
	const [orders, setOrders] = useState<OrderDto[]>([]); // 주문 데이터 상태
	const [factories, setFactories] = useState<string[]>([]);
	const [stores, setStores] = useState<string[]>([]);
	const [setTypes, setSetTypes] = useState<string[]>([]);
	const [colors, setColors] = useState<string[]>([]);

	// 제조사 변경 관련 상태
	const [isFactorySearchOpen, setIsFactorySearchOpen] = useState(false);
	const [selectedOrderForFactory, setSelectedOrderForFactory] =
		useState<string>("");

	// 체크박스 선택 관련 상태 (다중 선택 허용)
	const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

	const { handleError } = useErrorHandler();
	const { tenant } = useTenant();

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
			handleError(err);
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
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=600";
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
				handleError(err);
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
	const handleSearch = async () => {
		setCurrentPage(1);
		await Promise.all([loadOrders(searchFilters, 1), fetchDropdownData()]);
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
		await Promise.all([loadOrders(resetFilters, 1), fetchDropdownData()]);
	};

	// 주문 데이터 로드 함수
	const loadOrders = useCallback(
		async (filters: typeof searchFilters, page: number = 1) => {
			setLoading(true);

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
				}
			} catch (err) {
				handleError(err);
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

	// Bulk Actions Hook
	const {
		isDatePickerOpen,
		newDeliveryDate,
		setNewDeliveryDate,
		handleChangeDeliveryDate,
		handleSaveDeliveryDate,
		handleCloseDatePicker,
		handleStockRegister,
		handleSalesRegister,
		handleBulkDelete,
		handleBulkActionMessage,
		cleanupPopups,
	} = useBulkActions({
		selectedItems: selectedOrders,
		setSelectedItems: setSelectedOrders,
		items: orders,
		searchFilters,
		currentPage,
		loadData: loadOrders,
	});

	// 대기 상태 체크 함수
	const checkWaitingStatus = (): boolean => {
		const selectedOrdersData = orders.filter((order) =>
			selectedOrders.includes(order.flowCode)
		);
		const hasWaitingOrder = selectedOrdersData.some(
			(order) => order.productStatus === "대기"
		);

		if (hasWaitingOrder) {
			alert("상품 상태를 변경해주세요");
			return true;
		}
		return false;
	};

	// Bulk Action 래퍼 함수들
	const handleChangeDeliveryDateWrapper = () => {
		if (checkWaitingStatus()) return;
		handleChangeDeliveryDate();
	};

	const handleStockRegisterWrapper = () => {
		if (checkWaitingStatus()) return;
		handleStockRegister();
	};

	const handleSalesRegisterWrapper = () => {
		if (checkWaitingStatus()) return;
		handleSalesRegister();
	};

	const handleBulkDeleteWrapper = () => {
		if (checkWaitingStatus()) return;
		handleBulkDelete();
	};

	// 바코드 출력 핸들러
	const handlePrintDeliveryBarcode = async () => {
		if (selectedOrders.length === 0) {
			alert("출고 바코드를 출력할 항목을 선택해주세요.");
			return;
		}

		const printerName = localStorage.getItem("preferred_printer_name");
		if (!printerName) {
			alert("프린터를 먼저 설정해주세요. (설정 > 바코드 프린터 설정)");
			return;
		}

		try {
			for (const flowCode of selectedOrders) {
				const order = orders.find((o) => o.flowCode === flowCode);
				if (!order) continue;

				await printDeliveryBarcode(printerName, {
					subdomain: tenant || "",
					productName: order.productName || "",
					material: order.materialName || "",
					color: order.colorName || "",
					weight: order.productWeight?.toString() || "",
					size: order.productSize || "",
					mainStoneMemo: order.mainStoneNote || "",
					assistantStoneMemo: order.assistanceStoneNote || "",
					assistantStoneName: "",
					serialNumber: order.flowCode || "",
				});
			}
			alert(`${selectedOrders.length}개의 출고 바코드 출력이 완료되었습니다.`);
		} catch {
			alert("바코드 출력 중 오류가 발생했습니다.");
		}
	};

	const handlePrintProductBarcode = async () => {
		if (selectedOrders.length === 0) {
			alert("제품 바코드를 출력할 항목을 선택해주세요.");
			return;
		}

		const printerName = localStorage.getItem("preferred_printer_name");
		if (!printerName) {
			alert("프린터를 먼저 설정해주세요. (설정 > 바코드 프린터 설정)");
			return;
		}

		try {
			for (const flowCode of selectedOrders) {
				await printProductBarcode(printerName, {
					subdomain: tenant || "",
					productName: "",
					serialNumber: flowCode,
				});
			}
			alert(`${selectedOrders.length}개의 제품 바코드 출력이 완료되었습니다.`);
		} catch {
			alert("제품 바코드 출력 기능은 준비 중입니다.");
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
			await Promise.all([loadOrders(searchFilters, 1), fetchDropdownData()]);
		};

		const creationPopupRef = orderCreationPopup;
		const updatePopupsRef = orderUpdatePopups;

		initializeData();

		const handleOrderCreated = (event: MessageEvent) => {
			if (event.data && event.data.type === "ORDER_CREATED") {
				if (event.data.flowCodes && event.data.flowCodes.length > 0) {
					// 주문 목록 새로고침
					loadOrders(searchFilters, 1);
					setCurrentPage(1);
				}
			}
		};

		const handleOrderUpdated = (event: MessageEvent) => {
			if (event.data && event.data.type === "ORDER_UPDATED") {
				// 주문 목록 새로고침 (현재 페이지 유지)
				loadOrders(searchFilters, currentPage);
			}
		};

		window.addEventListener("message", handleOrderCreated);
		window.addEventListener("message", handleOrderUpdated);
		window.addEventListener("message", handleBulkActionMessage);

		return () => {
			window.removeEventListener("message", handleOrderCreated);
			window.removeEventListener("message", handleOrderUpdated);
			window.removeEventListener("message", handleBulkActionMessage);

			if (creationPopupRef.current && !creationPopupRef.current.closed) {
				creationPopupRef.current = null;
			}

			updatePopupsRef.current.clear();

			cleanupPopups();
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
			<div className="page">
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
				<div className="list">
					<MainList
						dtos={orders}
						selected={selectedOrders}
						currentPage={currentPage}
						loading={loading}
						onSelect={handleSelectOrder}
						onClick={handleDetailClick}
						onStatusChange={handleStatusChange}
						onFactoryClick={handleFactoryClick}
						onImageClick={(productId) => {
							const url = `/catalog/detail/${productId}`;
							const features =
								"width=1400,height=900,resizable=yes,scrollbars=yes";
							window.open(url, "product_detail", features);
						}}
					/>

					{/* 대량 작업 바 */}
					<BulkActionBar
						selectedCount={selectedOrders.length}
						onChangeDeliveryDate={handleChangeDeliveryDateWrapper}
						onStockRegister={handleStockRegisterWrapper}
						onSalesRegister={handleSalesRegisterWrapper}
						onDelete={handleBulkDeleteWrapper}
						onPrintProductBarcode={handlePrintProductBarcode}
						onPrintDeliveryBarcode={handlePrintDeliveryBarcode}
						className="order"
					/>

					{/* 페이지네이션 */}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						onPageChange={(page) => {
							setCurrentPage(page);
							loadOrders(searchFilters, page);
						}}
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
