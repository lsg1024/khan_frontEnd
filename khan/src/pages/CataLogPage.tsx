import { useState, useEffect } from "react";
import { apiRequest, isApiSuccess } from "../../libs/api";
import { useErrorHandler } from "../utils/errorHandler";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/common/Pagination";
import PageInfo from "../components/common/PageInfo";
import "../styles/pages/CataLogPage.css";

// 상품 데이터 타입 정의
interface Product {
    productId: string;
    productName: string;
    productWeight: string;
    productColor: string;
    productNote: string;
    productLaborCost: string;
    productPriceInfo: string;
    productImagePath: string;
}

interface PageInfo {
    number: number;
    totalPages: number;
    totalElements: number;
    size: number;
    currentPage: number;
}

interface ProductPageResponse {
    content: Product[];
    page: PageInfo;
}

function CataLogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const { handleError } = useErrorHandler();

    // 페이지네이션 훅 사용 (초기값은 20이지만 서버 응답으로 업데이트됨)
    const pagination = usePagination(20, (page) => {
        loadProducts(page);
    });

    // 상품 데이터 로드
    const loadProducts = async (page: number = 1) => {
        try {
        setLoading(true);
        setError("");

        const serverPage = page; // 변환 없이 그대로 사용
        const currentPageSize =
            pagination.paginationState.pageSize === 20 &&
            pagination.paginationState.totalPages === 0
            ? 20
            : pagination.paginationState.pageSize || 20;

        const response = await apiRequest.get<ProductPageResponse>(
            `/product/products?page=${serverPage}&size=${currentPageSize}`
        );

        if (isApiSuccess(response) && response.data) {
            const data = response.data;
            setProducts(data.content || []);

            // 페이지네이션 상태 업데이트 (서버는 0-based, 클라이언트는 1-based)
            const newState = {
            currentPage: page, // 클라이언트에서 요청한 페이지를 직접 사용 (이미 1-based)
            totalPages: data.page.totalPages || 0,
            totalElements: data.page.totalElements || 0,
            pageSize: data.page.size || 20, // 서버에서 온 실제 페이지 사이즈 사용
            };

            pagination.setPaginationState(newState);
        }
        } catch (err: unknown) {
        handleError(err, setError);
        } finally {
        setLoading(false);
        }
    };

    // 컴포넌트 마운트 시 첫 페이지 로드
    useEffect(() => {
        loadProducts(1);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="catalog-page">
        {/* 헤더 섹션 */}
        <div className="catalog-header">
            <h1>상품 카탈로그</h1>
            <PageInfo
            pagination={pagination.paginationState}
            className="catalog-info"
            />
        </div>

        {/* 에러 메시지 */}
        {error && (
            <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
            </div>
        )}

        {/* 상품 그리드 */}
        <div className="products-grid">
            {products.map((product) => (
            <div key={product.productId} className="product-card">
                {/* 상품 이미지 */}
                <div className="product-image">
                <img
                    src={product.productImagePath || "/images/not_ready.png"}
                    alt={product.productName}
                    onError={(e) => {
                    e.currentTarget.src = "/images/not_ready.png";
                    }}
                />
                </div>

                {/* 상품 정보 */}
                <div className="product-info" data-product-id={product.productId}>
                <h3 className="product-name">{product.productName}</h3>
                <div className="product-details">
                    {/* 무게와 색상을 한 줄로 */}
                    <div className="detail-row combined">
                    <div className="detail-item">
                        <span className="label">무게:</span>
                        <span className="value">{product.productWeight}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">색상:</span>
                        <span className="value color-tag">
                        {product.productColor}
                        </span>
                    </div>
                    </div>

                    {/* 매입가와 판매가를 한 줄로 */}
                    <div className="detail-row combined price-row-combined">
                    <div className="detail-item">
                        <span className="price-label">매입가:</span>
                        <span className="labor-cost">
                        {product.productLaborCost}원
                        </span>
                    </div>
                    <div className="detail-item">
                        <span className="price-label">판매가:</span>
                        <span className="selling-price">
                        {product.productPriceInfo}원
                        </span>
                    </div>
                    </div>

                    {/* 메모는 맨 아래 */}
                    {product.productNote && (
                    <div className="detail-row note">
                        <span className="label">메모:</span>
                        <span className="value">{product.productNote}</span>
                    </div>
                    )}
                </div>
                </div>
            </div>
            ))}
        </div>

        {/* 빈 상태 */}
        {products.length === 0 && !loading && (
            <div className="empty-state">
            <span className="empty-icon">📦</span>
            <h3>상품이 없습니다</h3>
            <p>등록된 상품이 없습니다.</p>
            </div>
        )}

        {/* 페이지네이션 */}
        <Pagination pagination={pagination} />
        </div>
    );
}

export default CataLogPage;
