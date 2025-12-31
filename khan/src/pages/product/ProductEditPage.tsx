import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { isApiSuccess } from "../../../libs/api/config";
import { useErrorHandler } from "../../utils/errorHandler";
import { useProductImageUpload } from "../../hooks/useProductImageUpload";
import StoneTable from "../../components/common/stone/StoneTable";
import PriceTable from "../../components/common/product/PriceTable";
import ProductInfo from "../../components/common/product/BasicInfo";
import { productApi } from "../../../libs/api/product";
import type { ProductStoneDto } from "../../types/stone";
import type {
	ProductData,
	Product,
	UpdateProductRequest,
} from "../../types/product";
import "../../styles/pages/product/ProductDetailPage.css";

function ProductEditPage() {
	const { productId } = useParams<{ productId: string }>();
	const [product, setProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const [imageFile, setImageFile] = useState<File | null>(null);
	const { handleError } = useErrorHandler();

	// 이미지 업로드 훅 사용
	const { uploadImage, uploading } = useProductImageUpload({
		onError: (errorMsg) => {
			alert(`이미지 업로드에 실패했습니다: ${errorMsg}`);
		},
	});

	// 공장 선택 핸들러
	const handleFactorySelect = (factoryId: number, factoryName: string) => {
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

	// 이미지 변경 핸들러
	const handleImageChange = (file: File | null) => {
		setImageFile(file);
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

		const existingIds = product.productStoneDtos.map(
			(stone) => parseInt(stone.productStoneId.replace(/[^0-9]/g, "")) || 0
		);
		const newId = Math.max(...existingIds, 0) + 1;

		const newStone: ProductStoneDto = {
			productStoneId: `temp_${newId}`,
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

	const validateProduct = (): boolean => {
		const errors: Record<string, string> = {};
		if (!product!.productName.trim())
			errors.productName = "상품명은 필수 입력값입니다.";
		if (!product!.factoryId || product!.factoryId === 0)
			errors.factoryId = "제조사는 필수 선택값입니다.";
		if (!product!.productFactoryName.trim())
			errors.productFactoryName = "제조사 품명은 필수 입력값입니다.";

		const groups = product!.productWorkGradePolicyGroupDto || [];
		if (groups.length === 0) {
			errors["productWorkGradePolicyGroupDto[0]"] =
				"기본 공임 행을 1개 이상 등록하세요.";
		} else {
			const base = groups[0];
			if (!base.colorId || base.colorId === "0") {
				errors["productWorkGradePolicyGroupDto[0].colorId"] =
					"색상은 필수 선택값입니다.";
			}
			if (base.productPurchasePrice == null || base.productPurchasePrice <= 0) {
				errors["productWorkGradePolicyGroupDto[0].productPurchasePrice"] =
					"구매 공임을 입력하세요.";
			}
			const policies = base.policyDtos || [];
			(["GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4"] as const).forEach(
				(g, order) => {
					const idx = policies.findIndex((p) => p.grade === g);
					const item = idx >= 0 ? policies[idx] : undefined;
					if (!item || item.laborCost == null || item.laborCost <= 0) {
						const key =
							idx >= 0
								? `productWorkGradePolicyGroupDto[0].policyDtos[${idx}].laborCost`
								: `productWorkGradePolicyGroupDto[0].policyDtos[${order}].laborCost`;
						errors[key] = `${g.replace("GRADE_", "")}등급 공임을 입력하세요.`;
					}
				}
			);
		}

		const emptyStoneIndex = product!.productStoneDtos.findIndex(
			(stone) => !stone.stoneId || stone.stoneId.trim() === ""
		);

		if (emptyStoneIndex !== -1) {
			alert(
				`[No.${
					emptyStoneIndex + 1
				}] 스톤이 선택되지 않았습니다.\n\n스톤을 선택하거나, 해당 행을 삭제한 후 다시 시도해주세요.`
			);
			return false; // 유효성 검사 실패 -> 저장 중단
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	// 상품 정보 저장
	const handleSaveProduct = async () => {
		if (!product) return;
		if (!validateProduct()) return;

		// 유효성 검사
		if (!product.productName.trim()) {
			alert("상품명은 필수 입력값입니다.");
			setLoading(false);
			return;
		}
		if (!product.factoryId || product.factoryId === 0) {
			alert("제조사는 필수 선택값입니다.");
			setLoading(false);
			return;
		}
		if (!product.productFactoryName.trim()) {
			alert("제조사 품명은 필수 입력값입니다.");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);

			const serverData: UpdateProductRequest = {
				factoryId: product.factoryId,
				productFactoryName: product.productFactoryName,
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
						policyDtos: group.policyDtos.map((policy) => ({
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

			const response = await productApi.updateProduct(
				product.productId,
				serverData
			);

			if (isApiSuccess(response)) {
				// 이미지 업로드 (이미지 파일이 있을 경우)
				if (imageFile && product.productId) {
					await uploadImage(product.productId, imageFile);
				}

				alert(response.data || "상품 정보가 성공적으로 저장되었습니다.");
				setImageFile(null);
				loadProductDetail();

				// 부모 창 새로고침
				if (window.opener && !window.opener.closed) {
					window.opener.location.reload();
				}
			}
		} catch (error) {
			handleError(error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadProductDetail();
	}, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

	// 상품 삭제
	const handleDeleteProduct = async () => {
		if (!product) return;

		if (
			!window.confirm(
				`정말로 "${product.productName}" 상품을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
			)
		) {
			return;
		}

		try {
			setLoading(true);

			const response = await productApi.deleteProduct(product.productId);

			if (isApiSuccess(response)) {
				alert("상품이 삭제되었습니다.");

				// 부모 창 새로고침
				if (window.opener && !window.opener.closed) {
					window.opener.location.reload();
				}

				window.close();
			} else {
				alert("삭제에 실패했습니다: " + response.message);
			}
		} catch (error) {
			handleError(error);
		} finally {
			setLoading(false);
		}
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
				<div className="top-section">
					<ProductInfo
						product={product}
						showTitle={true}
						editable={true}
						onProductChange={handleProductChange}
						onFactorySelect={handleFactorySelect}
						onImageChange={handleImageChange}
						validationErrors={validationErrors}
					/>
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
					validationErrors={validationErrors}
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
						stoneName: false,
						stoneWeight: false,
						stonePurchase: false,
						grades: false,
						mainStone: true,
						includeStone: true,
						stoneQuantity: true,
						note: true,
					}}
					onStoneChange={handleStoneChange}
					onAddStone={handleAddStone}
					onDeleteStone={handleDeleteStone}
				/>

				{/* 버튼 섹션 */}
				<div className="action-buttons">
					<button onClick={() => window.close()} className="reset-btn-common">
						닫기
					</button>
					<button
						onClick={handleSaveProduct}
						className="common-btn-common"
						disabled={loading || uploading}
					>
						{loading || uploading ? "저장 중..." : "수정"}
					</button>
					<button
						onClick={handleDeleteProduct}
						className="delete-btn-common"
						disabled={loading}
					>
						{loading ? "처리 중..." : "삭제"}
					</button>
				</div>
			</div>
		</div>
	);
}

export default ProductEditPage;
