import { useState, useEffect } from "react";
import { factoryApi } from "../../../libs/api/factory";
import { StoreApi } from "../../../libs/api/store";
import type { SetTypeDto } from "../../types/setType";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto } from "../../types/store";


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
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [factories, setFactories] = useState<FactorySearchDto[]>([]);
    const [stores, setStores] = useState<StoreSearchDto[]>([]);
    const [setTypes, setSetTypes] = useState<SetTypeDto[]>([]);

    // 드롭다운 데이터 로드 함수
    const loadDropdowns = async () => {
        setDropdownLoading(true);

    }

    // 주문 데이터 로드 함수
    const loadOrders = async () => {
    }

    useEffect(() => {
        setCurrentPage(1);
        setError("");

        const fetchDropdownData = async () => {
            setDropdownLoading(true);
            try {
                // 공장 데이터 가져오기
                const factoryResponse = await factoryApi.getFactories(
                    
                )
                const factoryData = await factoryResponse.json();
                setFactories(factoryData.content);

                // 판매처 데이터 가져오기
                const storeResponse = await fetch("/api/stores");
                const storeData = await storeResponse.json();
                setStores(storeData.content);

                // 세트타입 데이터 가져오기
                const setTypeResponse = await fetch("/api/set-types");
                const setTypeData = await setTypeResponse.json();
                setSetTypes(setTypeData.content);
            } catch (err) {
                console.error("드롭다운 데이터 로드 실패:", err);
            } finally {
                setDropdownLoading(false);
            }
        };
        
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
        </div>
        </>
    )

}

export default OrderPage;