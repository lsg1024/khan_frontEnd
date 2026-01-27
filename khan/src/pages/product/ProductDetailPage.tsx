import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isApiSuccess } from "../../../libs/api/config";
import { useErrorHandler } from "../../utils/errorHandler";
import StoneTable from "../../components/common/stone/StoneTable";
import PriceTable from "../../components/common/product/PriceTable";
import ProductInfo from "../../components/common/product/BasicInfo";
import RelatedProducts from "../../components/common/product/RelatedProducts";
import type { RelatedProductItem } from "../../components/common/product/RelatedProducts";
import { productApi } from "../../../libs/api/productApi";
import type { Product } from "../../types/productDto";
import "../../styles/pages/product/ProductDetailPage.css";

function ProductDetailPage() {
	const { productId } = useParams<{ productId: string }>();
	const navigate = useNavigate();
	const [product, setProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const [relatedProducts, setRelatedProducts] = useState<RelatedProductItem[]>([]);
	const [relatedProductsLoading, setRelatedProductsLoading] = useState(false);
	const { handleError } = useErrorHandler();

	// 관련 상품 클릭 핸들러
	const handleRelatedProductClick = (targetProductId: string) => {
		navigate(`/catalog/detail/${targetProductId}`);
	};

	// 읽기 전용 모드 - 모든 핸들러 비활성화
	const handleFactorySelect = () => {
		// 읽기 전용
	};

	const handleProductChange = () => {
		// 읽기 전용
	};

	const handleImageChange = () => {
		// 읽기 전용
	};

	const handleStoneChange = () => {
		// 읽기 전용
	};

	const handleAddStone = () => {
		// 읽기 전용
	};

	const handleDeleteStone = () => {
		// 읽기 전용
	};

	// 상품 상세 정보 로드
	const loadProductDetail = async (id: string) => {
		if (!id) {
			setError("상품 ID가 없습니다.");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError("");

			const response = await productApi.getProduct(id);

			if (isApiSuccess(response) && response.data) {
				const transformedData: Product = {
					...response.data,
					productWorkGradePolicyGroupDto:
						response.data.productWorkGradePolicyGroupDto.map(
							(group: {
								productGroupId: string;
								productPurchasePrice: number;
								colorId: string;
								colorName: string;
								note: string;
								gradePolicyDtos?: unknown;
								policyDtos?: unknown;
							}) => ({
								productGroupId: group.productGroupId,
								productPurchasePrice: group.productPurchasePrice,
								colorId: group.colorId,
								colorName: group.colorName,
								note: group.note,
								policyDtos: (group.gradePolicyDtos ||
									group.policyDtos ||
									[]) as {
									workGradePolicyId: string;
									grade: string;
									laborCost: number;
									groupId: number;
								}[],
							})
						),
				};
				setProduct(transformedData);
			} else {
				setError("상품 정보를 불러올 수 없습니다.");
			}
		} catch (err: unknown) {
			handleError(err);
		} finally {
			setLoading(false);
		}
	};

	// 관련 상품 로드
	const loadRelatedProducts = async (currentProductId: string) => {
		if (!currentProductId) {
			setRelatedProducts([]);
			return;
		}

		setRelatedProductsLoading(true);
		try {
			const response = await productApi.getRelatedProducts(currentProductId);
			if (isApiSuccess(response) && response.data) {
				setRelatedProducts(response.data.map(item => ({
					productId: String(item.productId),
					productName: item.productName,
					productFactoryName: "",
					factoryName: "",
					imagePath: item.imagePath || undefined,
				})));
			} else {
				setRelatedProducts([]);
			}
		} catch (err) {
			console.error("관련 상품 로드 실패:", err);
			setRelatedProducts([]);
		} finally {
			setRelatedProductsLoading(false);
		}
	};

	useEffect(() => {
		if (!productId) return;
		// productId 변경 시 상태 초기화 후 다시 로드
		setProduct(null);
		setLoading(true);
		setRelatedProducts([]);
		loadProductDetail(productId);
	}, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

	// 상품이 로드되면 관련 상품 조회 (관련번호가 있는 경우에만)
	useEffect(() => {
		if (product?.productId && product?.productRelatedNumber) {
			loadRelatedProducts(product.productId);
		} else {
			setRelatedProducts([]);
		}
	}, [product?.productId, product?.productRelatedNumber]); // eslint-disable-line react-hooks/exhaustive-deps

	// 로딩 상태
	if (loading) {
		return (
			<div className="product-detail-page">
				<div className="loading-container">
					<div className="spinner"></div>
					<p>상품 정보를 불러오는 중...</p>
				</div>
			</div>
		);
	}

	// 에러 상태
	if (error || !product) {
		return (
			<div className="product-detail-page">
				<div className="error-container">
					<span className="error-icon">⚠️</span>
					<h3>오류가 발생했습니다</h3>
					<p>{error || "상품 정보를 찾을 수 없습니다."}</p>
					<button onClick={() => window.close()} className="back-button">
						닫기
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="product-detail-page">
			<div className="detail-content">
				{/* 상단 섹션: 기본정보와 이미지 */}
				<div className="top-section">
					{/* 기본 정보 섹션 - key로 productId 변경 시 리마운트 */}
					<ProductInfo
						key={product.productId}
						product={product}
						showTitle={true}
						editable={false}
						onProductChange={handleProductChange}
						onFactorySelect={handleFactorySelect}
						onImageChange={handleImageChange}
					/>
				</div>

				{/* 관련 상품 섹션 */}
				<RelatedProducts
					key={`related-${product.productId}`}
					relatedNumber={product.productRelatedNumber || ""}
					products={relatedProducts}
					currentProductId={product.productId}
					loading={relatedProductsLoading}
					onProductClick={handleRelatedProductClick}
				/>

				{/* 가격 정보 섹션 */}
				<PriceTable
					priceGroups={product.productWorkGradePolicyGroupDto}
					showTitle={true}
					editable={false}
					onPriceGroupChange={() => {}}
				/>

				{/* 스톤 정보 섹션 */}
				<StoneTable
					stones={product.productStoneDtos || []}
					showTitle={true}
					showTotalRow={true}
					showManualTotalRow={true}
					editable={false}
					showAddButton={false}
					fieldPermissions={{
						stoneName: false,
						stoneWeight: false,
						stonePurchase: false,
						grades: false,
						mainStone: false,
						includeStone: false,
						stoneQuantity: false,
						note: false,
					}}
					onStoneChange={handleStoneChange}
					onAddStone={handleAddStone}
					onDeleteStone={handleDeleteStone}
				/>

				{/* TODO: 향후 상품 판매/대여/재고 이력 추가 예정 */}
				{/* <div className="product-history-section">
					<h3>상품 이력</h3>
					<div className="history-stats">
						<div className="stat-item">
							<span className="stat-label">판매 이력:</span>
							<span className="stat-value">0건</span>
						</div>
						<div className="stat-item">
							<span className="stat-label">대여 이력:</span>
							<span className="stat-value">0건</span>
						</div>
						<div className="stat-item">
							<span className="stat-label">재고 이력:</span>
							<span className="stat-value">0건</span>
						</div>
					</div>
				</div> */}

				{/* 버튼 섹션 - 닫기만 표시 */}
				<div className="action-buttons">
					<button onClick={() => window.close()} className="reset-btn-common">
						닫기
					</button>
				</div>
			</div>
		</div>
	);
}

export default ProductDetailPage;
