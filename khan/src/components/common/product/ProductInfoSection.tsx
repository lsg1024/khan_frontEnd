import React, { useState, useEffect } from "react";
import type { Product } from "../../types/product";
import type { ProductStoneDto } from "../../types/stone";
import { productApi } from "../../../libs/api/product";
import { AuthImage } from "../../components/common/AuthImage";
import "../../styles/components/ProductInfoSection.css";

interface ProductInfoSectionProps {
	currentProductDetail: Product | null;
	title?: string;
}

const ProductInfoSection: React.FC<ProductInfoSectionProps> = ({
	currentProductDetail,
	title = "선택된 상품 정보",
}) => {
	const [, setImageUrl] = useState<string>("/images/not_ready.png");

	// 상품이 변경될 때마다 이미지 로드
	useEffect(() => {
		let blobUrl: string | null = null;

		const loadImage = async () => {
			if (
				currentProductDetail?.productImageDtos &&
				currentProductDetail.productImageDtos.length > 0 &&
				currentProductDetail.productImageDtos[0].imagePath
			) {
				try {
					const blob = await productApi.getProductImageByPath(
						currentProductDetail.productImageDtos[0].imagePath,
					);
					blobUrl = URL.createObjectURL(blob);
					setImageUrl(blobUrl);
				} catch (error) {
					console.error("이미지 로드 실패:", error);
					setImageUrl("/images/not_ready.png");
				}
			} else {
				setImageUrl("/images/not_ready.png");
			}
		};

		loadImage();

		// cleanup: 이전 blob URL 해제
		return () => {
			if (blobUrl && blobUrl.startsWith("blob:")) {
				URL.revokeObjectURL(blobUrl);
			}
		};
	}, [currentProductDetail]);

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
						<AuthImage
							imagePath={
								currentProductDetail.productImageDtos &&
								currentProductDetail.productImageDtos.length > 0
									? currentProductDetail.productImageDtos[0].imagePath
									: ""
							}
							alt={currentProductDetail.productName}
							className="info-image"
							onClick={() => {}}
						/>

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
														),
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
