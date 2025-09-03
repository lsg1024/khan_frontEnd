import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { basicInfoApi } from "../../libs/api";
import { useErrorHandler } from "../utils/errorHandler";
import { getGoldTransferWeight } from "../utils/goldUtils";
import Pagination from "../components/common/Pagination";
import "../styles/pages/CataLogPage.css";
import "../styles/components/common.css";

// 상품 데이터 타입 정의
interface StoneWorkGradePolicy {
    workGradePolicyId: string;
    grade: string;
    laborCost: number;
}

interface ProductStone {
    productStoneId: string;
    stoneId: string;
    stoneName: string;
    productStoneMain: boolean;
    includeQuantity: boolean;
    includeWeight: boolean;
    includeLabor: boolean;
    stoneQuantity: number;
    stoneWorkGradePolicyDtos: StoneWorkGradePolicy[];
}

interface Product {
    productId: string;
    productName: string;
    productWeight: string;
    productMaterial: string;
    productColor: string;
    productNote: string;
    productLaborCost: string;
    productPriceInfo: string;
    productImagePath: string | null;
    productStones: ProductStone[];
}

function CataLogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [error, setError] = useState<string>("");
    const { handleError } = useErrorHandler();
    const navigate = useNavigate();

    // 상품 상세 페이지로 이동
    const handleProductClick = (productId: string) => {
        navigate(`/catalog/${productId}`);
    };

    // 상품 데이터 로드
    const loadProducts = useCallback(
        async (search?: string, page: number = 1) => {
        setLoading(true);
        setError("");

        try {
            const response = await basicInfoApi.getProductCategories(search, page);

            if (response.data?.success && response.data) {
            const pageData = response.data.data.page;
            const content = response.data.data.content || [];

            setProducts(content || []);
            setCurrentPage(page);
            setTotalPages(pageData.totalPages || 1);
            setTotalElements(pageData.totalElements || 0);
            }
        } catch (err: unknown) {
            handleError(err, setError);
            setProducts([]);
            setCurrentPage(1);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
        },
    []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setCurrentPage(1);
        loadProducts("", 1);
    }, [loadProducts]);

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
            <div
                key={product.productId}
                className="product-card"
                onClick={() => handleProductClick(product.productId)}
                style={{ cursor: "pointer" }}
            >
                {/* 상품 이미지 */}
                <div className="product-image">
                <img
                    src={
                    product.productImagePath
                        ? `/@fs/C:/Users/zks14/Desktop/multi_module/product-service/src/main/resources${product.productImagePath}`
                        : "/images/not_ready.png"
                    }
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
                    {/* 무게, 재질, 색상을 한 줄로 */}
                    <div className="detail-row combined">
                    <div className="detail-item">
                        <div className="value">{product.productWeight}g</div>
                    </div>
                    <div className="detail-item">
                        <div className="gold-content">
                        {getGoldTransferWeight(product.productWeight)}돈
                        </div>
                    </div>
                    <div className="detail-item">
                        <span className="value">{product.productMaterial}</span>
                    </div>
                    <div className="detail-item">
                        <span className="value color-tag">
                        {product.productColor}
                        </span>
                    </div>
                    </div>

                    {/* 스톤 정보 표시 */}
                    {product.productStones && product.productStones.length > 0 && (
                    <div className="stones-section">
                        {product.productStones.map((stone) => (
                        <div key={stone.productStoneId} className="stone-row">
                            <span className="stone-info">
                            {stone.productStoneMain ? "M " : ""}
                            {stone.stoneName} × {stone.stoneQuantity}
                            </span>
                        </div>
                        ))}
                        <div className="stone-total">
                        <span className="total-label">총 개수: </span>
                        <span className="total-value">
                            {product.productStones.reduce(
                            (sum, stone) => sum + stone.stoneQuantity,
                            0
                            )}
                        </span>
                        </div>
                    </div>
                    )}

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

                    {/* 메모 */}
                    {product.productNote && (
                    <div className="detail-row note">
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
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={totalElements}
            loading={loading}
            onPageChange={(page) => {
            setCurrentPage(page);
            loadProducts("", page);
            }}
        />
        </div>
    );
}

export default CataLogPage;
