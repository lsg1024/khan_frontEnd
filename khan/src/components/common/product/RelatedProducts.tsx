import React from "react";
import "../../../styles/components/common/RelatedProducts.css";

export interface RelatedProductItem {
	productId: string;
	productName: string;
	productFactoryName: string;
	factoryName: string;
	imagePath?: string;
	imageUrl?: string;
}

interface RelatedProductsProps {
	relatedNumber: string;
	products: RelatedProductItem[];
	currentProductId?: string;
	loading?: boolean;
	onProductClick?: (productId: string) => void;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({
	relatedNumber,
	products,
	currentProductId,
	loading = false,
	onProductClick,
}) => {
	// 관련번호가 없으면 표시하지 않음
	if (!relatedNumber || relatedNumber.trim() === "") {
		return null;
	}

	const handleProductClick = (productId: string) => {
		if (onProductClick) {
			onProductClick(productId);
		} else {
			// 기본 동작: 새 창에서 상품 상세 페이지 열기
			window.open(`/product/edit/${productId}`, "_blank", "width=1200,height=800");
		}
	};

	return (
		<div className="related-products-section">
			<div className="related-products-header">
				<h3>
					<span className="related-icon">🔗</span>
					관련 상품
					<span className="related-number-badge">{relatedNumber}</span>
				</h3>
				{products.length > 0 && (
					<span className="related-count">{products.length}개</span>
				)}
			</div>

			<div className="related-products-content">
				{loading ? (
					<div className="related-products-loading">
						<span className="loading-spinner"></span>
						<span>관련 상품을 불러오는 중...</span>
					</div>
				) : products.length > 0 ? (
					<div className="related-products-list">
						{products.map((product) => (
							<div
								key={product.productId}
								className={`related-product-card ${
									product.productId === currentProductId ? "current" : ""
								}`}
								onClick={() => handleProductClick(product.productId)}
								title={
									product.productId === currentProductId
										? "현재 보고 있는 상품"
										: "클릭하여 상품 보기"
								}
							>
								<div className="related-product-image">
									{product.imageUrl || product.imagePath ? (
										<img
											src={product.imageUrl || product.imagePath}
											alt={product.productName}
										/>
									) : (
										<div className="no-image">
											<span>📷</span>
										</div>
									)}
									{product.productId === currentProductId && (
										<span className="current-badge">현재</span>
									)}
								</div>
								<div className="related-product-info">
									<span className="product-name" title={product.productName}>
										{product.productName}
									</span>
									<span className="factory-name" title={product.factoryName}>
										{product.factoryName}
									</span>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="related-products-empty">
						<span className="empty-icon">📭</span>
						<span>동일한 관련번호를 가진 다른 상품이 없습니다.</span>
					</div>
				)}
			</div>
		</div>
	);
};

export default RelatedProducts;
