import { useState, useEffect, useCallback, useRef } from "react";
import { orderApi } from "../../../libs/api/order";
import Pagination from "../../components/common/Pagination";
import BulkActionBar from "../../components/common/BulkActionBar";
import FactorySearch from "../../components/common/factory/FactorySearch";
import { useErrorHandler } from "../../utils/errorHandler";
import type { OrderDto } from "../../types/order";
import type { FactorySearchDto } from "../../types/factory";
import OrderSearch from "../../hooks/OrderSearch";
import MainList from "../../components/common/order/MainList";
import { getLocalDate } from "../../utils/dateUtils";
import "../../styles/pages/OrderPage.css";

export const OrderPage = () => {
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

	// 체크박스 선택 관련 상태 (단일 선택만 허용)
	const [selectedOrder, setSelectedOrder] = useState<string>("");

	const { handleError } = useErrorHandler();

	const orderCreationPopup = useRef<Window | null>(null);
	const orderUpdatePopups = useRef<Map<string, Window>>(new Map());

	const handleOrderCreate = () => {
		const url = "/orders/create/order";
		const NAME = "orderCreatePopup";
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

	// 주문 상세 페이지로 이동
	const handleOrderClick = (flowCode: string) => {
		const orderData = orders.find((order) => order.flowCode === flowCode);

		if (orderData?.imagePath) {
			sessionStorage.setItem("tempImagePath", orderData.imagePath);
		}

		const url = `/orders/update/order/${flowCode}`;
		const NAME = `orderUpdate_${flowCode}`;
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
	const handleFactorySelect = useCallback(
		async (factory: FactorySearchDto) => {
			try {
				if (factory.factoryId === undefined || factory.factoryId === null) {
					alert("제조사 ID가 누락되었습니다. 다른 제조사를 선택해주세요.");
					return;
				}

				setLoading(true);
				await orderApi.updateOrderFactory(
					selectedOrderForFactory,
					factory.factoryId
				);

				alert("제조사가 성공적으로 변경되었습니다.");

				// 현재 페이지 데이터 새로고침
				await loadOrders(searchFilters, currentPage);

				// 팝업 상태 정리
				setIsFactorySearchOpen(false);
				setSelectedOrderForFactory("");
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
		setSelectedOrderForFactory("");
	}, []);

	// 체크박스 관련 핸들러 (단일 선택)
	const handleSelectOrder = (flowCode: string, checked: boolean) => {
		if (checked) {
			// 다른 체크박스가 선택되어 있으면 해제하고 새로운 것 선택
			setSelectedOrder(flowCode);
		} else {
			// 선택 해제
			setSelectedOrder("");
		}
	};

	// 대량 작업 핸들러 (단일 선택)
	const handleStockRegister = () => {
		if (selectedOrder) {
			console.log("재고등록 대상:", selectedOrder);
			// TODO: 재고등록 API 호출
			alert(`선택된 주문을 재고등록 처리합니다.`);
		}
	};

	const handleSalesRegister = () => {
		if (selectedOrder) {
			console.log("판매등록 대상:", selectedOrder);
			// TODO: 판매등록 API 호출
			alert(`선택된 주문을 판매등록 처리합니다.`);
		}
	};

	const handleBulkDelete = () => {
		if (selectedOrder) {
			if (window.confirm(`선택된 주문을 삭제하시겠습니까?`)) {
				alert(`선택된 주문을 삭제 처리합니다.`);
				setSelectedOrder("");
			}
		}
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
			start: getLocalDate(),
			end: getLocalDate(),
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

			// 페이지 변경 시 선택 상태 초기화
			setSelectedOrder("");

			try {
				const response = await orderApi.getOrders(
					filters.start,
					filters.end,
					"ORDER",
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
				searchFilters.end,
				"ORDER"
			);
			setFactories(factoryResponse.data || []);

			// 판매처 데이터 가져오기
			const storeResponse = await orderApi.getFilterStores(
				searchFilters.start,
				searchFilters.end,
				"ORDER"
			);
			setStores(storeResponse.data || []);

			// 세트타입 데이터 가져오기
			const setTypeResponse = await orderApi.getFilterSetTypes(
				searchFilters.start,
				searchFilters.end,
				"ORDER"
			);
			setSetTypes(setTypeResponse.data || []);
		} catch {
			alert("드롭다운 데이터를 불러오는 중 오류가 발생했습니다.");
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

		// effect 시작 시점에 ref 값들을 복사
		const creationPopupRef = orderCreationPopup;
		const updatePopupsRef = orderUpdatePopups;

		initializeData();

		// 컴포넌트 언마운트 시 모든 팝업 참조 정리
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
				<OrderSearch
					searchFilters={searchFilters}
					onFilterChange={handleFilterChange}
					onSearch={handleSearch}
					onReset={handleReset}
					onCreate={handleOrderCreate}
					factories={factories}
					stores={stores}
					setTypes={setTypes}
					loading={loading}
					dropdownLoading={dropdownLoading}
					onStart={true}
				/>

				{/* 주문 목록 */}
				<div className="order-list">
					<MainList
						dtos={orders}
						selected={selectedOrder}
						currentPage={currentPage}
						loading={loading}
						onSelect={handleSelectOrder}
						onClick={handleOrderClick}
						onStatusChange={handleStatusChange}
						onFactoryClick={handleFactoryClick}
					/>

					{/* 대량 작업 바 */}
					<BulkActionBar
						selectedCount={selectedOrder ? 1 : 0}
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
							loadOrders(searchFilters, page);
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

export default OrderPage;
