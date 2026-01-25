import { useState, useEffect } from "react";
import type { ProductInfo } from "../../types/stoneDto";
import { AuthImage } from "../../components/common/AuthImage";
import { openProductDetailPopup } from "../../utils/popupUtils";
import "../../styles/pages/stone/StoneProductsPage.css";

export const StoneProductsPage = () => {
	const [products, setProducts] = useState<ProductInfo[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// 부모 창으로부터 상품 정보 받기
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			if (event.data.type === "STONE_PRODUCTS_DATA") {
				setProducts(event.data.productInfos || []);
				setLoading(false);
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, []);

	// 상품 상세 페이지 열기
	const handleProductClick = (productId: number) => {
		openProductDetailPopup(String(productId));
	};

	if (loading) {
		return (
			<div className="stone-products-page">
				<div className="loading-container">
					<div className="spinner"></div>
					<p>상품 목록을 불러오는 중...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="stone-products-page">
			<div className="header">
				<h2>스톤 사용 상품 목록</h2>
				<p className="product-count">총 {products.length}개 상품</p>
			</div>

			{products.length === 0 ? (
				<div className="no-data">
					<p>이 스톤을 사용하는 상품이 없습니다.</p>
				</div>
			) : (
				<div className="products-grid">
					{products.map((product) => (
						<div
							key={product.productId}
							className="product-card"
							onClick={() => handleProductClick(product.productId)}
						>
							<div className="product-image-wrapper">
								<AuthImage
									imagePath={product.imagePath}
									alt={product.productName}
									className="product-image"
								/>
							</div>
							<div className="product-info">
								<h3 className="product-name" title={product.productName}>
									{product.productName}
								</h3>
							</div>
						</div>
					))}
				</div>
			)}

			<div className="footer">
				<button className="reset-btn-common" onClick={() => window.close()}>
					닫기
				</button>
			</div>
		</div>
	);
};

export default StoneProductsPage;
