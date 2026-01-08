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
import {
	printDeliveryBarcode,
	printProductBarcode,
	type ProductBarcodeData,
} from "../../service/barcodePrintService";
import { useTenant } from "../../tenant/UserTenant";

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
	const { tenant } = useTenant();

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

	// 시세 추가 처리
	const handleAddMarketPrice = () => {
		if (selected.length === 0) {
			alert("시세를 추가할 판매 항목을 선택해주세요.");
			return;
		}

		// TODO: 시세 추가 로직 구현
		alert(`${selected.length}개 항목에 시세 추가 기능은 준비 중입니다.`);
	};

	// 시리얼번호 클릭 시 바코드 출력 확인
	const handleSerialClick = async (flowCode: string) => {
		if (!confirm("바코드를 출력하시겠습니까?")) {
			return;
		}

		const printerName = localStorage.getItem("preferred_printer_name");
		if (!printerName) {
			alert("프린터를 먼저 설정해주세요. (설정 > 바코드 프린터 설정)");
			return;
		}

		try {
			const sale = sales.find((s) => s.flowCode === flowCode);
			if (!sale) {
				alert("판매 정보를 찾을 수 없습니다.");
				return;
			}

			const barcodeData: ProductBarcodeData = {
				subdomain: tenant || "",
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

			await printDeliveryBarcode(printerName, barcodeData);
			alert("바코드가 출력되었습니다.");
		} catch (error) {
			console.error("바코드 출력 실패:", error);
			alert("바코드 출력에 실패했습니다.");
		}
	};

	// 바코드 출력 핸들러
	const handlePrintDeliveryBarcode = async () => {
		if (selected.length === 0) {
			alert("바코드를 출력할 판매를 선택해주세요.");
			return;
		}

		const printerName = localStorage.getItem("preferred_printer_name");
		if (!printerName) {
			alert("프린터를 먼저 설정해주세요. (설정 > 바코드 프린터 설정)");
			return;
		}

		try {
			for (const flowCode of selected) {
				const sale = sales.find((s) => s.flowCode.toString() === flowCode);
				if (!sale) continue;

				const barcodeData: ProductBarcodeData = {
					subdomain: tenant || "",
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

				await printDeliveryBarcode(printerName, barcodeData);
			}
			alert(`${selected.length}개의 바코드가 출력되었습니다.`);
		} catch (error) {
			console.error("바코드 출력 실패:", error);
			alert("바코드 출력에 실패했습니다.");
		}
	};

	const handlePrintProductBarcode = async () => {
		if (selected.length === 0) {
			alert("바코드를 출력할 판매를 선택해주세요.");
			return;
		}

		const printerName = localStorage.getItem("preferred_printer_name");
		if (!printerName) {
			alert("프린터를 먼저 설정해주세요. (설정 > 바코드 프린터 설정)");
			return;
		}

		try {
			for (const flowCode of selected) {
				const sale = sales.find((s) => s.flowCode.toString() === flowCode);
				if (!sale) continue;

				const barcodeData: ProductBarcodeData = {
					subdomain: tenant,
					productName: sale.productName || "",
					serialNumber: sale.flowCode || "",
				};

				await printProductBarcode(printerName, barcodeData);
			}
		} catch (error) {
			console.error("바코드 출력 실패:", error);
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
			selected.includes(sale.flowCode)
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
