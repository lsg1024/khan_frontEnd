import { useState, useEffect, useCallback, useRef } from "react";
import Pagination from "../../components/common/Pagination";
import BulkActionBar from "../../components/common/BulkActionBar";
import OrderSearch from "../../hooks/OrderSearch";
import { useErrorHandler } from "../../utils/errorHandler";
import { fixApi } from "../../../libs/api/fix";
import { orderApi } from "../../../libs/api/order";
import FactorySearch from "../../components/common/factory/FactorySearch";
import type { FactorySearchDto } from "../../types/factory";
import type { OrderDto } from "../../types/order";
import { getLocalDate, formatToLocalDate } from "../../utils/dateUtils";
import "../../styles/pages/OrderPage.css";

export const FixPage = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [fixes, setFixes] = useState<OrderDto[]>([]); // 수리 데이터 상태
	const [selectedFix, setSelectedFix] = useState<string>(""); // 수리 선택으로 변경
	const [factories, setFactories] = useState<string[]>([]);
	const [stores, setStores] = useState<string[]>([]);
	const [setTypes, setSetTypes] = useState<string[]>([]);
	const [dropdownLoading, setDropdownLoading] = useState(false);
	const { handleError } = useErrorHandler();

	// 제조사 변경 관련 상태
	const [isFactorySearchOpen, setIsFactorySearchOpen] = useState(false);
	const [selectedFixForFactory, setSelectedFixForFactory] =
		useState<string>("");

	// 체크박스 선택 관련 상태 (단일 선택만 허용)
	const orderCreationPopup = useRef<Window | null>(null);
	const orderUpdatePopups = useRef<Map<string, Window>>(new Map());

	// 검색 관련 상태
	const [searchFilters, setSearchFilters] = useState({
		search: "",
		start: getLocalDate(),
		end: getLocalDate(),
		factory: "",
		store: "",
		setType: "",
	});

	// 검색 필터 변경 핸들러
	const handleFilterChange = (
		field: keyof typeof searchFilters,
		value: string
	) => {
		setSearchFilters((prev) => ({ ...prev, [field]: value }));

		if (field === "start" && value > searchFilters.end) {
			setSearchFilters((prev) => ({ ...prev, end: value }));
		}
	};

	// 주문 데이터 로드 함수
	const loadFixes = useCallback(
		async (filters: typeof searchFilters, page: number = 1) => {
			setLoading(true);
			setError("");

			// 페이지 변경 시 선택 상태 초기화
			setSelectedFix("");
			try {
				const response = await fixApi.getFixes(
					filters.start,
					filters.end,
					"FIX",
					filters.search,
					filters.factory,
					filters.store,
					filters.setType,
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
				handleError(err, setError);
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

	// 검색 실행
	const handleSearch = () => {
		setCurrentPage(1);
		loadFixes(searchFilters, 1);
	};

	// 검색 초기화
	const handleReset = () => {
		const resetFilters = {
			search: "",
			start: getLocalDate(),
			end: getLocalDate(),
			factory: "",
			store: "",
			setType: "",
		};
		setSearchFilters(resetFilters);
		setCurrentPage(1);
		loadFixes(resetFilters, 1);
	};

	const handleFixCreate = () => {
		// 수리 생성 팝업 - order_type=FIX 파라미터로 수리 주문 생성
		const url = "/orders/create?order_type=FIX";
		const NAME = "fixCreatePopup";
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=800";

		if (orderCreationPopup.current && !orderCreationPopup.current.closed) {
			orderCreationPopup.current.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				orderCreationPopup.current = newPopup;
			}
		}
	};

	// 체크박스 관련 핸들러 (단일 선택)
	const handleSelectFix = (flowCode: string, checked: boolean) => {
		if (checked) {
			// 다른 체크박스가 선택되어 있으면 해제하고 새로운 것 선택
			setSelectedFix(flowCode);
		} else {
			// 선택 해제
			setSelectedFix("");
		}
	};

	// 대량 작업 핸들러 (단일 선택)
	const handleStockRegister = () => {
		if (selectedFix) {
			console.log("재고등록 대상:", selectedFix);
			// TODO: 재고등록 API 호출
			alert(`선택된 수리를 재고등록 처리합니다.`);
		}
	};

	const handleSalesRegister = () => {
		if (selectedFix) {
			console.log("판매등록 대상:", selectedFix);
			// TODO: 판매등록 API 호출
			alert(`선택된 수리를 판매등록 처리합니다.`);
		}
	};

	const handleBulkDelete = () => {
		if (selectedFix) {
			if (window.confirm(`선택된 수리를 삭제하시겠습니까?`)) {
				console.log("삭제 대상:", selectedFix);
				// TODO: 삭제 API 호출
				alert(`선택된 수리를 삭제 처리합니다.`);
				setSelectedFix("");
			}
		}
	};

	// 수리 상세 페이지로 이동
	const handleFixClick = (flowCode: string) => {
		const fixData = fixes.find((fix) => fix.flowCode === flowCode);

		if (fixData?.imagePath) {
			sessionStorage.setItem("tempImagePath", fixData.imagePath);
		}

		const url = `/orders/update/fix/${flowCode}`;
		const NAME = `fixUpdate_${flowCode}`;
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

	// 수리 상태 변경
	const handleStatusChange = async (flowCode: string, newStatus: string) => {
		const confirmMessage = `수리 상태를 "${newStatus}"로 변경하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);
				await orderApi.updateOrderStatus(flowCode, newStatus);
				alert("수리 상태가 성공적으로 변경되었습니다.");
				await loadFixes(searchFilters, currentPage);
			} catch (err) {
				handleError(err, setError);
				alert("수리 상태 변경에 실패했습니다.");
			} finally {
				setLoading(false);
			}
		}
	};

	// 제조사 클릭 핸들러
	const handleFactoryClick = (flowCode: string) => {
		if (window.confirm("공장을 변경하시겠습니까?")) {
			setSelectedFixForFactory(flowCode);
			console.log("Selected Order for Factory bf:", isFactorySearchOpen);
			setIsFactorySearchOpen(true);
			console.log("Selected Order for Factory af:", isFactorySearchOpen);
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

				alert("제조사가 성공적으로 변경되었습니다.");

				// 현재 페이지 데이터 새로고침
				await loadFixes(searchFilters, currentPage);

				// 팝업 상태 정리
				setIsFactorySearchOpen(false);
				setSelectedFixForFactory("");
			} catch (err) {
				handleError(err, setError);
				alert("제조사 변경에 실패했습니다.");
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
		} catch (err) {
			console.error("드롭다운 데이터 로드 실패:", err);
		} finally {
			setDropdownLoading(false);
		}
	};

	useEffect(() => {
		const initializeData = async () => {
			setCurrentPage(1);
			setError("");

			await Promise.all([loadFixes(searchFilters, 1), fetchDropdownData()]);
		};

		const creationPopupRef = orderCreationPopup;
		const updatePopupsRef = orderUpdatePopups;

		initializeData();

		return () => {
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
				<OrderSearch
					searchFilters={searchFilters}
					onFilterChange={handleFilterChange}
					onSearch={handleSearch}
					onReset={handleReset}
					onCreate={handleFixCreate}
					factories={factories}
					stores={stores}
					setTypes={setTypes}
					loading={loading}
					dropdownLoading={dropdownLoading}
				/>

				{/* 수리 목록 */}
				<div className="order-list">
					{fixes.length === 0 ? (
						<div className="no-data-order">
							<p>조회된 수리가 없습니다.</p>
						</div>
					) : (
						<table className="order-table">
							<thead>
								<tr>
									<th>선택</th>
									<th>No</th>
									<th>상품명</th>
									<th>주문/출고</th>
									<th>판매처</th>
									<th>이미지</th>
									<th>재질/색상</th>
									<th>메인/보조</th>
									<th>사이즈</th>
									<th>세트타입</th>
									<th>재고</th>
									<th>급</th>
									<th>비고</th>
									<th>상품상태</th>
									<th>제조사</th>
								</tr>
							</thead>
							<tbody>
								{fixes.map((fix, index) => (
									<tr
										key={fix.flowCode}
										className={
											selectedFix === fix.flowCode ? "selected-row" : ""
										}
									>
										<td>
											<input
												type="checkbox"
												checked={selectedFix === fix.flowCode}
												onChange={(e) =>
													handleSelectFix(fix.flowCode, e.target.checked)
												}
											/>
										</td>
										<td>
											<button
												className="order-no-btn"
												onClick={() => handleFixClick(fix.flowCode)}
											>
												{(currentPage - 1) * 16 + index + 1}
											</button>
										</td>
										<td className="product-name-order">{fix.productName}</td>
										<td className="info-cell">
											{/* << MODIFIED */}
											<div className="info-row-order">
												<span className="info-value">
													{formatToLocalDate(fix.createAt)}
												</span>
											</div>
											<div className="info-row-order">
												<span className="info-value-expect">
													{formatToLocalDate(fix.shippingAt)}
												</span>
											</div>
										</td>
										<td>{fix.storeName}</td>
										<th className="image-cell-order">
											<img
												className="order-image"
												src={
													fix.imagePath
														? `/@fs/C:/Users/zks14/Desktop/multi_module/product-service/src/main/resources${fix.imagePath}`
														: "/images/not_ready.png"
												}
												alt={fix.productName}
												onError={(e) => {
													e.currentTarget.src = "/images/not_ready.png";
												}}
											/>
										</th>
										<td className="info-cell">
											<div className="info-row-order">
												<span className="info-label"></span>
												<span
													className={`info-value ${
														fix.materialName === "18K" ? "highlight-18k" : ""
													}`}
												>
													{fix.materialName}
												</span>
											</div>
											<div className="info-row-order">
												<span className="info-label"></span>
												<span className="info-value">{fix.colorName}</span>
											</div>
										</td>
										<td className="info-cell">
											{" "}
											{/* << MODIFIED */}
											<div className="info-row-order">
												<span className="info-value-stone-note">
													{fix.orderMainStoneNote}
												</span>
											</div>
											<div className="info-row-order">
												<span className="info-value-stone-note">
													{fix.orderAssistanceStoneNote}
												</span>
											</div>
										</td>
										<td>{fix.productSize}</td>
										<td>{fix.setType}</td>
										<td>{fix.stockQuantity}</td>
										<td>
											<span className={`priority-badge-order ${fix.priority}`}>
												{fix.priority}
											</span>
										</td>
										<td className="note-cell-order">{fix.orderNote}</td>
										<td>
											<select
												className="status-dropdown-order"
												value={fix.productStatus}
												onChange={(e) =>
													handleStatusChange(fix.flowCode, e.target.value)
												}
												disabled={loading}
											>
												<option value="접수">접수</option>
												<option value="대기">대기</option>
											</select>
										</td>
										<td>
											<button
												className="factory-name-btn"
												onClick={() => handleFactoryClick(fix.flowCode)}
												disabled={loading}
											>
												<ul>{fix.factoryName}</ul>
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}

					{/* 대량 작업 바 */}
					<BulkActionBar
						selectedCount={selectedFix ? 1 : 0}
						onStockRegister={handleStockRegister}
						onSalesRegister={handleSalesRegister}
						onDelete={handleBulkDelete}
						className="order"
					/>

					{/* 페이지네이션 */}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={(page) => {
							setCurrentPage(page);
							loadFixes(searchFilters, page);
						}}
						className="order"
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
