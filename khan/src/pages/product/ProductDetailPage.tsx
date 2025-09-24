import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isApiSuccess } from "../../../libs/api/config";
import { useErrorHandler } from "../../utils/errorHandler";
import StoneTable from "../../components/common/stone/StoneTable";
import PriceTable from "../../components/common/product/PriceTable";
import ProductInfo from "../../components/common/product/BasicInfo";
import { productApi } from "../../../libs/api/product";
import type { ProductStoneDto } from "../../types/stone";
import type {
	ProductData,
	Product,
	CreateProductRequest,
} from "../../types/product";
import "../../styles/pages/ProductDetailPage.css";

function ProductDetailPage() {
	const { productId } = useParams<{ productId: string }>();
	const navigate = useNavigate();
	const [product, setProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const { handleError } = useErrorHandler();

	// 이미지 슬라이더 상태 관리
	const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

	// 이미지 슬라이더 네비게이션 함수들
	const nextImage = useCallback(() => {
		if (product?.productImageDtos && product.productImageDtos.length > 1) {
			setCurrentImageIndex((prev) =>
				prev === product.productImageDtos.length - 1 ? 0 : prev + 1
			);
		}
	}, [product?.productImageDtos]);

	const prevImage = useCallback(() => {
		if (product?.productImageDtos && product.productImageDtos.length > 1) {
			setCurrentImageIndex((prev) =>
				prev === 0 ? product.productImageDtos.length - 1 : prev - 1
			);
		}
	}, [product?.productImageDtos]);

	const goToImage = useCallback((index: number) => {
		setCurrentImageIndex(index);
	}, []);

	// 공장 선택 핸들러
	const handleFactorySelect = (factoryId: number, factoryName: string) => {
		// 상품 정보에도 반영
		if (product) {
			setProduct((prevProduct) => {
				if (!prevProduct) return prevProduct;
				const updatedProduct = {
					...prevProduct,
					factoryId: factoryId,
					factoryName: factoryName,
				};
				return updatedProduct;
			});
		}
	};

	// Product 변경 핸들러
	const handleProductChange = (updatedProduct: Partial<ProductData>) => {
		if (product) {
			setProduct((prevProduct) => {
				if (!prevProduct) return prevProduct;
				return {
					...prevProduct,
					...updatedProduct,
				};
			});
		}
	};
	// 스톤 정보 변경 핸들러
	const handleStoneChange = (
		stoneId: string,
		field: string,
		value: string | number | boolean
	) => {
		if (!product) return;

		setProduct((prevProduct) => {
			if (!prevProduct) return prevProduct;

			const updatedStones = prevProduct.productStoneDtos.map((stone) => {
				if (stone.productStoneId !== stoneId) return stone;

				// 등급별 가격 처리
				if (field.startsWith("grade_")) {
					const gradeNumber = field.split("_")[1];
					const gradeType = `GRADE_${gradeNumber}`;

					const updatedGradePolicies = stone.stoneWorkGradePolicyDtos.map(
						(policy) => {
							if (policy.grade === gradeType) {
								return { ...policy, laborCost: Number(value) };
							}
							return policy;
						}
					);

					return {
						...stone,
						stoneWorkGradePolicyDtos: updatedGradePolicies,
					};
				}

				// 일반 필드 처리
				switch (field) {
					case "stoneId":
						return { ...stone, stoneId: String(value) };
					case "stoneName":
						return { ...stone, stoneName: String(value) };
					case "stoneWeight":
						return { ...stone, stoneWeight: String(value) };
					case "stonePurchase":
						return { ...stone, stonePurchase: Number(value) };
					case "stoneQuantity":
						return { ...stone, stoneQuantity: Number(value) };
					case "mainStone":
						return { ...stone, mainStone: Boolean(value) };
					case "includeStone":
						return { ...stone, includeStone: Boolean(value) };
					case "note":
						return { ...stone, productStoneNote: String(value) };
					default:
						return stone;
				}
			});

			return {
				...prevProduct,
				productStoneDtos: updatedStones,
			};
		});
	};

	// 스톤 추가 핸들러
	const handleAddStone = () => {
		if (!product) return;

		// 새로운 스톤 ID 생성 (기존 스톤 ID의 최대값 + 1)
		const existingIds = product.productStoneDtos.map(
			(stone) => parseInt(stone.productStoneId.replace(/[^0-9]/g, "")) || 0
		);
		const newId = Math.max(...existingIds, 0) + 1;

		// 새로운 스톤 객체 생성 (임시 ID 사용)
		const newStone: ProductStoneDto = {
			productStoneId: `temp_${newId}`, // 임시 ID 사용
			stoneId: "",
			stoneName: "",
			stoneWeight: "0",
			mainStone: false,
			includeStone: true,
			stonePurchase: 0,
			stoneQuantity: 1,
			productStoneNote: "",
			stoneWorkGradePolicyDtos: [
				{
					workGradePolicyId: `policy_${newId}_1`,
					grade: "GRADE_1",
					laborCost: 0,
				},
				{
					workGradePolicyId: `policy_${newId}_2`,
					grade: "GRADE_2",
					laborCost: 0,
				},
				{
					workGradePolicyId: `policy_${newId}_3`,
					grade: "GRADE_3",
					laborCost: 0,
				},
				{
					workGradePolicyId: `policy_${newId}_4`,
					grade: "GRADE_4",
					laborCost: 0,
				},
			],
		};

		// 상품 상태에 새로운 스톤 추가
		setProduct((prevProduct) => {
			if (!prevProduct) return prevProduct;

			return {
				...prevProduct,
				productStoneDtos: [...prevProduct.productStoneDtos, newStone],
			};
		});
	};

	// 스톤 삭제 핸들러
	const handleDeleteStone = (stoneId: string) => {
		if (!product) return;

		if (window.confirm("정말로 이 스톤을 삭제하시겠습니까?")) {
			// 상품 상태에서 해당 스톤 제거
			setProduct((prevProduct) => {
				if (!prevProduct) return prevProduct;

				return {
					...prevProduct,
					productStoneDtos: prevProduct.productStoneDtos.filter(
						(stone) => stone.productStoneId !== stoneId
					),
				};
			});
		}
	};

	// 상품 상세 정보 로드
	const loadProductDetail = async () => {
		if (!productId) {
			setError("상품 ID가 없습니다.");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError("");

			const response = await productApi.getProduct(productId);

			if (isApiSuccess(response) && response.data) {
				setProduct(response.data);
			} else {
				setError("상품 정보를 불러올 수 없습니다.");
			}
		} catch (err: unknown) {
			handleError(err, setError);
		} finally {
			setLoading(false);
		}
	};

	// 상품 정보 저장
	const handleSaveProduct = async () => {
		if (!product) return;

		try {
			setLoading(true);

			// 서버 양식에 맞게 데이터 변환
			const serverData: CreateProductRequest = {
				factoryId: product.factoryId,
				productFactoryName: product.factoryName,
				productName: product.productName,
				setType: product.setTypeDto?.setTypeId || "",
				classification: product.classificationDto?.classificationId || "",
				material: product.materialDto?.materialId || "",
				standardWeight: product.standardWeight,
				productNote: product.productNote,
				productWorkGradePolicyGroupDto:
					product.productWorkGradePolicyGroupDto.map((group) => ({
						productGroupId: group.productGroupId,
						productPurchasePrice: group.productPurchasePrice,
						colorId: group.colorId || "",
						note: group.note || "",
						gradePolicyDtos: group.gradePolicyDtos.map((policy) => ({
							workGradePolicyId: policy.workGradePolicyId,
							laborCost: policy.laborCost,
						})),
					})),
				productStoneDtos: product.productStoneDtos.map((stone) => {
					const stoneData: {
						productStoneId?: string;
						stoneId: string;
						mainStone: boolean;
						includeStone: boolean;
						stoneQuantity: number;
						productStoneNote: string;
					} = {
						stoneId: stone.stoneId || "",
						mainStone: stone.mainStone,
						includeStone: stone.includeStone,
						stoneQuantity: stone.stoneQuantity || 0,
						productStoneNote: stone.productStoneNote || "",
					};

					if (
						stone.productStoneId &&
						!stone.productStoneId.startsWith("temp_")
					) {
						stoneData.productStoneId = stone.productStoneId;
					}

					return stoneData;
				}),
			};

			// 서버에 저장
			const response = await productApi.updateProduct(
				product.productId,
				serverData
			);

			if (isApiSuccess(response)) {
				alert(response.data || "상품 정보가 성공적으로 저장되었습니다.");
				loadProductDetail();
			} else {
				alert("저장에 실패했습니다: " + response.data);
			}
		} catch (error) {
			console.error("저장 오류:", error);
			alert("저장 중 오류가 발생했습니다.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadProductDetail();
	}, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

	// 상품이 변경될 때 이미지 인덱스 초기화
	useEffect(() => {
		setCurrentImageIndex(0);
	}, [product?.productImageDtos]);

	// 키보드 네비게이션
	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			if (product?.productImageDtos && product.productImageDtos.length > 1) {
				if (event.key === "ArrowLeft") {
					prevImage();
				} else if (event.key === "ArrowRight") {
					nextImage();
				}
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [nextImage, prevImage, product?.productImageDtos]);

	// 뒤로가기
	const handleGoBack = () => {
		navigate("/catalog");
	};

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
					<button onClick={handleGoBack} className="back-button">
						카탈로그로 돌아가기
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
					{/* 기본 정보 섹션 */}
					<ProductInfo
						product={product}
						showTitle={true}
						editable={true}
						onProductChange={handleProductChange}
						onFactorySelect={handleFactorySelect}
					/>

					{/* 이미지 섹션 */}
					<div className="image-section">
						{product.productImageDtos && product.productImageDtos.length > 0 ? (
							<div className="image-slider">
								{/* 메인 이미지 */}
								<div className="main-image-container">
									{product.productImageDtos.length > 1 && (
										<button className="image-nav prev" onClick={prevImage}>
											‹
										</button>
									)}
									<img
										src={`/@fs/C:/Users/zks14/Desktop/multi_module/product-service/src/main/resources${product.productImageDtos[currentImageIndex].imagePath}`}
										alt={`${product.productName} ${currentImageIndex + 1}`}
										onError={(e) => {
											e.currentTarget.src = "/images/not_ready.png";
										}}
									/>
									{product.productImageDtos.length > 1 && (
										<button className="image-nav next" onClick={nextImage}>
											›
										</button>
									)}
								</div>

								{/* 이미지 인디케이터 */}
								{product.productImageDtos.length > 1 && (
									<div className="image-indicators">
										{product.productImageDtos.map((_, index) => (
											<button
												key={index}
												className={`indicator ${
													index === currentImageIndex ? "active" : ""
												}`}
												onClick={() => goToImage(index)}
											>
												{index + 1}
											</button>
										))}
									</div>
								)}
							</div>
						) : (
							<div className="no-image">
								<img src="/images/not_ready.png" alt="이미지 없음" />
							</div>
						)}
					</div>
				</div>

				{/* 가격 정보 섹션 */}
				<PriceTable
					priceGroups={product.productWorkGradePolicyGroupDto}
					showTitle={true}
					editable={true}
					onPriceGroupChange={(updatedGroups) => {
						setProduct((prevProduct) => {
							if (!prevProduct) return prevProduct;
							return {
								...prevProduct,
								productWorkGradePolicyGroupDto: updatedGroups,
							};
						});
					}}
				/>

				{/* 스톤 정보 섹션 */}
				<StoneTable
					stones={product.productStoneDtos || []}
					showTitle={true}
					showTotalRow={true}
					showManualTotalRow={true}
					editable={true}
					showAddButton={true}
					fieldPermissions={{
						stoneName: false, // 스톤명: 수정 불가 (회색)
						stoneWeight: false, // 개당중량: 수정 불가 (회색)
						stonePurchase: false, // 구매단가: 수정 불가 (회색)
						grades: false, // 등급별 판매단가: 수정 불가 (회색)
						mainStone: true, // 메인구분: 수정 가능
						includeStone: true, // 적용: 수정 가능
						stoneQuantity: true, // 알수: 수정 가능
						note: true, // 비고: 수정 가능
					}}
					onStoneChange={handleStoneChange}
					onAddStone={handleAddStone}
					onDeleteStone={handleDeleteStone}
				/>

				{/* 버튼 섹션 */}
				<div className="action-buttons">
					<button onClick={handleGoBack} className="back-button">
						뒤로
					</button>
					<button
						onClick={handleSaveProduct}
						className="save-button"
						disabled={loading}
					>
						{loading ? "저장 중..." : "수정"}
					</button>
				</div>
			</div>
		</div>
	);
}

export default ProductDetailPage;
