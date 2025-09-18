import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import Pagination from "../../components/common/Pagination";
import FactorySearch from "../../components/common/product/FactorySearch";
import { useErrorHandler } from "../../utils/errorHandler";
import type { OrderDto } from "../../types/order";
import type { FactorySearchDto } from "../../types/factory";
import "../../styles/pages/OrderPage.css";

export const OrderPage = () => {
	const navigate = useNavigate();

	// 검색 관련 상태
	const [searchFilters, setSearchFilters] = useState({
		search: "",
		start: new Date().toISOString().slice(0, 10),
		end: new Date().toISOString().slice(0, 10),
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

	const startDateInputRef = useRef<HTMLInputElement>(null);
	const endDateInputRef = useRef<HTMLInputElement>(null);

	const handleInputStartClick = () => {
        startDateInputRef.current?.showPicker();
    };

	const handleInputEndClilck = () => {
		endDateInputRef.current?.showPicker();
	}

	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [dropdownLoading, setDropdownLoading] = useState(false);
	const [orders, setOrders] = useState<OrderDto[]>([]); // 주문 데이터 상태
	const [factories, setFactories] = useState<string[]>([]);
	const [stores, setStores] = useState<string[]>([]);
	const [setTypes, setSetTypes] = useState<string[]>([]);

	// 제조사 변경 관련 상태
	const [isFactorySearchOpen, setIsFactorySearchOpen] = useState(false);
	const [selectedOrderForFactory, setSelectedOrderForFactory] =
		useState<string>("");

	const { handleError } = useErrorHandler();

	// 주문 상세 페이지로 이동
	const handleOrderClick = (flowCode: string) => {
		navigate(`/orders/${flowCode}`);
	};

	// 주문 상태 변경
	const handleStatusChange = async (flowCode: string, newStatus: string) => {
		const confirmMessage = `주문 상태를 "${newStatus}"로 변경하시겠습니까?`;

		if (window.confirm(confirmMessage)) {
			try {
				setLoading(true);
				const orderId = flowCode; // flowCode를 숫자로 변환
				await orderApi.updateOrderStatus(orderId, newStatus);

				alert("주문 상태가 성공적으로 변경되었습니다.");

				// 현재 페이지 데이터 새로고침
				await loadOrders(searchFilters, currentPage);
			} catch (err) {
				handleError(err, setError);
				alert("주문 상태 변경에 실패했습니다.");
			} finally {
				setLoading(false);
			}
		}
	};

	// 제조사 클릭 핸들러
	const handleFactoryClick = (flowCode: string) => {
		if (window.confirm("공장을 변경하시겠습니까?")) {
			setSelectedOrderForFactory(flowCode);
			setIsFactorySearchOpen(true);
		}
	};

	// 제조사 선택 핸들러
	const handleFactorySelect = async (factory: FactorySearchDto) => {
		try {
			setLoading(true);
			await orderApi.updateOrderFactory(
				selectedOrderForFactory,
				factory.factoryId!
			);

			alert("제조사가 성공적으로 변경되었습니다.");

			// 현재 페이지 데이터 새로고침
			await loadOrders(searchFilters, currentPage);

			// 팝업 닫기
			setIsFactorySearchOpen(false);
			setSelectedOrderForFactory("");
		} catch (err) {
			handleError(err, setError);
			alert("제조사 변경에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// 제조사 검색 팝업 닫기
	const handleFactorySearchClose = () => {
		setIsFactorySearchOpen(false);
		setSelectedOrderForFactory("");
	};

	const handleOrderCreate = () => {
		navigate("/orders/create");
	};

	// 검색 실행
	const handleSearch = () => {
		setCurrentPage(1);
		loadOrders(searchFilters, 1);
	};

	// 검색 초기화
	const handleReset = () => {
		const resetFilters = {
			search: "",
			start: "2025-08-04",
			end: "2025-09-11",
			factory: "",
			store: "",
			setType: "",
		};
		setSearchFilters(resetFilters);
		setCurrentPage(1);
		loadOrders(resetFilters, 1);
	};

	// 주문 데이터 로드 함수
	const loadOrders = useCallback(
		async (filters: typeof searchFilters, page: number = 1) => {
			setLoading(true);
			setError("");

			try {
				const response = await orderApi.getOrders(
					filters.start,
					filters.end,
					filters.search,
					filters.factory,
					filters.store,
					filters.setType,
					page
				);

				if (response.success && response.data) {
					const pageData = response.data.page;
					const content = response.data.content || [];

					setOrders(content || []);
					setCurrentPage(page);
					setTotalPages(pageData.totalPages || 1);
					setTotalElements(pageData.totalElements || 0);
				}
			} catch (err) {
				handleError(err, setError);
				setOrders([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[handleError]
	);

	const fetchDropdownData = async () => {
		setDropdownLoading(true);
		try {
			// 공장 데이터 가져오기 -> 서버에서 distinct 이용해 종합 페이지에서 가져오도록
			const factoryResponse = await orderApi.getFilterFactories(
				searchFilters.start,
				searchFilters.end
			);
			setFactories(factoryResponse.data || []);

			// 판매처 데이터 가져오기
			const storeResponse = await orderApi.getFilterStores(
				searchFilters.start,
				searchFilters.end
			);
			setStores(storeResponse.data || []);

			// 세트타입 데이터 가져오기
			const setTypeResponse = await orderApi.getFilterSetTypes(
				searchFilters.start,
				searchFilters.end
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

			// 드롭다운 데이터와 주문 데이터를 병렬로 로드
			await Promise.all([loadOrders(searchFilters, 1), fetchDropdownData()]);
		};

		initializeData();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// 로딩 상태 렌더링
	if (loading) {
		return (
			<>
				<div className="spinner"></div>
				<p>주문을 불러오는 중...</p>
			</>
		);
	}

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
				<div className="search-section-order">
					<div className="search-filters-order">
						<div className="filter-row-order">
							<div className="filter-group-order">
								<div className="date-range-order">
									<input
										ref={startDateInputRef}
										name="start"
										type="date"
										value={searchFilters.start}
										onChange={(e) =>
											handleFilterChange("start", e.target.value)
										}
										onClick={handleInputStartClick}
									/>
									<span>~</span>
									<input
										ref={endDateInputRef}
										name="end"
										type="date"
										value={searchFilters.end}
										onChange={(e) => handleFilterChange("end", e.target.value)}
										onClick={handleInputEndClilck}
									/>
								</div>
							</div>

							<div className="filter-group-order">
								<select
									id="factoryId"
									value={searchFilters.factory}
									onChange={(e) =>
										handleFilterChange("factory", e.target.value)
									}
									disabled={dropdownLoading}
								>
									<option value="">제조사</option>
									{factories.map((factory) => (
										<option key={factory} value={factory}>
											{factory}
										</option>
									))}
								</select>
							</div>

							<div className="filter-group-order">
								<select
									id="storeId"
									value={searchFilters.store}
									onChange={(e) => handleFilterChange("store", e.target.value)}
									disabled={dropdownLoading}
								>
									<option value="">판매처</option>
									{stores.map((store) => (
										<option key={store} value={store}>
											{store}
										</option>
									))}
								</select>
							</div>

							<div className="filter-group-order">
								<select
									id="setType"
									value={searchFilters.setType}
									onChange={(e) =>
										handleFilterChange("setType", e.target.value)
									}
									disabled={dropdownLoading}
								>
									<option value="">세트</option>
									{setTypes.map((setType) => (
										<option key={setType} value={setType}>
											{setType}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="search-controls-order">
							<input
								type="text"
								placeholder="상품명으로 검색..."
								value={searchFilters.search}
								onChange={(e) => handleFilterChange("search", e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
								className="search-input-order"
							/>
							<div className="search-buttons-order">
								<button
									onClick={handleSearch}
									className="search-btn-order"
									disabled={loading}
								>
									검색
								</button>
								<button
									onClick={handleReset}
									className="reset-btn-order"
									disabled={loading}
								>
									초기화
								</button>
								<button
									onClick={handleOrderCreate}
									className="order-btn-order"
									disabled={loading}
								>
									주문
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* 주문 목록 */}
				<div className="order-list">
					{orders.length === 0 ? (
						<div className="no-data-order">
							<p>조회된 주문이 없습니다.</p>
						</div>
					) : (
						<table className="order-table">
							<thead>
								<tr>
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
								{orders.map((order, index) => (
									<tr key={order.flowCode}>
										<td>
											<button
												className="order-no-btn"
												onClick={() => handleOrderClick(order.flowCode)}
											>
												{(currentPage - 1) * 16 + index + 1}
											</button>
										</td>
										<td className="product-name-order">{order.productName}</td>
										<td className="info-cell">
											{/* << MODIFIED */}
											<div className="info-row-order">
												<span className="info-value">
													{new Date(order.orderDate).toISOString().slice(0, 10)}
												</span>
											</div>
											<div className="info-row-order">
												<span className="info-value-expect">
													{new Date(order.orderExpectDate).toISOString().slice(0, 10)}
												</span>
											</div>
										</td>
										<td>{order.storeName}</td>
										<th className="image-cell-order">
											<img
												className="order-image"
												src={
													order.imagePath
														? `/@fs/C:/Users/zks14/Desktop/multi_module/product-service/src/main/resources${order.imagePath}`
														: "/images/not_ready.png"
												}
												alt={order.productName}
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
														order.materialName === "18K" ? "highlight-18k" : ""
													}`}
												>
													{order.materialName}
												</span>
											</div>
											<div className="info-row-order">
												<span className="info-label"></span>
												<span className="info-value">{order.colorName}</span>
											</div>
										</td>
										<td className="info-cell">
											{" "}
											{/* << MODIFIED */}
											<div className="info-row-order">
												<span className="info-value-stone-note">
													{order.orderMainStoneNote}
												</span>
											</div>
											<div className="info-row-order">
												<span className="info-value-stone-note">
													{order.orderAssistanceStoneNote}
												</span>
											</div>
										</td>
										<td>{order.productSize}</td>
										<td>{order.setType}</td>
										<td>{order.stockQuantity}</td>
										<td>
											<span
												className={`priority-badge-order ${order.priority}`}
											>
												{order.priority}
											</span>
										</td>
										<td className="note-cell-order">{order.orderNote}</td>
										<td>
											<select
												className="status-dropdown-order"
												value={order.productStatus}
												onChange={(e) =>
													handleStatusChange(order.flowCode, e.target.value)
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
												onClick={() => handleFactoryClick(order.flowCode)}
												disabled={loading}
											>
												<ul>{order.factoryName}</ul>
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}

					{/* 페이지네이션 */}
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={(page) => {
							setCurrentPage(page);
							loadOrders(searchFilters, page);
						}}
						className="order"
					/>
				</div>

				{/* 제조사 검색 팝업 */}
				<FactorySearch
					isOpen={isFactorySearchOpen}
					onClose={handleFactorySearchClose}
					onSelectFactory={handleFactorySelect}
				/>
			</div>
		</>
	);
};

export default OrderPage;
