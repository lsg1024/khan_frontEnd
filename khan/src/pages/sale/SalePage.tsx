import { useState, useEffect, useCallback, useRef } from "react";
import { saleApi } from "../../../libs/api/sale";
import { getLocalDate } from "../../utils/dateUtils";
import type { SaleRow } from "../../types/sale";
import SaleSearch from "../../components/common/sale/SaleSearch";
import SaleList from "../../components/common/sale/SaleList";
import Pagination from "../../components/common/Pagination";
import { useErrorHandler } from "../../utils/errorHandler";
import type { SaleSearchFilters } from "../../components/common/sale/SaleSearch";
import SaleBulkActionBar from "../../components/common/sale/SaleBulkActionBar";
import "../../styles/pages/sale/SalePage.css";

export const SalePage = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [sales, setSales] = useState<SaleRow[]>([]);
	const [selected, setSelected] = useState<string[]>([]);
	const saleCreatePopup = useRef<Window | null>(null);
	const { handleError } = useErrorHandler();

	const saleDetailPopups = useRef<Map<string, Window>>(new Map());

	// 검색 관련 상태
	const [searchFilters, setSearchFilters] = useState<SaleSearchFilters>({
		search: "",
		start: getLocalDate(),
		end: getLocalDate(),
		type: "",
	});

	// 검색 필터 변경 핸들러
	const handleFilterChange = <K extends keyof SaleSearchFilters>(
		field: K,
		value: SaleSearchFilters[K]
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));

		// start 선택 시 end 자동 보정 (문자열 날짜 비교)
		if (field === "start" && (value as string) > prevEnd()) {
			setSearchFilters((prev) => ({ ...prev, end: value as string }));
		}
	};

	const prevEnd = () => searchFilters.end;

	// 체크박스 선택 핸들러
	const handleSelect = (saleCode: string, checked: boolean) => {
		if (checked) {
			setSelected((prev) => [...prev, saleCode]);
		} else {
			setSelected((prev) => prev.filter((code) => code !== saleCode));
		}
	};

	// No 클릭 시 상세보기 페이지 열기 (읽기 전용)
	const handleSaleNoClick = (flowCode: string, orderStatus: string) => {
		const url = `/sales/detail/${orderStatus}/${flowCode}`;
		const NAME = `sale_detail_${flowCode}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=500";
		const existingPopup = saleDetailPopups.current.get(flowCode);

		if (existingPopup && !existingPopup.closed) {
			existingPopup.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				saleDetailPopups.current.set(flowCode, newPopup);

				// 팝업 닫힘 감지
				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						clearInterval(checkClosed);
						saleDetailPopups.current.delete(flowCode);
					}
				}, 1000);
			}
		}
	};

	// 검색 실행
	const handleSearch = () => {
		setCurrentPage(1);
		setSelected([]);
		loadSales(searchFilters, 1);
	};

	// 판매 생성
	const handleSaleCreate = () => {
		const url = "/sales/create";
		const NAME = "saleCreateWindow";
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=800";

		if (saleCreatePopup.current && !saleCreatePopup.current.closed) {
			saleCreatePopup.current.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				saleCreatePopup.current = newPopup;

				// 팝업 닫힘 감지를 위한 인터벌 설정 (참조 정리만 수행)
				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						clearInterval(checkClosed);
						saleCreatePopup.current = null;
					}
				}, 1000);
			}
		}
	};

	// 검색 초기화
	const handleReset = () => {
		const resetFilters: SaleSearchFilters = {
			search: "",
			start: getLocalDate(),
			end: getLocalDate(),
			type: "",
		};
		setSearchFilters(resetFilters);
		setCurrentPage(1);
		setSelected([]);
		loadSales(resetFilters, 1);
	};

	const handleExcelDownload = async () => {
		try {
			setLoading(true);
			setError("");
			alert("엑셀 다운로드 기능은 준비 중입니다.");
		} catch {
			alert("엑셀 다운로드에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// 반품 처리
	const handleReturn = async () => {
		if (selected.length === 0) {
			alert("반품할 판매 항목을 선택해주세요.");
			return;
		}

		const confirmMessage = `선택한 ${selected.length}개의 판매 항목을 반품 처리하시겠습니까?`;
		if (!confirm(confirmMessage)) {
			return;
		}

		try {
			setLoading(true);
			setError("");

			// 선택된 saleCode로 판매 데이터 찾기
			const selectedSales = sales.filter((sale) =>
				selected.includes(sale.saleCode)
			);

			// 각 판매 항목에 대해 반품 처리
			const results = await Promise.all(
				selectedSales.map(async (sale) => {
					try {
						const response = await saleApi.deleteSale(
							sale.saleType,
							parseInt(sale.saleCode),
							parseInt(sale.flowCode)
						);
						return { success: response.success, saleCode: sale.saleCode };
					} catch (error) {
						console.error(`반품 실패 (${sale.saleCode}):`, error);
						return { success: false, saleCode: sale.saleCode };
					}
				})
			);

			// 결과 확인
			const failedItems = results.filter((r) => !r.success);

			if (failedItems.length === 0) {
				alert("반품 처리가 완료되었습니다.");
				setSelected([]);
				loadSales(searchFilters, currentPage);
			} else {
				const failedCodes = failedItems.map((item) => item.saleCode).join(", ");
				alert(
					`일부 항목의 반품 처리에 실패했습니다: ${failedCodes}\n성공한 항목만 반품 처리되었습니다.`
				);
				setSelected([]);
				loadSales(searchFilters, currentPage);
			}
		} catch (err) {
			handleError(err);
			alert("반품 처리 중 오류가 발생했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// 판매 데이터 로드 함수
	const loadSales = useCallback(
		async (filters: typeof searchFilters, page: number = 1) => {
			setLoading(true);
			setError("");

			try {
				const response = await saleApi.getSaleResponse(
					filters.start,
					filters.end,
					filters.search,
					filters.type,
					page
				);

				if (response.success && response.data) {
					const pageData = response.data.page || {};
					const content = response.data.content || [];

					setSales(content || []);
					setCurrentPage(page);
					setTotalPages(pageData.totalPages || 1);
					setTotalElements(pageData.totalElements || 0);

					return content;
				} else {
					// response.data가 없는 경우 빈 배열로 초기화
					setSales([]);
					setCurrentPage(1);
					setTotalPages(0);
					setTotalElements(0);
				}
			} catch (err) {
				handleError(err);
				setSales([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[] // eslint-disable-line react-hooks/exhaustive-deps
	);

	// 컴포넌트 마운트 시 초기 데이터 로드
	useEffect(() => {
		loadSales(searchFilters, 1);

		// 메시지 이벤트 리스너 등록 (상세보기 팝업 닫힘 감지용)
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			if (event.data.type === "SALE_DETAIL_CLOSED") {
				loadSales(searchFilters, currentPage);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
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
				<SaleSearch
					searchFilters={searchFilters}
					onFilterChange={handleFilterChange}
					onSearch={handleSearch}
					onReset={handleReset}
					onCreate={handleSaleCreate}
					onExcel={handleExcelDownload}
					loading={loading}
				/>

				{/* 판매 목록 */}
				<div className="list">
					<SaleList
						sales={sales}
						currentPage={currentPage}
						loading={loading}
						selected={selected}
						onSelect={handleSelect}
						onNoClick={handleSaleNoClick}
					/>

					<SaleBulkActionBar
						selectedCount={selected.length}
						onReturn={handleReturn}
					/>

					{/* 페이지네이션 */}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={(page) => {
							setCurrentPage(page);
							loadSales(searchFilters, page);
						}}
					/>
				</div>
			</div>
		</>
	);
};

export default SalePage;
