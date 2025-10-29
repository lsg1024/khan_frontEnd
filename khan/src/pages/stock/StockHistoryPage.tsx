import { useState, useEffect, useCallback, useRef } from "react";
import { orderApi } from "../../../libs/api/order";
import { stockApi } from "../../../libs/api/stock";
import { getLocalDate } from "../../utils/dateUtils";
import type { StockResponse } from "../../types/stock";
import StockSearch from "../../components/common/stock/StockSearch";
import StockList from "../../components/common/stock/StockList";
import Pagination from "../../components/common/Pagination";
import { useErrorHandler } from "../../utils/errorHandler";
import type { SearchFilters } from "../../components/common/stock/StockSearch";
import "../../styles/pages/stock/StockPage.css";

export const StockHistoryPage = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
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

	const [selectedStocks, setSelectedStocks] = useState<string[]>([]);

	const stockUpdatePopups = useRef<Map<string, Window>>(new Map());

	// 검색 관련 상태
	const [searchFilters, setSearchFilters] = useState<SearchFilters>({
		search: "",
		start: "2025-01-01",
		end: getLocalDate(),
		order_status: "ALL",
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

	// No 클릭 시 상세보기 페이지 열기 (읽기 전용)
	const handleStockNoClick = (flowCode: string) => {
		const url = `/stocks/detail/${flowCode}`;
		const NAME = `stock_detail_${flowCode}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=350";
		const existingPopup = stockUpdatePopups.current.get(flowCode);

		if (existingPopup && !existingPopup.closed) {
			existingPopup.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				stockUpdatePopups.current.set(flowCode, newPopup);

				// 팝업 닫힘 감지
				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						clearInterval(checkClosed);
						stockUpdatePopups.current.delete(flowCode);
					}
				}, 1000);
			}
		}
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
			order_status: "ALL",
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
	};

	const handleExcelDownload = async () => {
		try {
			setLoading(true);
			setError("");
			const response = await orderApi.downloadOrdersExcel(
				searchFilters.start,
				searchFilters.end,
				"STOCK_HISTORY",
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
			let fileName = "재고이력.xlsx"; // 기본 파일명
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
		} catch {
			alert("엑셀 다운로드에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// 재고 이력 데이터 로드 함수
	const loadStocks = useCallback(
		async (filters: typeof searchFilters, page: number = 1) => {
			setLoading(true);
			setError("");

			try {
				// 모든 재고 이력을 가져오기 위해 order_status 필터 없이 호출
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
				handleError(err, setError);
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
			handleError(err, setError);
		} finally {
			setDropdownLoading(false);
		}
	}, [
		searchFilters.start,
		searchFilters.end,
		searchFilters.order_status,
		handleError,
	]);

	// 컴포넌트 마운트 시 초기 데이터 로드
	useEffect(() => {
		loadStocks(searchFilters, 1);
		fetchDropdownData();

		// 메시지 이벤트 리스너 등록 (상세보기 팝업 닫힘 감지용)
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			if (event.data.type === "STOCK_DETAIL_CLOSED") {
				loadStocks(searchFilters, currentPage);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

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

				{/* 검색 영역 */}
				<StockSearch
					searchFilters={searchFilters}
					onFilterChange={handleFilterChange}
					onSearch={handleSearch}
					onReset={handleReset}
					onCreate={undefined}
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

				{/* 재고 이력 목록 */}
				<div className="stock-list">
					<StockList
						stocks={stocks}
						currentPage={currentPage}
						loading={loading}
						selected={selectedStocks}
						onSelect={handleSelectStock}
						onNoClick={handleStockNoClick}
						showShippingAt={true}
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

export default StockHistoryPage;
