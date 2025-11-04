import { useState, useEffect, useCallback, useRef } from "react";
import { saleApi } from "../../../libs/api/sale";
import { getLocalDate } from "../../utils/dateUtils";
import type { SaleRow } from "../../types/sale";
import SaleSearch from "../../components/common/sale/SaleSearch";
import SaleList from "../../components/common/sale/SaleList";
import Pagination from "../../components/common/Pagination";
import { useErrorHandler } from "../../utils/errorHandler";
import type { SaleSearchFilters } from "../../components/common/sale/SaleSearch";
import "../../styles/pages/sale/SalePage.css";

export const SalePage = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [sales, setSales] = useState<SaleRow[]>([]);
	const [selected, setSelected] = useState<number[]>([]);
	const saleCreatePopup = useRef<Window | null>(null);
	const { handleError } = useErrorHandler();

	const saleDetailPopups = useRef<Map<number, Window>>(new Map());

	// 검색 관련 상태
	const [searchFilters, setSearchFilters] = useState<SaleSearchFilters>({
		search: "",
		start: "2025-01-01",
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
	const handleSelect = (saleCode: number, checked: boolean) => {
		if (checked) {
			setSelected((prev) => [...prev, saleCode]);
		} else {
			setSelected((prev) => prev.filter((code) => code !== saleCode));
		}
	};

	// No 클릭 시 상세보기 페이지 열기 (읽기 전용)
	const handleSaleNoClick = (flowCode: number) => {
		const url = `/stocks/detail/${flowCode}`;
		const NAME = `sale_detail_${flowCode}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=350";
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
			start: "2025-01-01",
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
				handleError(err, setError);
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
			<div className="sale-page">
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
				<div className="sale-list">
					<SaleList
						sales={sales}
						currentPage={currentPage}
						loading={loading}
						selected={selected}
						onSelect={handleSelect}
						onNoClick={handleSaleNoClick}
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
