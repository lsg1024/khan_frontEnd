import { useState, useEffect, useCallback } from "react";
import { orderApi } from "../../../libs/api/order"
import Pagination from "../../components/common/Pagination";
import { useErrorHandler } from "../../utils/errorHandler";
import type { OrderDto } from "../../types/order";

export const OrderPage = () => {

// 검색 관련 상태
    const [searchFilters, setSearchFilters] = useState({
        search: "",
        start: "2025-08-04",
        end: "2025-09-11",
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
    const { handleError } = useErrorHandler();

    // 주문 데이터 로드 함수
    const loadOrders = useCallback(async (filters: typeof searchFilters, page: number = 1) => {
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
    }, [handleError]);

    const fetchDropdownData = async () => {
        setLoading(true);
        setDropdownLoading(true);
            try {
                // 공장 데이터 가져오기 -> 서버에서 distinct 이용해 종합 페이지에서 가져오도록
                const factoryResponse = await orderApi.getFilterFactories(searchFilters.start, searchFilters.end);
                setFactories(factoryResponse.data || []);

                // 판매처 데이터 가져오기
                const storeResponse = await orderApi.getFilterStores(searchFilters.start, searchFilters.end);
                setStores(storeResponse.data || []);

                // 세트타입 데이터 가져오기
                const setTypeResponse = await orderApi.getFilterSetTypes(searchFilters.start, searchFilters.end);
                setSetTypes(setTypeResponse.data || []);
            } catch (err) {
                console.error("드롭다운 데이터 로드 실패:", err);
            } finally {
                setDropdownLoading(false);
                setLoading(false);
            }
        };

    useEffect(() => {
        setCurrentPage(1);
        setError("");
        loadOrders(searchFilters, 1);
        fetchDropdownData();
        
    }, []);

    // 로딩 상태 렌더링
    if (loading) {
        return (
        <div className="catalog-page">
            <div className="loading-container">
            <div className="spinner"></div>
            <p>주문을 불러오는 중...</p>
            </div>
        </div>
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

            <div className="loading-container">
                <div className="spinner"></div>
                <p>주문을 불러오는 중...</p>
            </div>

            {/* 검색 영역 */}
            <div className="search-section-order">
                <div className="search-filters-order">
                    <div className="filter-group-order">
                        <label htmlFor="factory">거래처:</label>
                        <select
                            id="factoryId"
                            value={searchFilters.factory}
                            onChange={(e) => handleFilterChange("factory", e.target.value)}
                            disabled={dropdownLoading}>
                            <option value="">전체</option>
                            {factories.map((factory) => (
                                <option key={factory} value={factory}>
                                {factory}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group-order">
                        <label htmlFor="store">판매처:</label>
                        <select
                            id="storeId"
                            value={searchFilters.store}
                            onChange={(e) => handleFilterChange("store", e.target.value)}
                            disabled={dropdownLoading}>
                            <option value="">전체</option>
                            {stores.map((store) => (
                                <option key={store} value={store}>
                                {store}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group-order">
                        <label htmlFor="setType">세트타입:</label>
                        <select
                        id="setType"
                        value={searchFilters.setType}
                        onChange={(e) => handleFilterChange("setType", e.target.value)}
                        disabled={dropdownLoading}
                        >
                        <option value="">전체</option>
                        {setTypes.map((setType) => (
                            <option key={setType} value={setType}>
                            {setType}
                            </option>
                        ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 주문 목록 */}
            <div className="order-list">
                {orders.length === 0 ? (
                <p className="no-orders">조회된 주문이 없습니다.</p>
                ) : (
                <table className="order-table">
                    <thead></thead>
                    <tr>
                        <th>주문번호</th>
                        <th>거래처</th>
                        <th>판매처</th>
                        <th>세트타입</th>
                        <th>주문일자</th>
                        <th>출고일자</th>
                        <th>무게</th>
                        <th>사이즈</th>
                        <th>재질</th>
                        <th>출고 유형</th>
                        <th>비고</th>
                        <th>주문 상태</th>
                    </tr>
                    <tbody>
                    {orders.map((order) => (
                        <tr key={order.flowCode}>
                        <td>{order.flowCode}</td>
                        <td>{order.factoryName}</td>
                        <td>{order.storeName}</td>
                        <td>{order.setType}</td>
                        <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                        <td>{new Date(order.orderExpectDate).toLocaleDateString()}</td>
                        <td>{order.productWeight}</td>
                        <td>{order.productSize}</td>
                        <td>{order.materialName}</td>
                        <td>{order.priority}</td>
                        <td>{order.orderNote}</td>
                        <td>{order.orderStatus}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                )}
            </div>  

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
                className="catalog"
            />
        </div>
        </>
    )

}

export default OrderPage;