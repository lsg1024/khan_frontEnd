import { useState, useEffect, useCallback } from "react";
import { orderApi } from "../../../libs/api/orderApi";
import Pagination from "../../components/common/Pagination";
import BulkActionBar from "../../components/common/order/BulkActionBar";
import FactorySearch from "../../components/common/factory/FactorySearch";
import { useErrorHandler } from "../../utils/errorHandler";
import { useToast } from "../../components/common/toast/Toast";
import { useBulkActions } from "../../hooks/useBulkActions";
import { usePopupManager } from "../../hooks/usePopupManager";
import { useBarcodeHandler } from "../../hooks/useBarcodeHandler";
import { useWindowMessage } from "../../hooks/useWindowMessage";
import type { OrderDto } from "../../types/orderDto";
import type { FactorySearchDto } from "../../types/factoryDto";
import OrderSearch from "../../components/common/order/OrderSearch";
import type { SearchFilters } from "../../components/common/order/OrderSearch";
import MainList from "../../components/common/order/MainList";
import { getLocalDate } from "../../utils/dateUtils";
import {
	openProductDetailPopup,
	openOrderCreatePopup,
	openOrderUpdatePopup,
} from "../../utils/popupUtils";
import "../../styles/pages/order/OrderPage.css";

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
	const { showToast } = useToast();

	// 팝업 관리
	const { openSinglePopup, openMultiPopup, singlePopupRef, multiPopupsRef } = usePopupManager();

	// 바코드 출력
	const { printDeliveryBarcodes, printProductBarcodes } = useBarcodeHandler({
		items: orders,
		dataMapper: (item, subdomain) => ({
			subdomain,
			productName: item.productName || "",
			material: item.materialName || "",
			color: item.colorName || "",
			weight: item.productWeight?.toString() || "",
			size: item.productSize || "",
			mainStoneMemo: item.mainStoneNote || "",
			assistantStoneMemo: item.assistanceStoneNote || "",
			assistantStoneName: "",
			serialNumber: item.flowCode || "",
		}),
	});

	// 윈도우 메시지 통신
	const { on: onMessage, clear: clearMessages } = useWindowMessage();

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
		openSinglePopup(() => openOrderCreatePopup("order"));
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

		openMultiPopup(flowCode, () => openOrderUpdatePopup("order", flowCode));
	};

	// 주문 상태 변경
	const handleStatusChange = async (flowCode: string, newStatus: string) => {
		const confirmMessage = `주문 상태를 ${newStatus}로 변경하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);
				const orderId = flowCode;
				await orderApi.updateOrderStatus(orderId, newStatus);
				showToast("주문 상태가 성공적으로 변경되었습니다.", "success", 3000);
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
					showToast("제조사 ID가 누락되었습니다. 다른 제조사를 선택해주세요.", "error", 4000);
					return;
				}

				setLoading(true);
				await orderApi.updateOrderFactory(
					selectedOrderForFactory,
					factory.factoryId
				);

				showToast("제조사가 성공적으로 변경되었습니다.", "success", 3000);

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
			showToast("상품 상태를 변경해주세요", "warning", 3000);
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
	const handlePrintDeliveryBarcode = () => {
		printDeliveryBarcodes(selectedOrders);
	};

	const handlePrintProductBarcode = () => {
		printProductBarcodes(selectedOrders);
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

		initializeData();

		// 메시지 이벤트 등록
		onMessage("ORDER_CREATED", () => {
			loadOrders(searchFilters, 1);
			setCurrentPage(1);
		}, 500);

		onMessage("ORDER_UPDATED", () => {
			loadOrders(searchFilters, currentPage);
		}, 500);

		// useBulkActions의 메시지 핸들러도 등록
		window.addEventListener("message", handleBulkActionMessage);

		return () => {
			clearMessages();
			window.removeEventListener("message", handleBulkActionMessage);

			// 팝업 정리
			if (singlePopupRef.current && !singlePopupRef.current.closed) {
				singlePopupRef.current = null;
			}

			multiPopupsRef.current.clear();
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
						onImageClick={(productId) => openProductDetailPopup(productId)}
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
