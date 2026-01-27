import { useState, useEffect } from "react";
import { isApiSuccess } from "../../../libs/api/config";
import { productApi } from "../../../libs/api/productApi";
import { useErrorHandler } from "../../utils/errorHandler";
import { handleApiSubmit } from "../../utils/apiSubmitHandler";
import { useProductImageUpload } from "../../hooks/useProductImageUpload";
import ProductInfo from "../../components/common/product/BasicInfo";
import PriceTable from "../../components/common/product/PriceTable";
import StoneTable from "../../components/common/stone/StoneTable";
import type {
	CreateProductRequest,
	Product,
	ProductData,
} from "../../types/productDto";
import type { ProductWorkGradePolicyGroupDto } from "../../types/priceDto";
import type { ProductStoneDto } from "../../types/stoneDto";
import "../../styles/pages/product/ProductDetailPage.css";

const buildCreatePayload = (p: Product): CreateProductRequest => ({
	factoryId: p.factoryId || undefined,
	productFactoryName: p.productFactoryName ?? "",
	productName: p.productName ?? "",
	setType: p.setTypeDto?.setTypeId ?? "",
	classification: p.classificationDto?.classificationId ?? "",
	material: p.materialDto?.materialId ?? "",
	standardWeight: p.standardWeight ?? "0",
	productRelatedNumber: p.productRelatedNumber ?? "",
	productNote: p.productNote ?? "",
	productWorkGradePolicyGroupDto: (p.productWorkGradePolicyGroupDto || []).map(
		(g) => ({
			productGroupId: g.productGroupId || "", // 신규 그룹은 ID가 없을 수 있으므로 빈 문자열 처리
			productPurchasePrice: g.productPurchasePrice ?? 0,
			colorId: g.colorId,
			note: g.note ?? "",
			policyDtos: (g.policyDtos || []).map((pol) => ({
				grade: pol.grade,
				laborCost: pol.laborCost ?? 0,
			})),
		})
	),
	productStoneDtos: (p.productStoneDtos || []).map((s) => ({
		stoneId: s.stoneId || "",
		mainStone: !!s.mainStone,
		includeStone: !!s.includeStone,
		stoneQuantity: s.stoneQuantity ?? 0,
		productStoneNote: s.productStoneNote ?? "",
	})),
});

const EMPTY_PRODUCT: Product = {
	productId: "",
	productName: "",
	productFactoryName: "",
	standardWeight: "0",
	productRelatedNumber: "",
	productNote: "",
	factoryId: 0,
	factoryName: "",
	setTypeDto: { setTypeId: "1", setTypeName: "", setTypeNote: "" },
	classificationDto: {
		classificationId: "1",
		classificationName: "",
		classificationNote: "",
	},
	materialDto: {
		materialId: "1",
		materialName: "",
		materialGoldPurityPercent: "0.00",
	},
	productWorkGradePolicyGroupDto: [],
	productStoneDtos: [],
	productImageDtos: [],
};

const ProductCreatePage = () => {
	const [product, setProduct] = useState<Product>(EMPTY_PRODUCT);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const [imageFiles, setImageFiles] = useState<File[]>([]);
	const { handleError } = useErrorHandler();

	// 이미지 업로드 훅 사용
	const { uploadImages, uploading } = useProductImageUpload({
		onError: (errorMsg) => {
			alert(`상품은 생성되었으나 이미지 업로드에 실패했습니다: ${errorMsg}`);
		},
	});

	const validateProduct = (): boolean => {
		const errors: Record<string, string> = {};
		if (!product.productName.trim())
			errors.productName = "상품명은 필수 입력값입니다.";
		if (!product.factoryId || product.factoryId === 0)
			errors.factoryId = "제조사는 필수 선택값입니다.";
		if (!product.productFactoryName.trim())
			errors.productFactoryName = "제조사 품명은 필수 입력값입니다.";

		const groups = product.productWorkGradePolicyGroupDto || [];
		if (groups.length === 0) {
			errors["productWorkGradePolicyGroupDto[0]"] =
				"기본 공임 행을 1개 이상 등록하세요.";
		} else {
			const base = groups[0];
			if (!base.colorId || base.colorId === "0") {
				errors["productWorkGradePolicyGroupDto[0].colorId"] =
					"색상은 필수 선택값입니다.";
			}
			if (
				base.productPurchasePrice == null ||
				base.productPurchasePrice === undefined
			) {
				errors["productWorkGradePolicyGroupDto[0].productPurchasePrice"] =
					"구매 공임을 입력하세요.";
			}
			const policies = base.policyDtos || [];
			(["GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4"] as const).forEach(
				(g, order) => {
					const idx = policies.findIndex((p) => p.grade === g);
					const item = idx >= 0 ? policies[idx] : undefined;
					if (!item || item.laborCost == null || item.laborCost === undefined) {
						const key =
							idx >= 0
								? `productWorkGradePolicyGroupDto[0].policyDtos[${idx}].laborCost`
								: `productWorkGradePolicyGroupDto[0].policyDtos[${order}].laborCost`;
						errors[key] = `${g.replace("GRADE_", "")}등급 공임을 입력하세요.`;
					}
				}
			);
		}

		const emptyStoneIndex = product.productStoneDtos.findIndex(
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

	const handleFactorySelect = (factoryId: number, factoryName: string) =>
		setProduct((prev) => ({ ...prev, factoryId, factoryName }));

	const handleProductChange = (updated: Partial<ProductData>) =>
		setProduct((prev) => ({ ...prev, ...updated }));

	// 이미지 추가
	const handleImageAdd = (file: File) => {
		setImageFiles((prev) => [...prev, file]);
	};

	// 로컬 이미지 삭제 (인덱스 기반)
	const handleImageRemove = (index: number) => {
		setImageFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const handlePriceGroupChange = (updated: ProductWorkGradePolicyGroupDto[]) =>
		setProduct((prev) => ({
			...prev,
			productWorkGradePolicyGroupDto: updated,
		}));

	const handleStoneChange = (
		rowId: string,
		field: string,
		value: string | number | boolean
	) =>
		setProduct((prev) => {
			const updated = prev.productStoneDtos.map((stone) => {
				if (stone.productStoneId !== rowId) return stone;

				if (field.startsWith("grade_")) {
					const num = field.split("_")[1];
					const grade = `GRADE_${num}`;
					const policies = (stone.stoneWorkGradePolicyDtos || []).map((p) =>
						p.grade === grade ? { ...p, laborCost: Number(value) } : p
					);
					return { ...stone, stoneWorkGradePolicyDtos: policies };
				}

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
			return { ...prev, productStoneDtos: updated };
		});

	const handleAddStone = () =>
		setProduct((prev) => {
			const seq = prev.productStoneDtos.length + 1;
			const newStone: ProductStoneDto = {
				productStoneId: `new_${Date.now()}_${seq}`,
				stoneId: "",
				stoneName: "",
				stoneWeight: "",
				mainStone: false,
				includeStone: true,
				stonePurchase: 0,
				stoneQuantity: 1,
				productStoneNote: "",
				stoneWorkGradePolicyDtos: [
					{ workGradePolicyId: "", grade: "GRADE_1", laborCost: 0 },
					{ workGradePolicyId: "", grade: "GRADE_2", laborCost: 0 },
					{ workGradePolicyId: "", grade: "GRADE_3", laborCost: 0 },
					{ workGradePolicyId: "", grade: "GRADE_4", laborCost: 0 },
				],
			};
			return {
				...prev,
				productStoneDtos: [...prev.productStoneDtos, newStone],
			};
		});

	const handleDeleteStone = (rowId: string) =>
		setProduct((prev) => ({
			...prev,
			productStoneDtos: prev.productStoneDtos.filter(
				(s) => s.productStoneId !== rowId
			),
		}));

	const handleCreateProduct = async () => {
		try {
			setLoading(true);
			setError("");
			setValidationErrors({});
			if (!validateProduct()) return;

			const payload = buildCreatePayload(product);
			const res = await productApi.createProduct(payload);

			if (isApiSuccess(res)) {
				const createdProductId = String(res.data);
				if (imageFiles.length > 0 && createdProductId) {
					await uploadImages(createdProductId, imageFiles);
				}

				const { factoryId, factoryName } = product;
				const again = window.confirm(
					"상품이 생성되었습니다.\n추가 등록 하시겠습니까?"
				);
				if (again) {
					setProduct({ ...EMPTY_PRODUCT, factoryId, factoryName });
					setValidationErrors({});
					setError("");
					setImageFiles([]);
				} else {
					await handleApiSubmit({
						promises: [Promise.resolve(res)],
						successMessage: "상품이 생성되었습니다.",
						parentMessageType: "PRODUCT_CREATED",
						logMessage: "상품 생성",
					});
				}
			}
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleGoBack = () => window.close();

	useEffect(() => {}, []);

	return (
		<div className="product-detail-page">
			{/* 에러 메시지 */}
			{error && (
				<div className="error-message">
					<span>⚠️</span>
					<p>{error}</p>
				</div>
			)}

			<div className="detail-content">
				<div className="top-section">
					<ProductInfo
						product={product}
						showTitle
						editable
						imageFiles={imageFiles}
						onProductChange={handleProductChange}
						onFactorySelect={handleFactorySelect}
						onImageAdd={handleImageAdd}
						onImageRemove={handleImageRemove}
						validationErrors={validationErrors}
						maxImages={5}
					/>
				</div>

				<PriceTable
					priceGroups={product.productWorkGradePolicyGroupDto}
					showTitle
					editable
					onPriceGroupChange={handlePriceGroupChange}
					validationErrors={validationErrors}
				/>

				<StoneTable
					stones={product.productStoneDtos}
					showTitle
					showTotalRow
					showManualTotalRow
					editable
					showAddButton
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

				<div className="action-buttons">
					<button onClick={handleGoBack} className="back-button">
						뒤로
					</button>
					<button
						onClick={handleCreateProduct}
						className="save-button"
						disabled={loading || uploading}
					>
						{loading || uploading ? "생성 중..." : "생성"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ProductCreatePage;
