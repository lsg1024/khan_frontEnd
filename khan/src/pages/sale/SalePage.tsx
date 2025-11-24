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

	// 한글 판매 타입을 영어 enum으로 변환
	const convertSaleTypeToEnum = (saleType: string): string => {
		const typeMap: Record<string, string> = {
			판매: "SALE",
			반품: "RETURN",
			결제: "PAYMENT",
			DC: "DISCOUNT",
			통장: "PAYMENT_TO_BANK",
			WG: "WG",
		};
		// 이미 영어 enum인 경우 그대로 반환, 한글인 경우 매핑
		return typeMap[saleType] || saleType;
	};

	// 체크박스 선택 핸들러 (동일 거래처만 중복 선택 가능)
	const handleSelect = (saleCode: string, checked: boolean) => {
		if (checked) {
			// 첫 선택이거나 동일 거래처인 경우만 추가
			const selectedSale = sales.find((sale) => sale.saleCode === saleCode);
			if (!selectedSale) return;

			if (selected.length === 0) {
				// 첫 선택
				setSelected([saleCode]);
			} else {
				// 기존 선택된 항목의 거래처 확인
				const firstSelectedSale = sales.find(
					(sale) => sale.saleCode === selected[0]
				);
				if (
					firstSelectedSale &&
					selectedSale.storeName === firstSelectedSale.storeName
				) {
					// 동일 거래처
					setSelected((prev) => [...prev, saleCode]);
				} else {
					// 다른 거래처
					alert(
						`동일한 거래처(${firstSelectedSale?.storeName})의 항목만 선택할 수 있습니다.`
					);
				}
			}
		} else {
			setSelected((prev) => prev.filter((code) => code !== saleCode));
		}
	};

	// No 클릭 시 상세보기 페이지 열기
	const handleSaleNoClick = (flowCode: string, orderStatus: string) => {
		const enumStatus = convertSaleTypeToEnum(orderStatus);
		const url = `/sales/detail/${enumStatus}/${flowCode}`;
		const NAME = `sale_detail_${flowCode}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=500";
		const existingPopup = saleDetailPopups.current.get(flowCode);

		if (existingPopup && !existingPopup.closed) {
			existingPopup.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				saleDetailPopups.current.set(flowCode, newPopup);

				// 팝업 닫힘 감지 (메시지로 저장 여부 확인)
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

	// 반품 처리 - SaleDetailPage 팝업으로 열기
	const handleReturn = () => {
		if (selected.length === 0) {
			alert("반품할 판매 항목을 선택해주세요.");
			return;
		}

		// 선택된 판매 항목들의 flowCode, saleType, storeId 가져오기
		const selectedSales = sales.filter((sale) =>
			selected.includes(sale.saleCode)
		);

		// 선택된 항목들의 정보를 URL 파라미터로 변환
		const salesData = selectedSales.map((sale) => ({
			flowCode: sale.flowCode,
			orderStatus: convertSaleTypeToEnum(sale.saleType),
			storeId: sale.storeId,
		}));

		const queryParams = salesData
			.map(
				(data) =>
					`flowCode=${encodeURIComponent(
						data.flowCode
					)}&orderStatus=${encodeURIComponent(data.orderStatus)}`
			)
			.join("&");

		const storeIdParam =
			salesData.length > 0
				? `&storeId=${encodeURIComponent(salesData[0].storeId)}`
				: "";

		const url = `/sales/detail/bulk?${queryParams}${storeIdParam}`;
		const NAME = "sale_return_bulk";
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=800";

		const existingPopup = saleDetailPopups.current.get("bulk_return");

		if (existingPopup && !existingPopup.closed) {
			existingPopup.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				saleDetailPopups.current.set("bulk_return", newPopup);

				// 팝업 닫힘 감지 (메시지로 저장 여부 확인)
				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						clearInterval(checkClosed);
						saleDetailPopups.current.delete("bulk_return");
					}
				}, 1000);
			}
		}

		// 선택 해제
		setSelected([]);
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

		// 메시지 이벤트 리스너 등록 (상세보기 팝업에서 저장 완료 시 새로고침)
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			// 저장이 완료된 경우에만 새로고침
			if (event.data.type === "SALE_SAVED") {
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
