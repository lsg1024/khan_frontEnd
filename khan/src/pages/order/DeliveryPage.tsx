import { useState, useEffect, useCallback, useRef } from "react";
import Pagination from "../../components/common/Pagination";
import BulkActionBar from "../../components/common/order/BulkActionBar";
import OrderSearch from "../../components/common/order/OrderSearch";
import type { SearchFilters } from "../../components/common/order/OrderSearch";
import { useErrorHandler } from "../../utils/errorHandler";
import { useBulkActions } from "../../hooks/useBulkActions";
import { deliveryApi } from "../../../libs/api/delivery";
import { orderApi } from "../../../libs/api/order";
import FactorySearch from "../../components/common/factory/FactorySearch";
import type { FactorySearchDto } from "../../types/factory";
import type { OrderDto } from "../../types/order";
import MainList from "../../components/common/order/MainList";
import { getLocalDate } from "../../utils/dateUtils";
import { useTenant } from "../../tenant/UserTenant";
import { printDeliveryBarcode, printProductBarcode } from "../../service/barcodePrintService";
import "../../styles/pages/OrderPage.css";

export const ExpactPage = () => {
	const [loading, setLoading] = useState<boolean>(true);
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
	const { tenant } = useTenant();

	// 제조사 변경 관련 상태
	const [isFactorySearchOpen, setIsFactorySearchOpen] = useState(false);
	const [selectedExpactForFactory, setSelectedExpactForFactory] =
		useState<string>("");

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

	const handleStatusChange = async (flowCode: string, newStatus: string) => {
		const confirmMessage = `출고 상태를 "${newStatus}"로 변경하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);
				await orderApi.updateOrderStatus(flowCode, newStatus);
				alert("출고 상태가 성공적으로 변경되었습니다.");
				await loadExpacts(searchFilters, currentPage);
			} catch (err) {
				handleError(err);
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
				handleError(err);
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
				handleError(err);
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
		selectedItems: selectedExpact,
		setSelectedItems: setSelectedExpact,
		items: expacts,
		searchFilters,
		currentPage,
		loadData: loadExpacts,
	});

	// 바코드 출력 핸들러
	const handlePrintDeliveryBarcode = async () => {
		if (selectedExpact.length === 0) {
			alert("출고 바코드를 출력할 항목을 선택해주세요.");
			return;
		}

		const printerName = localStorage.getItem("preferred_printer_name");
		if (!printerName) {
			alert("프린터를 먼저 설정해주세요. (설정 > 바코드 프린터 설정)");
			return;
		}

		try {
			for (const flowCode of selectedExpact) {
				const expact = expacts.find(e => e.flowCode === flowCode);
				if (!expact) continue;

				await printDeliveryBarcode(printerName, {
					subdomain: tenant || "",
					productName: expact.productName || "",
					material: expact.materialName || "",
					color: expact.colorName || "",
					weight: expact.productWeight?.toString() || "",
					size: expact.productSize || "",
					mainStoneMemo: expact.mainStoneNote || "",
					assistantStoneMemo: expact.assistanceStoneNote || "",
					serialNumber: expact.flowCode || "",
				});
			}
			alert(`${selectedExpact.length}개의 출고 바코드 출력이 완료되었습니다.`);
		} catch {
			alert("바코드 출력 중 오류가 발생했습니다.");
		}
	};

	const handlePrintProductBarcode = async () => {
		if (selectedExpact.length === 0) {
			alert("제품 바코드를 출력할 항목을 선택해주세요.");
			return;
		}

		const printerName = localStorage.getItem("preferred_printer_name");
		if (!printerName) {
			alert("프린터를 먼저 설정해주세요. (설정 > 바코드 프린터 설정)");
			return;
		}

		try {
			for (const flowCode of selectedExpact) {
				await printProductBarcode(printerName, {
					subdomain: tenant || "",
					productName: "",
					serialNumber: flowCode
				});
			}
			alert(`${selectedExpact.length}개의 제품 바코드 출력이 완료되었습니다.`);
		} catch {
			alert("제품 바코드 출력 기능은 준비 중입니다.");
		}
	};

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
			await Promise.all([loadExpacts(searchFilters, 1), fetchDropdownData()]);
		};

		const creationPopupRef = orderCreationPopup;
		const updatePopupsRef = orderUpdatePopups;

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
		};

		window.addEventListener("message", handleMessage);
		window.addEventListener("message", handleBulkActionMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
			window.removeEventListener("message", handleBulkActionMessage);

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
							<p>주문번호: {selectedExpact}</p>
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
						dtos={expacts}
						selected={selectedExpact}
						currentPage={currentPage}
						loading={loading}
						onSelect={handleSelectExpact}
						onClick={handleExpactClick}
						onStatusChange={handleStatusChange}
						onFactoryClick={handleFactoryClick}
						onImageClick={(productId) => {
							const url = `/catalog/detail/${productId}`;
							const features =
								"width=1400,height=900,resizable=yes,scrollbars=yes";
							window.open(url, "product_detail", features);
						}}
					/>

					{/* 하단 액션 바 */}
					<BulkActionBar
						selectedCount={selectedExpact.length}
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
