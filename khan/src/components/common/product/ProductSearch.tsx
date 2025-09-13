import { useState, useEffect, useCallback } from "react";
import { productApi } from "../../../../libs/api";
import { isApiSuccess } from "../../../../libs/api/config";
import { getGoldTransferWeight } from "../../../utils/goldUtils";
import type { ProductDto } from "../../../types/catalog";
import "../../../styles/components/searchModal.css";

interface ProductSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: ProductDto) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 상품 검색
  const performSearch = useCallback(async (name: string, page: number) => {
    setLoading(true);
    setError("");

    try {
      const response = await productApi.getProductCategories(
        name || undefined,
        undefined,
        undefined,
        undefined,
        page
      );

      if (!isApiSuccess(response)) {
        setError(response.message || "상품 데이터를 불러오지 못했습니다.");
        setProducts([]);
        setCurrentPage(1);
        setTotalPages(0);
        setTotalElements(0);
        return;
      }

      const data = response.data;
      const content = data?.content ?? [];
      const pageInfo = data?.page;

      setProducts(content);
      const uiPage = (pageInfo?.number ?? page - 1) + 1;
      setCurrentPage(uiPage);
      setTotalPages(pageInfo?.totalPages ?? 1);
      setTotalElements(pageInfo?.totalElements ?? content.length);
    } catch {
      setError("상품 데이터를 불러오지 못했습니다.");
      setProducts([]);
      setCurrentPage(1);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // 모달이 열릴 때 초기 데이터 로드
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setCurrentPage(1);
      performSearch("", 1);
    }
  }, [isOpen, performSearch]);

  // 검색 실행
  const handleSearch = () => {
    setCurrentPage(1);
    performSearch(searchTerm, 1);
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    performSearch(searchTerm, page);
  };

  // 상품 선택
  const handleSelectProduct = (product: ProductDto) => {
    onSelectProduct(product);
    onClose();
  };

  // 총 매입가 계산
  const calculateTotalPurchaseCost = (product: ProductDto): number => {
    const productCost = parseInt(product.productPurchaseCost) || 0;
    const stoneCost = product.productStones.reduce((sum, stone) => {
      return sum + stone.purchasePrice * stone.stoneQuantity;
    }, 0);
    return productCost + stoneCost;
  };

  // 총 판매가 계산
  const calculateTotalLaborCost = (product: ProductDto): number => {
    const productCost = parseInt(product.productLaborCost) || 0;
    const stoneCost = product.productStones.reduce((sum, stone) => {
      return sum + stone.laborCost * stone.stoneQuantity;
    }, 0);
    return productCost + stoneCost;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>상품 선택</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* 검색 영역 */}
          <div className="search-section">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="상품명을 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <button onClick={handleSearch} disabled={loading}>
                검색
              </button>
            </div>
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
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>상품을 불러오는 중...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📦</span>
                <h3>상품이 없습니다</h3>
                <p>검색 조건에 맞는 상품이 없습니다.</p>
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product.productId}
                  className="product-card selectable"
                  onClick={() => handleSelectProduct(product)}
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
                  <div className="product-info">
                    <h3 className="product-name">{product.productName}</h3>
                    <div className="product-details">
                      {/* 무게, 재질 */}
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
                          <span className="value">
                            {product.productMaterial}
                          </span>
                        </div>
                      </div>

                      {/* 스톤 정보 */}
                      {product.productStones &&
                        product.productStones.length > 0 && (
                          <div className="stones-section">
                            {product.productStones.map((stone) => (
                              <div
                                key={stone.productStoneId}
                                className="stone-row"
                              >
                                <span className="stone-info">
                                  {stone.mainStone ? "M " : ""}
                                  {stone.stoneName} × {stone.stoneQuantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* 가격 정보 */}
                      <div className="detail-row combined price-row-combined">
                        <div className="detail-item">
                          <span className="price-label">매입가:</span>
                          <span className="labor-cost">
                            {calculateTotalPurchaseCost(
                              product
                            ).toLocaleString()}
                            원
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="price-label">판매가:</span>
                          <span className="selling-price">
                            {calculateTotalLaborCost(product).toLocaleString()}
                            원
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
              >
                이전
              </button>

              <span className="page-info">
                {currentPage} / {totalPages} (총 {totalElements}개)
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSearch;
