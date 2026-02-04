import { useState, useEffect, useCallback } from "react";
import { saleApi } from "../../../libs/api/saleApi";
import { getLocalDate } from "../../utils/dateUtils";
import type { SaleRow } from "../../types/saleDto";
import SaleSearch from "../../components/common/sale/SaleSearch";
import SaleList from "../../components/common/sale/SaleList";
import Pagination from "../../components/common/Pagination";
import { useErrorHandler } from "../../utils/errorHandler";
import type { SaleSearchFilters } from "../../components/common/sale/SaleSearch";
import SaleBulkActionBar from "../../components/common/sale/SaleBulkActionBar";
import "../../styles/pages/sale/SalePage.css";
import { usePopupManager } from "../../hooks/usePopupManager";
import { useBarcodeHandler } from "../../hooks/useBarcodeHandler";
import { useWindowMessage } from "../../hooks/useWindowMessage";
import {
	openSaleCreatePopup,
	openSaleDetailPopup,
} from "../../utils/popupUtils";

export const SalePage = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [sales, setSales] = useState<SaleRow[]>([]);
	const [selected, setSelected] = useState<string[]>([]);
	const { handleError } = useErrorHandler();

	// 팝업 관리
	const { openSinglePopup, openMultiPopup } = usePopupManager();

	// 바코드 출력
	const { printDeliveryBarcodes, printProductBarcodes } = useBarcodeHandler({
		items: sales as unknown as { flowCode: string }[],
		dataMapper: (item, subdomain) => {
			const sale = item as unknown as SaleRow;
			return {
				subdomain,
				productName: sale.productName || "",
				material: sale.materialName || "",
				color: sale.colorName || "",
				weight: sale.pureGoldWeight?.toString() || "",
				size: "",
				assistantStoneName: sale.assistantName || "",
				mainStoneMemo: "",
				assistantStoneMemo: "",
				serialNumber: sale.flowCode || "",
			};
		},
	});

	// 윈도우 메시지 통신
	const { on: onMessage, clear: clearMessages } = useWindowMessage();

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

	// 체크박스 선택 핸들러 (동일 거래처 + 동일 거래번호만 중복 선택 가능)
	const handleSelect = (flowCode: string, checked: boolean) => {
		if (checked) {
			// 첫 선택이거나 동일 거래처 + 동일 거래번호인 경우만 추가
			const selectedSale = sales.find((sale) => sale.flowCode === flowCode);
			if (!selectedSale) {
				return;
			}

			if (selected.length === 0) {
				// 첫 선택
				setSelected([flowCode]);
			} else {
				// 기존 선택된 항목의 거래처 및 거래번호 확인
				const firstSelectedSale = sales.find(
					(sale) => sale.flowCode === selected[0]
				);

				if (
					firstSelectedSale &&
					selectedSale.storeName === firstSelectedSale.storeName &&
					selectedSale.saleCode === firstSelectedSale.saleCode
				) {
					// 동일 거래처 + 동일 거래번호
					setSelected((prev) => [...prev, flowCode]);
				} else {
					// 다른 거래처 또는 다른 거래번호
					alert(
						`동일한 거래처(${firstSelectedSale?.storeName})와 거래번호(${firstSelectedSale?.saleCode})의 항목만 선택할 수 있습니다.`
					);
				}
			}
		} else {
			setSelected((prev) => prev.filter((code) => code !== flowCode));
		}
	};

	// No 클릭 시 상세보기 페이지 열기
	const handleSaleNoClick = (flowCode: string, orderStatus: string) => {
		const enumStatus = convertSaleTypeToEnum(orderStatus);
		openMultiPopup(flowCode, () => openSaleDetailPopup(enumStatus, flowCode));
	};

	// 검색 실행
	const handleSearch = () => {
		setCurrentPage(1);
		setSelected([]);
		loadSales(searchFilters, 1);
	};

	// 판매 생성
	const handleSaleCreate = () => {
		openSinglePopup(() => openSaleCreatePopup());
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
			const response = await saleApi.downloadSalesExcel(
				searchFilters.start,
				searchFilters.end,
				searchFilters.search,
				searchFilters.type
			);

			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
			link.setAttribute("download", `판매내역_${today}.xlsx`);
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

	// 시세 추가 처리
	const handleAddMarketPrice = async () => {
		if (selected.length === 0) {
			alert("시세를 추가할 판매 항목을 선택해주세요.");
			return;
		}

		try {
			// 선택된 판매 항목들의 saleCode 가져오기 (동일한 saleCode를 가진 항목만 선택 가능)
			const selectedSale = sales.find((sale) => sale.flowCode === selected[0]);
			if (!selectedSale || !selectedSale.saleCode) {
				alert("판매 정보를 찾을 수 없습니다.");
				return;
			}

			const saleCode = selectedSale.saleCode;

			// 시세가 이미 존재하는지 확인
			const goldPrice = await saleApi.checkSaleGoldPrice(saleCode);
			if (goldPrice.success && goldPrice.data) {
				if (goldPrice.data.goldPrice !== 0) {
					if (!confirm("시세가 이미 존재합니다. 변경하시겠습니까?")) {
						return;
					}
				}
			}

			// 시세 추가/변경 팝업 열기
			const url = `/sales/wg-price/${saleCode}/${goldPrice.data}`;
			const NAME = `wg_price_${saleCode}`;
			const FEATURES = "resizable=yes,scrollbars=yes,width=600,height=500";
			const popup = window.open(url, NAME, FEATURES);

			if (popup) {
				// 팝업에서 시세가 설정되면 새로고침
				const checkClosed = setInterval(() => {
					if (popup.closed) {
						clearInterval(checkClosed);
						loadSales(searchFilters, currentPage);
					}
				}, 1000);
			}
		} catch (error) {
			handleError(error);
		}
	};

	// 시리얼번호 클릭 시 바코드 출력 확인
	const handleSerialClick = (flowCode: string) => {
		if (!confirm("바코드를 출력하시겠습니까?")) {
			return;
		}
		printDeliveryBarcodes([flowCode]);
	};

	// 바코드 출력 핸들러
	const handlePrintDeliveryBarcode = () => {
		printDeliveryBarcodes(selected);
	};

	const handlePrintProductBarcode = () => {
		printProductBarcodes(selected);
	};

	// 반품 처리 - SaleDetailPage 팝업으로 열기
	const handleReturn = () => {
		if (selected.length === 0) {
			alert("반품할 판매 항목을 선택해주세요.");
			return;
		}

		// 선택된 판매 항목들의 flowCode, saleType, storeId 가져오기
		const selectedSales = sales.filter((sale) =>
			selected.includes(sale.flowCode)
		);

		// 선택된 항목들의 정보를 URL 파라미터로 변환
		const salesData = selectedSales.map((sale) => ({
			flowCode: sale.flowCode,
			saleCode: sale.saleCode,
			orderStatus: convertSaleTypeToEnum(sale.saleType),
			storeId: sale.storeId,
		}));

		const queryParams = salesData
			.map(
				(data) =>
					`flowCode=${encodeURIComponent(
						data.flowCode
					)}&saleCode=${encodeURIComponent(
						data.saleCode
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

		openMultiPopup("bulk_return", () => window.open(url, NAME, FEATURES));

		// 선택 해제
		setSelected([]);
	};

	// 판매 데이터 로드 함수
	const loadSales = useCallback(
		async (filters: typeof searchFilters, page: number = 1) => {
			setLoading(true);

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
		const refreshData = () => {
			loadSales(searchFilters, currentPage);
		};

		onMessage("SALE_SAVED", refreshData, 500);
		onMessage("SALES_REGISTERED", refreshData, 500);

		return () => {
			clearMessages();
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<>
			<div className="page">
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
						onSerialClick={handleSerialClick}
					/>

					<SaleBulkActionBar
						selectedCount={selected.length}
						onReturn={handleReturn}
						onAddMarketPrice={handleAddMarketPrice}
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
							loadSales(searchFilters, page);
						}}
					/>
				</div>
			</div>
		</>
	);
};

export default SalePage;
