import { useState, useEffect, useCallback } from "react";
import { orderApi } from "../../../libs/api/orderApi";
import { stockApi } from "../../../libs/api/stockApi";
import { getLocalDate } from "../../utils/dateUtils";
import type { StockResponse } from "../../types/stockDto";
import StockSearch from "../../components/common/stock/StockSearch";
import StockList from "../../components/common/stock/StockList";
import Pagination from "../../components/common/Pagination";
import StockBulkActionBar from "../../components/common/stock/StockBulkActionBar";
import { useErrorHandler } from "../../utils/errorHandler";
import type { SearchFilters } from "../../components/common/stock/StockSearch";
import { usePopupManager } from "../../hooks/usePopupManager";
import { useBarcodeHandler } from "../../hooks/useBarcodeHandler";
import { useWindowMessage } from "../../hooks/useWindowMessage";
import {
	openStockCreatePopup,
	openStockUpdatePopup,
} from "../../utils/popupUtils";

export const StockPage = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [stocks, setStocks] = useState<StockResponse[]>([]);
	const [factories, setFactories] = useState<string[]>([]);
	const [stores, setStores] = useState<string[]>([]);
	const [setTypes, setSetTypes] = useState<string[]>([]);
	const [colors, setColors] = useState<string[]>([]);
	const [orderStatus] = useState<string[]>([]);
	const [dropdownLoading, setDropdownLoading] = useState(false);
	const { handleError } = useErrorHandler();

	// 체크박스 선택 관련 상태 (다중 선택 허용)
	const [selectedStocks, setSelectedStocks] = useState<string[]>([]);

	// 팝업 관리
	const { openSinglePopup, openMultiPopup } = usePopupManager();
	const { openSinglePopup: openSalesPopup } = usePopupManager();

	// 바코드 출력
	const { printDeliveryBarcodes, printProductBarcodes } = useBarcodeHandler({
		items: stocks,
		dataMapper: (item, subdomain) => ({
			subdomain,
			productName: item.productName || "",
			material: item.materialName || "",
			color: item.colorName || "",
			weight: item.goldWeight?.toString() || "",
			size: item.productSize || "",
			assistantStoneName: item.assistantStoneName || "",
			mainStoneMemo: item.mainStoneNote || "",
			assistantStoneMemo: item.assistanceStoneNote || "",
			serialNumber: item.flowCode || "",
		}),
	});

	// 윈도우 메시지 통신
	const { on: onMessage, clear: clearMessages } = useWindowMessage();

	// 검색 관련 상태
	const [searchFilters, setSearchFilters] = useState<SearchFilters>({
		search: "",
		start: "2025-01-01",
		end: getLocalDate(),
		order_status: "",
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

	// 선택 관련 핸들러
	const handleSelectStock = (flowCode: string, checked: boolean) => {
		setSelectedStocks((prev) =>
			checked ? [...prev, flowCode] : prev.filter((code) => code !== flowCode)
		);
	};

	// No 클릭 시 수정 페이지 열기 (단일 선택)
	const handleStockNoClick = (flowCode: string) => {
		openMultiPopup(flowCode, () => openStockUpdatePopup(flowCode));
	};

	// 시리얼번호 클릭 시 바코드 출력 확인
	const handleSerialClick = (flowCode: string) => {
		if (!confirm("바코드를 출력하시겠습니까?")) {
			return;
		}
		printDeliveryBarcodes([flowCode]);
	};

	// 검색 실행
	const handleSearch = () => {
		setCurrentPage(1);
		setSelectedStocks([]); // 검색 시 선택 초기화
		loadStocks(searchFilters, 1);
		fetchDropdownData();
	};

	// 검색 초기화
	const handleReset = () => {
		const resetFilters: SearchFilters = {
			search: "",
			start: "2025-01-01",
			end: getLocalDate(),
			order_status: "",
			factory: "",
			store: "",
			setType: "",
			color: "",
			sortField: "",
			sortOrder: "" as const,
		};
		setSearchFilters(resetFilters);
		setCurrentPage(1);
		loadStocks(resetFilters, 1);
		fetchDropdownData();
	};

	const handleStockCreate = () => {
		openSinglePopup(() => openStockCreatePopup("normal"));
	};

	// 벌크 액션 핸들러들
	const handleSalesRegister = () => {
		if (selectedStocks.length === 0) return;

		const selectedFlowCodes = selectedStocks.join(",");
		const url = `/sales/create?source=stock&ids=${selectedFlowCodes}`;
		const NAME = `saleCreatePopup`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=800";

		openSalesPopup(() => window.open(url, NAME, FEATURES));
	};

	const handleRentalRegister = () => {
		if (selectedStocks.length === 0) return;

		const selectedFlowCodes = selectedStocks.join(",");
		const url = `/stocks/action/${selectedFlowCodes}?action=rental`;
		const NAME = `stockRentalRegister`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=300";

		const newPopup = window.open(url, NAME, FEATURES);
		if (!newPopup) {
			alert("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
		}
	};

	const handleBulkDelete = async () => {
		if (selectedStocks.length === 0) return;

		if (
			!confirm(`선택된 ${selectedStocks.length}개의 재고를 삭제하시겠습니까?`)
		) {
			return;
		}

		try {
			setLoading(true);

			// 모든 재고를 병렬로 삭제
			const deletePromises = selectedStocks.map((flowCode) =>
				stockApi.deleteStock(flowCode)
			);

			const responses = await Promise.all(deletePromises);

			// 성공/실패 개수 확인
			const successCount = responses.filter((res) => res.success).length;
			const failCount = responses.length - successCount;

			if (failCount === 0) {
				alert(`${successCount}개의 재고가 성공적으로 삭제되었습니다.`);
			} else {
				alert(
					`${successCount}개 성공, ${failCount}개 실패\n일부 재고 삭제에 실패했습니다.`
				);
			}

			// 목록 새로고침 및 선택 초기화
			await loadStocks(searchFilters, currentPage);
			setSelectedStocks([]);
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
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
			handleError(err, "StockPage");
		} finally {
			setLoading(false);
		}
	};

	// 바코드 출력 핸들러
	const handlePrintDeliveryBarcode = () => {
		printDeliveryBarcodes(selectedStocks);
	};

	const handlePrintProductBarcode = () => {
		printProductBarcodes(selectedStocks);
	};

	// 재고 데이터 로드 함수
	const loadStocks = useCallback(
		async (filters: typeof searchFilters, page: number = 1) => {
			setLoading(true);

			try {
				const response = await stockApi.getStocks(
					filters.start,
					filters.end,
					filters.search,
					filters.order_status,
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

					setStocks(content || []);
					setCurrentPage(page);
					setTotalPages(pageData.totalPages || 1);
					setTotalElements(pageData.totalElements || 0);

					return content;
				}
			} catch (err) {
				handleError(err);
				setStocks([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[] // eslint-disable-line react-hooks/exhaustive-deps
	);

	// 드롭다운 데이터 로드
	const fetchDropdownData = useCallback(async () => {
		setDropdownLoading(true);
		try {
			const factoryResponse = await stockApi.getFilterFactories(
				searchFilters.start,
				searchFilters.end,
				searchFilters.order_status || ""
			);
			if (factoryResponse.success && factoryResponse.data) {
				setFactories(factoryResponse.data);
			}

			const storeResponse = await stockApi.getFilterStores(
				searchFilters.start,
				searchFilters.end,
				searchFilters.order_status || ""
			);
			if (storeResponse.success && storeResponse.data) {
				setStores(storeResponse.data);
			}

			const setTypeResponse = await stockApi.getFilterSetTypes(
				searchFilters.start,
				searchFilters.end,
				searchFilters.order_status || ""
			);
			if (setTypeResponse.success && setTypeResponse.data) {
				setSetTypes(setTypeResponse.data);
			}

			const colorResponse = await stockApi.getFilterColors(
				searchFilters.start,
				searchFilters.end,
				searchFilters.order_status || ""
			);
			if (colorResponse.success && colorResponse.data) {
				setColors(colorResponse.data);
			}
		} catch (err) {
			handleError(err);
		} finally {
			setDropdownLoading(false);
		}
	}, [
		searchFilters.start,
		searchFilters.end,
		searchFilters.order_status,
		handleError,
	]);

	// 컬포넌트 마운트 시 초기 데이터 로드
	useEffect(() => {
		loadStocks(searchFilters, 1);
		fetchDropdownData();

		// 메시지 이벤트 리스너 등록
		const refreshData = () => {
			loadStocks(searchFilters, currentPage);
			setSelectedStocks([]);
		};

		onMessage("STOCK_CREATED", refreshData, 500);
		onMessage("STOCK_UPDATED", refreshData, 500);
		onMessage("STOCK_UPDATE_SUCCESS", refreshData, 500);
		onMessage("STOCK_REGISTERED", refreshData, 500);
		onMessage("SALES_REGISTERED", refreshData, 500);

		return () => {
			clearMessages();
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<div className="page">
				{/* 검색 영역 */}
				<StockSearch
					searchFilters={searchFilters}
					onFilterChange={handleFilterChange}
					onSearch={handleSearch}
					onReset={handleReset}
					onCreate={handleStockCreate}
					onExcel={handleExcelDownload}
					order_status={orderStatus}
					factories={factories}
					stores={stores}
					setTypes={setTypes}
					colors={colors}
					loading={loading}
					dropdownLoading={dropdownLoading}
					onStart={true}
				/>

				{/* 재고 목록 */}
				<div className="list">
					<StockList
						stocks={stocks}
						currentPage={currentPage}
						loading={loading}
						selected={selectedStocks}
						onSelect={handleSelectStock}
						onNoClick={handleStockNoClick}
						onSerialClick={handleSerialClick}
					/>
					{/* 벌크 액션 바 */}
					<StockBulkActionBar
						selectedCount={selectedStocks.length}
						onSalesRegister={handleSalesRegister}
						onRentalRegister={handleRentalRegister}
						onDelete={handleBulkDelete}
						onPrintProductBarcode={handlePrintProductBarcode}
						onPrintDeliveryBarcode={handlePrintDeliveryBarcode}
					/>
					{/* 페이지네이션 */}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={(page) => {
							setCurrentPage(page);
							loadStocks(searchFilters, page);
						}}
					/>
				</div>
			</div>
		</>
	);
};

export default StockPage;
