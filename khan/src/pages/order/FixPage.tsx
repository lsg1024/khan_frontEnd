import { useState, useEffect, useCallback } from "react";
import Pagination from "../../components/common/Pagination";
import BulkActionBar from "../../components/common/order/BulkActionBar";
import OrderSearch from "../../components/common/order/OrderSearch";
import { useErrorHandler } from "../../utils/errorHandler";
import { useToast } from "../../components/common/toast/Toast";
import { useBulkActions } from "../../hooks/useBulkActions";
import { usePopupManager } from "../../hooks/usePopupManager";
import { useBarcodeHandler } from "../../hooks/useBarcodeHandler";
import { useWindowMessage } from "../../hooks/useWindowMessage";
import { fixApi } from "../../../libs/api/fixApi";
import { orderApi } from "../../../libs/api/orderApi";
import FactorySearch from "../../components/common/factory/FactorySearch";
import type { SearchFilters } from "../../components/common/order/OrderSearch";
import type { FactorySearchDto } from "../../types/factoryDto";
import type { OrderDto } from "../../types/orderDto";
import MainList from "../../components/common/order/MainList";
import { getLocalDate } from "../../utils/dateUtils";
import {
	openProductDetailPopup,
	openOrderCreatePopup,
	openOrderUpdatePopup,
} from "../../utils/popupUtils";
import "../../styles/pages/order/OrderPage.css";

export const FixPage = () => {
	const [loading, setLoading] = useState<boolean>(true);
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
	const { showToast } = useToast();

	// 팝업 관리
	const { openSinglePopup, openMultiPopup, singlePopupRef, multiPopupsRef } = usePopupManager();

	// 바코드 출력
	const { printDeliveryBarcodes, printProductBarcodes } = useBarcodeHandler({
		items: fixes,
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
	const [selectedFixForFactory, setSelectedFixForFactory] =
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

	// 검색 실행
	const handleSearch = async () => {
		setCurrentPage(1);
		await Promise.all([loadFixes(searchFilters, 1), fetchDropdownData()]);
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
			sortOrder: "",
		};
		setSearchFilters(resetFilters);
		setCurrentPage(1);
		await Promise.all([loadFixes(resetFilters, 1), fetchDropdownData()]);
	};

	// 주문 데이터 로드 함수
	const loadFixes = useCallback(
		async (filters: SearchFilters, page: number = 1) => {
			setLoading(true);
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

	// Bulk Actions Hook
	const {
		handleStockRegister,
		handleSalesRegister,
		handleBulkDelete,
		handleBulkActionMessage,
		cleanupPopups,
	} = useBulkActions({
		selectedItems: selectedFix,
		setSelectedItems: setSelectedFix,
		items: fixes,
		searchFilters,
		currentPage,
		loadData: loadFixes,
	});

	// 바코드 출력 핸들러
	const handlePrintDeliveryBarcode = () => {
		printDeliveryBarcodes(selectedFix);
	};

	const handlePrintProductBarcode = () => {
		printProductBarcodes(selectedFix);
	};

	const handleFixCreate = () => {
		openSinglePopup(() => openOrderCreatePopup("fix"));
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

	// 수리 상세 페이지로 이동
	const handleFixClick = (flowCode: string) => {
		const fixData = fixes.find((fix) => fix.flowCode === flowCode);

		if (fixData?.imagePath) {
			sessionStorage.setItem("tempImagePath", fixData.imagePath);
		}

		openMultiPopup(flowCode, () => openOrderUpdatePopup("fix", flowCode));
	};

	// 수리 상태 변경
	const handleStatusChange = async (flowCode: string, newStatus: string) => {
		const confirmMessage = `수리 상태를 "${newStatus}"로 변경하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);
				await orderApi.updateOrderStatus(flowCode, newStatus);
				showToast("수리 상태가 성공적으로 변경되었습니다.", "success", 3000);
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

				showToast("제조사가 성공적으로 변경되었습니다.", "success", 3000);

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
			await Promise.all([loadFixes(searchFilters, 1), fetchDropdownData()]);
		};

		initializeData();

		// 메시지 이벤트 등록
		onMessage("ORDER_CREATED", () => {
			loadFixes(searchFilters, 1);
			setCurrentPage(1);
		}, 500);

		onMessage("ORDER_UPDATED", () => {
			loadFixes(searchFilters, currentPage);
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
						onImageClick={(productId) => openProductDetailPopup(productId)}
					/>

					{/* 하단 액션 바 */}
					<BulkActionBar
						selectedCount={selectedFix.length}
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
							loadFixes(searchFilters, page);
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
export default FixPage;
