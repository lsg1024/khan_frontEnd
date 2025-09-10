import { useState, useEffect, useCallback } from "react";
import { factoryApi } from "../../../libs/api/factory";
import { orderApi } from "../../../libs/api/order"
import { storeApi } from "../../../libs/api/store";
import Pagination from "../../components/common/Pagination";
import { useErrorHandler } from "../../utils/errorHandler";
import type { SetTypeDto } from "../../types/setType";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto } from "../../types/store";
import type { OrderDto } from "../../types/order";

export const OrderPage = () => {

// 검색 관련 상태
    const [searchFilters, setSearchFilters] = useState({
        search: "",
        start: "",
        end: "",
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
    const [factories, setFactories] = useState<FactorySearchDto[]>([]);
    const [stores, setStores] = useState<StoreSearchDto[]>([]);
    const [setTypes, setSetTypes] = useState<SetTypeDto[]>([]);
    const { handleError } = useErrorHandler();

    // 드롭다운 데이터 로드 함수
    // const loadDropdowns = async () => {
    //     setDropdownLoading(true);

    // }

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
        setDropdownLoading(true);
            try {
                // 공장 데이터 가져오기 -> 서버에서 distinct 이용해 종합 페이지에서 가져오도록
                // const factoryResponse;
                // setFactories(factoryData.content);

                // 판매처 데이터 가져오기
                // setStores(storeData.content);

                // 세트타입 데이터 가져오기
                // const setTypeResponse;
                // setSetTypes(setTypeResponse);
            } catch (err) {
                console.error("드롭다운 데이터 로드 실패:", err);
            } finally {
                setDropdownLoading(false);
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
            <p>상품을 불러오는 중...</p>
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
                                <option key={factory.factoryId} value={factory.factoryName}>
                                {factory.factoryName}
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
                                <option key={store.storeId} value={store.storeName}>
                                {store.storeName}
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
                            <option key={setType.setTypeId} value={setType.setTypeName}>
                            {setType.setTypeName}
                            </option>
                        ))}
                        </select>
                    </div>
                </div>
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