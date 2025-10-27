import { useState, useEffect, useCallback, useRef } from "react";
import { orderApi } from "../../../libs/api/order";
import { stockApi } from "../../../libs/api/stock";
import { getLocalDate } from "../../utils/dateUtils";
import type { StockResponse } from "../../types/stock";
import StockSearch from "../../components/common/stock/StockSearch";
import StockList from "../../components/common/stock/StockList";
import Pagination from "../../components/common/Pagination";
import StockBulkActionBar from "../../components/common/StockBulkActionBar";
import { useErrorHandler } from "../../utils/errorHandler";
import type { SearchFilters } from "../../components/common/stock/StockSearch";
import "../../styles/pages/StockPage.css";

export const StockPage = () => {
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

	// 체크박스 선택 관련 상태 (다중 선택 허용)
	const [selectedStocks, setSelectedStocks] = useState<string[]>([]);

	const stockCreationPopup = useRef<Window | null>(null);
	const stockUpdatePopups = useRef<Map<string, Window>>(new Map());

	// 검색 관련 상태
	const [searchFilters, setSearchFilters] = useState<SearchFilters>({
		search: "",
		start: getLocalDate(),
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
		const url = `/stocks/update/${flowCode}`;
		const NAME = `stock_update_${flowCode}`;
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
			start: getLocalDate(),
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
	};

	const handleStockCreate = () => {
		const url = "/stocks/create/normal"; // stock mode 파라미터 추가
		const NAME = "stockCreatePopup";
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=800";

		if (stockCreationPopup.current && !stockCreationPopup.current.closed) {
			stockCreationPopup.current.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);

			if (newPopup) {
				stockCreationPopup.current = newPopup;

				// 팝업 닫힘 감지를 위한 인터벌 설정 (참조 정리만 수행)
				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						// 참조만 정리하고 새로고침은 메시지 이벤트에서만 처리
						clearInterval(checkClosed);
						stockCreationPopup.current = null;
					}
				}, 1000);
			} else {
				alert("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
			}
		}
	};

	// 벌크 액션 핸들러들
	const handleSalesRegister = () => {
		if (selectedStocks.length === 0) return;

		const selectedFlowCodes = selectedStocks.join(",");
		const url = `/stocks/register?action=sales&flowCodes=${selectedFlowCodes}`;
		const NAME = `stockSalesRegister_${Date.now()}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=800";

		const newPopup = window.open(url, NAME, FEATURES);
		if (!newPopup) {
			alert("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
		}
	};

	const handleRentalRegister = () => {
		if (selectedStocks.length === 0) return;

		const selectedFlowCodes = selectedStocks.join(",");
		const url = `/stocks/register?action=rental&flowCodes=${selectedFlowCodes}`;
		const NAME = `stockRentalRegister_${Date.now()}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=800";

		const newPopup = window.open(url, NAME, FEATURES);
		if (!newPopup) {
			alert("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
		}
	};

	const handleReturnRegister = () => {
		if (selectedStocks.length === 0) return;

		const selectedFlowCodes = selectedStocks.join(",");
		const url = `/stocks/register?action=return&flowCodes=${selectedFlowCodes}`;
		const NAME = `stockReturnRegister_${Date.now()}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=800";

		const newPopup = window.open(url, NAME, FEATURES);
		if (!newPopup) {
			alert("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
		}
	};

	const handleBulkDelete = () => {
		if (selectedStocks.length === 0) return;

		if (
			confirm(`선택된 ${selectedStocks.length}개의 재고를 삭제하시겠습니까?`)
		) {
			// TODO: API 호출로 삭제 처리
			console.log("삭제할 재고:", selectedStocks);
			alert("삭제 기능은 아직 구현되지 않았습니다.");
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
		} catch {
			alert("엑셀 다운로드에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// 재고 데이터 로드 함수
	const loadStocks = useCallback(
		async (filters: typeof searchFilters, page: number = 1) => {
			setLoading(true);
			setError("");

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

	// 컬포넌트 마운트 시 초기 데이터 로드
	useEffect(() => {
		loadStocks(searchFilters, 1);
		fetchDropdownData();

		// 메시지 이벤트 리스너 등록
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			if (event.data.type === "STOCK_CREATED") {
				loadStocks(searchFilters, currentPage);
				setSelectedStocks([]); // 선택 초기화
			}

			if (event.data.type === "STOCK_UPDATED") {
				loadStocks(searchFilters, currentPage);
				setSelectedStocks([]); // 선택 초기화
			}

			if (event.data.type === "STOCK_UPDATE_SUCCESS") {
				loadStocks(searchFilters, currentPage);
				setSelectedStocks([]); // 선택 초기화
			}

			if (event.data.type === "STOCK_REGISTERED") {
				loadStocks(searchFilters, currentPage);
				setSelectedStocks([]); // 선택 초기화
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			{/* 주문, 수리, 대여, 반품 */}
			{/* 상세 페이지는 order의 update page 공유 */}
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
				<div className="stock-list">
					<StockList
						stocks={stocks}
						currentPage={currentPage}
						loading={loading}
						selected={selectedStocks}
						onSelect={handleSelectStock}
						onNoClick={handleStockNoClick}
					/>

					{/* 벌크 액션 바 */}
					<StockBulkActionBar
						selectedCount={selectedStocks.length}
						onSalesRegister={handleSalesRegister}
						onRentalRegister={handleRentalRegister}
						onReturnRegister={handleReturnRegister}
						onDelete={handleBulkDelete}
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
