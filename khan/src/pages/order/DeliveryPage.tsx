import { useState, useEffect, useCallback } from "react";
import Pagination from "../../components/common/Pagination";
import BulkActionBar from "../../components/common/order/BulkActionBar";
import OrderSearch from "../../components/common/order/OrderSearch";
import type { SearchFilters } from "../../components/common/order/OrderSearch";
import { useErrorHandler } from "../../utils/errorHandler";
import { useToast } from "../../components/common/toast/Toast";
import { useBulkActions } from "../../hooks/useBulkActions";
import { usePopupManager } from "../../hooks/usePopupManager";
import { useBarcodeHandler } from "../../hooks/useBarcodeHandler";
import { useWindowMessage } from "../../hooks/useWindowMessage";
import { deliveryApi } from "../../../libs/api/deliveryApi";
import { orderApi } from "../../../libs/api/orderApi";
import FactorySearch from "../../components/common/factory/FactorySearch";
import type { FactorySearchDto } from "../../types/factoryDto";
import type { OrderDto } from "../../types/orderDto";
import MainList from "../../components/common/order/MainList";
import { getLocalDate } from "../../utils/dateUtils";
import { openProductDetailPopup } from "../../utils/popupUtils";
import "../../styles/pages/order/OrderPage.css";

export const ExpactPage = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [expects, setExpects] = useState<OrderDto[]>([]);
	const [selectedExpect, setSelectedExpect] = useState<string[]>([]);
	const [factories, setFactories] = useState<string[]>([]);
	const [stores, setStores] = useState<string[]>([]);
	const [setTypes, setSetTypes] = useState<string[]>([]);
	const [colors, setColors] = useState<string[]>([]);
	const [dropdownLoading, setDropdownLoading] = useState(false);
	const { handleError } = useErrorHandler();
	const { showToast } = useToast();

	// 팝업 관리
	const { openMultiPopup, singlePopupRef, multiPopupsRef } = usePopupManager();

	// 바코드 출력
	const { printDeliveryBarcodes, printProductBarcodes } = useBarcodeHandler({
		items: expects,
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

	// 제조사 변경 관련 상태
	const [isFactorySearchOpen, setIsFactorySearchOpen] = useState(false);
	const [selectedExpactForFactory, setSelectedExpactForFactory] =
		useState<string>("");

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
	const handleSearch = async () => {
		setCurrentPage(1);
		await Promise.all([loadExpacts(searchFilters, 1), fetchDropdownData()]);
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
		await Promise.all([loadExpacts(resetFilters, 1), fetchDropdownData()]);
	};

	// 체크박스 관련 핸들러 (다중 선택)
	const handleSelectExpact = (flowCode: string, checked: boolean) => {
		if (checked) {
			// 선택 추가
			setSelectedExpect((prev) => [...prev, flowCode]);
		} else {
			// 선택 해제
			setSelectedExpect((prev) => prev.filter((id) => id !== flowCode));
		}
	};

	const handleExpactClick = (flowCode: string) => {
		const expactData = expects.find((expect) => expect.flowCode === flowCode);

		if (expactData?.imagePath) {
			sessionStorage.setItem("tempImagePath", expactData.imagePath);
		}

		openMultiPopup(flowCode, () => {
			const url = `/orders/update/expect/${flowCode}`;
			const NAME = `expactUpdate_${flowCode}`;
			const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=400";
			return window.open(url, NAME, FEATURES);
		});
	};

	const handleStatusChange = async (flowCode: string, newStatus: string) => {
		const confirmMessage = `출고 상태를 "${newStatus}"로 변경하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);
				await orderApi.updateOrderStatus(flowCode, newStatus);
				showToast("출고 상태가 성공적으로 변경되었습니다.", "success", 3000);
				await loadExpacts(searchFilters, currentPage);
			} catch (err) {
				handleError(err);
				showToast("출고 상태 변경에 실패했습니다.", "error", 3000);
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

				showToast("제조사가 성공적으로 변경되었습니다.", "success", 3000);

				// 현재 페이지 데이터 새로고침
				await loadExpacts(searchFilters, currentPage);

				// 팝업 상태 정리
				setIsFactorySearchOpen(false);
				setSelectedExpactForFactory("");
			} catch (err) {
				handleError(err);
				showToast("제조사 변경에 실패했습니다.", "error", 3000);
			} finally {
				setLoading(false);
			}
		},
		[] // eslint-disable-line react-hooks/exhaustive-deps
	);

	const loadExpacts = useCallback(
		async (filters: typeof searchFilters, page: number = 1) => {
			setLoading(true);

			setSelectedExpect([]);
			try {
				const response = await deliveryApi.getExpacts(
					filters.start,
					filters.end,
					"EXPECT",
					filters.search,
					filters.factory,
					filters.store,
					filters.setType,
					page
				);

				if (response.success && response.data) {
					const pageData = response.data.page;
					const content = response.data.content || [];

					setExpects(content || []);
					setCurrentPage(page);
					setTotalPages(pageData.totalPages || 1);
					setTotalElements(pageData.totalElements || 0);
				}
			} catch (err) {
				handleError(err);
				setExpects([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[] // eslint-disable-line react-hooks/exhaustive-deps
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
		selectedItems: selectedExpect,
		setSelectedItems: setSelectedExpect,
		items: expects,
		searchFilters,
		currentPage,
		loadData: loadExpacts,
	});

	// 바코드 출력 핸들러
	const handlePrintDeliveryBarcode = () => {
		printDeliveryBarcodes(selectedExpect);
	};

	const handlePrintProductBarcode = () => {
		printProductBarcodes(selectedExpect);
	};

	const fetchDropdownData = async () => {
		setDropdownLoading(true);
		try {
			// 공장 데이터 가져오기 -> 서버에서 distinct 이용해 종합 페이지에서 가져오도록
			const factoryResponse = await orderApi.getFilterFactories(
				searchFilters.start,
				searchFilters.end,
				"EXPECT"
			);
			setFactories(factoryResponse.data || []);

			// 판매처 데이터 가져오기
			const storeResponse = await orderApi.getFilterStores(
				searchFilters.start,
				searchFilters.end,
				"EXPECT"
			);
			setStores(storeResponse.data || []);

			// 세트타입 데이터 가져오기
			const setTypeResponse = await orderApi.getFilterSetTypes(
				searchFilters.start,
				searchFilters.end,
				"EXPECT"
			);
			setSetTypes(setTypeResponse.data || []);
			// 색상 데이터 가져오기
			const colorResponse = await orderApi.getFilterColors(
				searchFilters.start,
				searchFilters.end,
				"EXPECT"
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
			await Promise.all([loadExpacts(searchFilters, 1), fetchDropdownData()]);
		};

		initializeData();

		// 메시지 이벤트 등록
		const refreshData = () => {
			setSelectedExpect([]);
			loadExpacts(searchFilters, currentPage);
		};

		onMessage("STOCK_REGISTER_COMPLETED", () => {
			showToast("재고등록이 완료되었습니다.", "success", 3000);
			refreshData();
		}, 500);

		onMessage("SALES_REGISTER_COMPLETED", () => {
			showToast("판매등록이 완료되었습니다.", "success", 3000);
			refreshData();
		}, 500);

		// useBulkActions의 메시지 핸들러도 등록
		window.addEventListener("message", handleBulkActionMessage);

		return () => {
			clearMessages();
			window.removeEventListener("message", handleBulkActionMessage);

			// 팝업 참조 정리
			if (singlePopupRef.current && !singlePopupRef.current.closed) {
				singlePopupRef.current = null;
			}
			multiPopupsRef.current.clear();
			cleanupPopups();
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<div className="page">
				{/* 출고일 변경 모달 */}
				{isDatePickerOpen && (
					<div className="date-picker-modal-overlay">
						<div className="date-picker-modal">
							<h3>출고일 변경</h3>
							<p>주문번호: {selectedExpect}</p>
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
						dtos={expects}
						selected={selectedExpect}
						currentPage={currentPage}
						loading={loading}
						onSelect={handleSelectExpact}
						onClick={handleExpactClick}
						onStatusChange={handleStatusChange}
						onFactoryClick={handleFactoryClick}
						onImageClick={(productId) => openProductDetailPopup(productId)}
					/>

					{/* 하단 액션 바 */}
					<BulkActionBar
						selectedCount={selectedExpect.length}
						onChangeDeliveryDate={handleChangeDeliveryDate}
						onStockRegister={handleStockRegister}
						onSalesRegister={handleSalesRegister}
						onDelete={handleBulkDelete}
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
							loadExpacts(searchFilters, page);
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

export default ExpactPage;
