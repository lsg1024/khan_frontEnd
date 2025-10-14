import React from "react";
import type { Product } from "../../types/product";
import type { ProductStoneDto } from "../../types/stone";
import "../../styles/components/ProductInfoSection.css";

interface ProductInfoSectionProps {
	currentProductDetail: Product | null;
	title?: string;
}

const ProductInfoSection: React.FC<ProductInfoSectionProps> = ({
	currentProductDetail,
	title = "선택된 상품 정보",
}) => {
	return (
		<div className="product-info-section">
			<h2>{title}</h2>
			{!currentProductDetail ? (
				<div className="order-history-placeholder">
					상품을 선택하면 상세 정보가 표시됩니다.
				</div>
			) : (
				<div className="single-product-info">
					<div className="product-info-card">
						<div className="product-info-header">
							<div className="product-image-container">
								{currentProductDetail.productImageDtos &&
								currentProductDetail.productImageDtos.length > 0 ? (
									<img
										src={
											currentProductDetail.productImageDtos[0].imagePath
												? `/@fs/C:/Users/zks14/Desktop/multi_module/product-service/src/main/resources${currentProductDetail.productImageDtos[0].imagePath}`
												: "/images/not_ready.png"
										}
										alt={currentProductDetail.productName}
										className="product-image"
									/>
								) : (
									<div className="no-image-placeholder">이미지 없음</div>
								)}
							</div>
						</div>

						<div className="basic-info-section">
							<div className="info-grid">
								{/* 상품명과 제조사를 같은 줄에 */}
								<div className="info-row">
									<div className="info-item quarter-width">
										<span className="label">모델번호:</span>
										<span className="value">
											{currentProductDetail.productName}
										</span>
									</div>
									<div className="info-item quarter-width">
										<span className="label">제조사:</span>
										<span className="value">
											{currentProductDetail.factoryName || "-"}
										</span>
									</div>
									<div className="info-item quarter-width">
										<span className="label">분류:</span>
										<span className="value">
											{currentProductDetail.classificationDto
												?.classificationName || "-"}
										</span>
									</div>
									<div className="info-item quarter-width">
										<span className="label">세트 타입:</span>
										<span className="value">
											{currentProductDetail.setTypeDto?.setTypeName || "-"}
										</span>
									</div>
								</div>

								{/* 무게, 재질, 구매/판매가격 */}
								<div className="info-row">
									<div className="info-item quarter-width">
										<span className="label">무게:</span>
										<span className="value">
											{currentProductDetail.standardWeight || "-"}
										</span>
									</div>
									<div className="info-item quarter-width">
										<span className="label">재질:</span>
										<span className="value">
											{currentProductDetail.materialDto?.materialName || "-"}
										</span>
									</div>
									<div className="info-item quarter-width">
										<span className="label">구매가:</span>
										<span className="value">
											{currentProductDetail.productWorkGradePolicyGroupDto &&
											currentProductDetail.productWorkGradePolicyGroupDto
												.length > 0
												? currentProductDetail.productWorkGradePolicyGroupDto[0].productPurchasePrice.toLocaleString() +
												  "원"
												: "-"}
										</span>
									</div>
									<div className="info-item quarter-width">
										<span className="label">판매가:</span>
										<span className="value">
											{currentProductDetail.productWorkGradePolicyGroupDto &&
											currentProductDetail.productWorkGradePolicyGroupDto
												.length > 0 &&
											currentProductDetail.productWorkGradePolicyGroupDto[0]
												.policyDtos &&
											currentProductDetail.productWorkGradePolicyGroupDto[0]
												.policyDtos.length > 0
												? currentProductDetail.productWorkGradePolicyGroupDto[0].policyDtos[0].laborCost.toLocaleString() +
												  "원"
												: "-"}
										</span>
									</div>
								</div>

								{/* 스톤 정보 */}
								{currentProductDetail.productStoneDtos &&
									currentProductDetail.productStoneDtos.length > 0 && (
										<div className="info-row-last">
											<div className="info-item .half-width-special">
												<span className="label">스톤 정보:</span>
												<div className="stone-info-container">
													{currentProductDetail.productStoneDtos.map(
														(stone: ProductStoneDto, index: number) => (
															<div key={index} className="stone-item">
																<strong>
																	{stone.mainStone ? "메인" : "보조"}:
																</strong>
																{stone.stoneName} x {stone.stoneQuantity}개
																(구매: {stone.stonePurchase.toLocaleString()}
																원)
															</div>
														)
													)}
												</div>
											</div>
											{/* 메모 정보 */}
											{currentProductDetail.productNote && (
												<div className="info-item .half-width-special">
													<span className="label">상품 메모:</span>
													<div className="product-memo">
														{currentProductDetail.productNote}
													</div>
												</div>
											)}
										</div>
									)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default ProductInfoSection;
