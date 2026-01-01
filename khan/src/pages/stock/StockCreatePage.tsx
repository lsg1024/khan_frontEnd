import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { stockApi } from "../../../libs/api/stock";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { goldHarryApi } from "../../../libs/api/goldHarry";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { productApi } from "../../../libs/api/product";
import { useErrorHandler } from "../../utils/errorHandler";
import { useSearchModal } from "../../hooks/useSearchModal";
import { usePreviousRowCopy } from "../../hooks/usePreviousRowCopy";
import { getLocalDate } from "../../utils/dateUtils";
import type { PastOrderDto } from "../../types/order";
import type { Product, ProductDto } from "../../types/product";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto, AccountInfoDto } from "../../types/store";
import type { StockOrderRows, StockCreateRequest } from "../../types/stock";
import StockTable from "../../components/common/stock/StockTable";
import StoreSearch from "../../components/common/store/StoreSearch";
import FactorySearch from "../../components/common/factory/FactorySearch";
import ProductSearch from "../../components/common/product/ProductSearch";
import PastOrderHistory from "../../components/common/PastOrderHistory";
import ProductInfoSection from "../../components/common/ProductInfoSection";
import { calculateStoneDetails } from "../../utils/calculateStone";
import type { MaterialDto } from "../../types/material";
import type { ColorDto } from "../../types/color";
import type { AssistantStoneDto } from "../../types/AssistantStoneDto";
import type { goldHarryResponse as GoldHarryDto } from "../../types/goldHarry";
import "../../styles/pages/stock/StockCreatePage.css";

type UpdateMode = "normal" | "return" | "expact";

const MODE_TO_STATUS = {
	normal: "NORMAL",
	return: "RETURN",
	expact: "EXPACT",
} as const satisfies Record<UpdateMode, "NORMAL" | "RETURN" | "EXPACT">;

export const StockCreatePage = () => {
	const { handleError } = useErrorHandler();
	const { mode } = useParams<{
		mode: UpdateMode;
	}>();
	const [searchParams] = useSearchParams();

	// 재고 행 데이터
	const [stockRows, setStockRows] = useState<StockOrderRows[]>([]);
	const orderStatus = MODE_TO_STATUS[mode as UpdateMode]; // api 상태값으로 사용

	// 검색 모달 상태 - 커스텀 훅 사용
	const storeModal = useSearchModal();
	const factoryModal = useSearchModal();
	const productModal = useSearchModal();

	// 드롭다운 데이터
	const [materials, setMaterials] = useState<
		MaterialDto[]
	>([]);
	const [colors, setColors] = useState<
		ColorDto[]
	>([]);
	const [assistantStones, setAssistantStones] = useState<
		AssistantStoneDto[]
	>([]);
	const [goldHarries, setGoldHarries] = useState<
		GoldHarryDto[]
	>([]);

	// 상품 상세 정보 관련 state
	const [currentProductDetail, setCurrentProductDetail] =
		useState<Product | null>(null);

	// 과거 주문 데이터 관련 state
	const [pastOrdersCache, setPastOrdersCache] = useState<
		Map<string, PastOrderDto[]>
	>(new Map());
	const [currentDisplayedPastOrders, setCurrentDisplayedPastOrders] = useState<
		PastOrderDto[]
	>([]);

	// 진행 중인 API 호출 추적 (중복 방지용)
	const [pendingRequests, setPendingRequests] = useState<Set<string>>(
		new Set()
	);

	const [loading, setLoading] = useState(false);

	const currentDate = getLocalDate();

	// 과거 주문 데이터 가져오기
	const fetchPastOrders = async (
		storeId: string,
		productId: string,
		materialName: string
	) => {
		const cacheKey = `${storeId}-${productId}-${materialName}`;
		if (pastOrdersCache.has(cacheKey)) {
			setCurrentDisplayedPastOrders(pastOrdersCache.get(cacheKey) || []);
			return;
		}

		try {
			const response = await orderApi.getPastOrders(
				parseInt(storeId),
				parseInt(productId),
				materialName
			);
			if (response.success && response.data) {
				setPastOrdersCache((prev) =>
					new Map(prev).set(cacheKey, response.data!)
				);
				setCurrentDisplayedPastOrders(response.data);
			}
		} catch (err) {
			handleError(err);
		} finally {
			pendingRequests.delete(cacheKey);
			setPendingRequests(new Set(pendingRequests));
		}
	};

	// 재고 행 데이터 업데이트
	const updateStockRow = useCallback(
		(id: string, field: keyof StockOrderRows, value: unknown) => {
			setStockRows((prevRows) => {
				return prevRows.map((row) => {
					if (row.id === id) {
						const {
							storeId: prevStore,
							productId: prevProduct,
							materialName: prevMaterial,
						} = row;

						const updatedRow = { ...row, [field]: value };

						const {
							storeId: nextStore,
							productId: nextProduct,
							materialName: nextMaterial,
						} = updatedRow;

						const isAllPresent = nextStore && nextProduct && nextMaterial;
						const isChanged =
							prevStore !== nextStore ||
							prevProduct !== nextProduct ||
							prevMaterial !== nextMaterial;

						if (isAllPresent && isChanged) {
							fetchPastOrders(nextStore, nextProduct, nextMaterial);
						}

						return updatedRow;
					}
					return row;
				});
			});
		},
		[pastOrdersCache]
	); // fetchPastOrders도 useCallback 처리가 되어있어야 안전합니다.

	// 이전 행 복사 기능 - 커스텀 훅 사용
	const { handleRequiredFieldClick } = usePreviousRowCopy(
		stockRows,
		updateStockRow
	);

	// 상품 상세 정보 가져오기
	const fetchProductDetail = async (
		productId: string
	): Promise<Product | null> => {
		try {
			const response = await productApi.getProduct(productId);

			if (response.success && response.data) {
				return response.data;
			}

			return null;
		} catch {
			return null;
		}
	};

	// 필수 선택 순서 체크 함수들
	const checkStoreSelected = (rowId: string): boolean => {
		const row = stockRows.find((r) => r.id === rowId);
		return !!(row?.storeId && row?.storeName);
	};

	const checkProductSelected = (rowId: string): boolean => {
		const row = stockRows.find((r) => r.id === rowId);
		return !!(row?.productId && row?.productName);
	};

	const checkMaterialSelected = (rowId: string): boolean => {
		const row = stockRows.find((r) => r.id === rowId);
		return !!(row?.materialId && row?.materialName);
	};

	// 필수 선택 순서 체크 및 알림
	const validateSequence = (
		rowId: string,
		currentStep: "product" | "material" | "other" | "color"
	): boolean => {
		if (currentStep === "product" && !checkStoreSelected(rowId)) {
			alert("거래처를 먼저 선택해주세요.");
			openStoreSearch(rowId);
			return false;
		}

		if (currentStep === "material" && !checkStoreSelected(rowId)) {
			alert("거래처를 먼저 선택해주세요.");
			openStoreSearch(rowId);
			return false;
		}

		if (currentStep === "material" && !checkProductSelected(rowId)) {
			alert("모델번호를 먼저 선택해주세요.");
			openProductSearch(rowId);
			return false;
		}

		if (currentStep === "color" && !checkStoreSelected(rowId)) {
			alert("거래처를 먼저 선택해주세요.");
			openStoreSearch(rowId);
			return false;
		}

		if (currentStep === "other" && !checkStoreSelected(rowId)) {
			alert("거래처를 먼저 선택해주세요.");
			openStoreSearch(rowId);
			return false;
		}

		if (currentStep === "other" && !checkProductSelected(rowId)) {
			alert("모델번호를 먼저 선택해주세요.");
			openProductSearch(rowId);
			return false;
		}

		if (currentStep === "other" && !checkMaterialSelected(rowId)) {
			alert("재질을 먼저 선택해주세요.");
			const materialSelect = document.querySelector(
				`[data-row-id="${rowId}"][data-field="material"]`
			) as HTMLSelectElement;
			if (materialSelect) {
				materialSelect.focus();
			}
			return false;
		}
		return true;
	};

	const isRowInputEnabled = (currentIndex: number): boolean => {
		if (currentIndex === 0) return true; // 첫 번째 행은 항상 입력 가능

		// 바로 직전 행의 필수값이 완성되어 있으면 입력 가능
		const prevRow = stockRows[currentIndex - 1];
		return !!(
			prevRow &&
			prevRow.storeId &&
			prevRow.productId &&
			prevRow.materialId &&
			prevRow.colorId
		);
	};

	// productId가 있을 때 상품 상세 정보 업데이트
	const updateProductDetail = async (
		productId?: string,
		rowId?: string,
		overrideGrade?: string
	) => {
		if (!productId) {
			setCurrentProductDetail(null);
			return;
		}

		const productDetail = await fetchProductDetail(productId);
		setCurrentProductDetail(productDetail);

		if (productDetail && rowId) {
			const targetRow = stockRows.find((row) => row.id === rowId);
			if (!targetRow) return;

			// overrideGrade가 있으면 사용, 없으면 현재 row의 grade 사용
			const storeGrade = overrideGrade || targetRow.grade || "1";
			const policyGrade = `GRADE_${storeGrade}`;

			// 상품 기본 정보 업데이트
			updateStockRow(rowId, "productId", productDetail.productId);
			updateStockRow(rowId, "productName", productDetail.productName);
			updateStockRow(
				rowId,
				"productFactoryName",
				productDetail.productFactoryName || ""
			);
			updateStockRow(rowId, "factoryId", productDetail.factoryId);
			updateStockRow(rowId, "factoryName", productDetail.factoryName);

			// Classification과 SetType 정보
			updateStockRow(
				rowId,
				"classificationId",
				productDetail.classificationDto?.classificationId || ""
			);
			updateStockRow(
				rowId,
				"classificationName",
				productDetail.classificationDto?.classificationName || ""
			);
			updateStockRow(
				rowId,
				"setTypeId",
				productDetail.setTypeDto?.setTypeId || ""
			);
			updateStockRow(
				rowId,
				"setTypeName",
				productDetail.setTypeDto?.setTypeName || ""
			);

			// 스톤 정보 변환 및 업데이트
			const transformedStoneInfos = productDetail.productStoneDtos.map(
				(stone) => {
					const matchingPolicy = stone.stoneWorkGradePolicyDtos.find(
						(policy) => policy.grade === policyGrade
					);

					const laborCost = matchingPolicy
						? matchingPolicy.laborCost
						: stone.stoneWorkGradePolicyDtos[0]?.laborCost || 0;

					return {
						stoneId: stone.stoneId,
						stoneName: stone.stoneName,
						stoneWeight: stone.stoneWeight,
						purchaseCost: stone.stonePurchase,
						laborCost: laborCost,
						quantity: stone.stoneQuantity,
						mainStone: stone.mainStone,
						includeStone: stone.includeStone,
						addLaborCost: 0,
					};
				}
			);

			updateStockRow(rowId, "stoneInfos", transformedStoneInfos);

			// 알 가격 및 개수 계산
			const calculatedStoneData = calculateStoneDetails(transformedStoneInfos);

			updateStockRow(
				rowId,
				"mainStonePrice",
				calculatedStoneData.mainStonePrice
			);
			updateStockRow(
				rowId,
				"mainStoneCount",
				calculatedStoneData.mainStoneCount
			);
			updateStockRow(
				rowId,
				"assistanceStonePrice",
				calculatedStoneData.assistanceStonePrice
			);
			updateStockRow(
				rowId,
				"assistanceStoneCount",
				calculatedStoneData.assistanceStoneCount
			);
			updateStockRow(
				rowId,
				"stoneAddLaborCost",
				calculatedStoneData.stoneAddLaborCost
			);
			updateStockRow(
				rowId,
				"stoneWeightTotal",
				calculatedStoneData.stoneWeight
			);
			updateStockRow(
				rowId,
				"stoneWeight",
				calculatedStoneData.stoneWeight.toString()
			);

			// 재질 자동 선택
			if (productDetail.materialDto?.materialName) {
				const foundMaterial = materials.find(
					(m) => m.materialName === productDetail.materialDto?.materialName
				);
				if (foundMaterial) {
					updateStockRow(rowId, "materialId", foundMaterial.materialId);
					updateStockRow(rowId, "materialName", foundMaterial.materialName);
				}
			}
		}
	};

	// 행에 포커스가 활성화될 때 과거 주문 데이터와 상품 상세 정보 표시
	const handleRowFocus = async (rowId: string) => {
		const row = stockRows.find((r) => r.id === rowId);
		if (!row) return;

		if (row.productId) {
			if (
				!currentProductDetail ||
				currentProductDetail.productId !== row.productId
			) {
				productApi.getProduct(row.productId).then((res) => {
					if (res.success) setCurrentProductDetail(res.data);
				});
			}
		} else {
			setCurrentProductDetail(null);
		}

		if (row.storeId && row.productId && row.materialName) {
			const cacheKey = `${row.storeId}-${row.productId}-${row.materialName}`;
			setCurrentDisplayedPastOrders(pastOrdersCache.get(cacheKey) || []);
		} else {
			setCurrentDisplayedPastOrders([]);
		}
	};

	// 검색 컴포넌트 핸들러들
	const openStoreSearch = (rowId: string) => {
		storeModal.openModal(rowId);
	};

	const handleStoreSelect = async (store: StoreSearchDto | AccountInfoDto) => {
		if (storeModal.selectedRowId) {
			const storeIdValue = store.accountId?.toString();
			const rowId = storeModal.selectedRowId;
			const newGrade = store.grade || "1";

			updateStockRow(rowId, "storeId", storeIdValue);
			updateStockRow(rowId, "storeName", store.accountName || "");
			updateStockRow(rowId, "storeHarry", store.goldHarryLoss || "");
			updateStockRow(rowId, "grade", newGrade);

			// 거래처 변경 시 이미 선택된 상품이 있으면 새로운 등급으로 알 단가 재계산
			const currentRow = stockRows.find((r) => r.id === rowId);
			if (currentRow?.productId) {
				// 새로운 등급을 직접 전달하여 상품 상세 정보 재계산
				await updateProductDetail(currentRow.productId, rowId, newGrade);
			}
		}
		storeModal.handleSelect();
	};

	const openFactorySearch = (rowId: string) => {
		factoryModal.openModal(rowId);
	};

	const handleFactorySelect = (factory: FactorySearchDto) => {
		if (factoryModal.selectedRowId) {
			updateStockRow(
				factoryModal.selectedRowId,
				"factoryId",
				factory.factoryId?.toString()
			);
			updateStockRow(
				factoryModal.selectedRowId,
				"factoryName",
				factory.factoryName || ""
			);
		}
		factoryModal.handleSelect();
	};

	const openProductSearch = (rowId: string) => {
		if (!validateSequence(rowId, "product")) {
			return;
		}
		const row = stockRows.find((r) => r.id === rowId);
		const grade = row?.grade || "1";
		productModal.openModal(rowId, { grade: grade });
	};

	const handleProductSelect = async (product: ProductDto) => {
		if (productModal.selectedRowId) {
			const productIdValue = product.productId;
			const factoryIdValue = product.factoryId;

			// 상품 상세 정보를 먼저 가져오기
			const currentProductDetail = await fetchProductDetail(productIdValue);
			setCurrentProductDetail(currentProductDetail);

			// 기본 상품 정보 업데이트
			updateStockRow(productModal.selectedRowId, "productId", productIdValue);
			updateStockRow(
				productModal.selectedRowId,
				"productName",
				product.productName || ""
			);
			updateStockRow(
				productModal.selectedRowId,
				"productFactoryName",
				product.productFactoryName || ""
			);
			updateStockRow(productModal.selectedRowId, "factoryId", factoryIdValue);
			updateStockRow(
				productModal.selectedRowId,
				"factoryName",
				product.factoryName || ""
			);
			updateStockRow(
				productModal.selectedRowId,
				"productLaborCost",
				product.productLaborCost || 0
			);
			updateStockRow(
				productModal.selectedRowId,
				"productPurchaseCost",
				product.productPurchaseCost || 0
			);

			// classification과 setType 정보 설정
			if (currentProductDetail) {
				updateStockRow(
					productModal.selectedRowId,
					"classificationId",
					currentProductDetail.classificationDto?.classificationId || ""
				);
				updateStockRow(
					productModal.selectedRowId,
					"classificationName",
					currentProductDetail.classificationDto?.classificationName || ""
				);
				updateStockRow(
					productModal.selectedRowId,
					"setTypeId",
					currentProductDetail.setTypeDto?.setTypeId || ""
				);
				updateStockRow(
					productModal.selectedRowId,
					"setTypeName",
					currentProductDetail.setTypeDto?.setTypeName || ""
				);

				// stoneInfos 설정 (등급에 맞는 단가 적용)
				const currentRow = stockRows.find(
					(r) => r.id === productModal.selectedRowId
				);
				const storeGrade = currentRow?.grade || "1";
				const policyGrade = `GRADE_${storeGrade}`;

				const transformedStoneInfos = currentProductDetail.productStoneDtos.map(
					(stone) => {
						const matchingPolicy = stone.stoneWorkGradePolicyDtos.find(
							(policy) => policy.grade === policyGrade
						);

						const laborCost = matchingPolicy
							? matchingPolicy.laborCost
							: stone.stoneWorkGradePolicyDtos[0]?.laborCost || 0;

						return {
							stoneId: stone.stoneId,
							stoneName: stone.stoneName,
							stoneWeight: stone.stoneWeight,
							purchaseCost: stone.stonePurchase,
							laborCost: laborCost,
							quantity: stone.stoneQuantity,
							mainStone: stone.mainStone,
							includeStone: stone.includeStone,
							addLaborCost: 0,
						};
					}
				);

				updateStockRow(
					productModal.selectedRowId,
					"stoneInfos",
					transformedStoneInfos
				);

				// stoneInfos로부터 알 가격과 개수 계산 (등급별 단가 반영)
				const calculatedStoneData = calculateStoneDetails(
					transformedStoneInfos
				);

				updateStockRow(
					productModal.selectedRowId,
					"mainStonePrice",
					calculatedStoneData.mainStonePrice
				);
				updateStockRow(
					productModal.selectedRowId,
					"mainStoneCount",
					calculatedStoneData.mainStoneCount
				);
				updateStockRow(
					productModal.selectedRowId,
					"assistanceStonePrice",
					calculatedStoneData.assistanceStonePrice
				);
				updateStockRow(
					productModal.selectedRowId,
					"assistanceStoneCount",
					calculatedStoneData.assistanceStoneCount
				);
				updateStockRow(
					productModal.selectedRowId,
					"stoneAddLaborCost",
					calculatedStoneData.stoneAddLaborCost
				);
				updateStockRow(
					productModal.selectedRowId,
					"stoneWeightTotal",
					calculatedStoneData.stoneWeight
				);
				updateStockRow(
					productModal.selectedRowId,
					"stoneWeight",
					calculatedStoneData.stoneWeight.toString()
				);
			} else {
				// productDetail이 없으면 product.productStones로 fallback
				const mainStone = product.productStones.find(
					(stone) => stone.mainStone
				);
				const mainStonePrice = mainStone
					? (mainStone.laborCost || 0) * (mainStone.stoneQuantity || 0)
					: 0;
				const mainStoneCount = mainStone?.stoneQuantity || 0;

				updateStockRow(
					productModal.selectedRowId,
					"mainStonePrice",
					mainStonePrice
				);
				updateStockRow(
					productModal.selectedRowId,
					"mainStoneCount",
					mainStoneCount
				);

				const assistanceStone = product.productStones.find(
					(stone) => !stone.mainStone
				);
				const assistanceStonePrice = assistanceStone
					? (assistanceStone.laborCost || 0) *
					  (assistanceStone.stoneQuantity || 0)
					: 0;
				const assistanceStoneCount = assistanceStone?.stoneQuantity || 0;

				updateStockRow(
					productModal.selectedRowId,
					"assistanceStonePrice",
					assistanceStonePrice
				);
				updateStockRow(
					productModal.selectedRowId,
					"assistanceStoneCount",
					assistanceStoneCount
				);
			}

			// productMaterial 값이 있으면 자동으로 드롭다운에서 선택
			if (product.productMaterial) {
				const foundMaterial = materials.find(
					(m) => m.materialName === product.productMaterial
				);
				if (foundMaterial) {
					updateStockRow(
						productModal.selectedRowId,
						"materialId",
						foundMaterial.materialId
					);
					updateStockRow(
						productModal.selectedRowId,
						"materialName",
						foundMaterial.materialName
					);
				}
			}

			// productColor 값이 있으면 자동으로 드롭다운에서 선택
			if (product.productColor) {
				const foundColor = colors.find(
					(c) => c.colorName === product.productColor
				);
				if (foundColor) {
					updateStockRow(
						productModal.selectedRowId,
						"colorId",
						foundColor.colorId
					);
					updateStockRow(
						productModal.selectedRowId,
						"colorName",
						foundColor.colorName
					);
				}
			}
		}
		productModal.handleSelect();
	};

	// 보조석 입고 여부 변경 핸들러
	const handleAssistanceStoneArrivalChange = (id: string, value: string) => {
		if (value === "Y") {
			updateStockRow(id, "assistantStone", true);
			updateStockRow(id, "assistantStoneCreateAt", currentDate);
		} else {
			updateStockRow(id, "assistantStone", false);
			updateStockRow(id, "assistantStoneCreateAt", "");
		}
	};

	// 스톤 정보 관리 모달 열기
	const openStoneInfoManager = (rowId: string) => {
		const url = `/stock/stone-info?rowId=${rowId}&origin=${window.location.origin}`;
		const NAME = `stoneInfo_${rowId}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1200,height=500";

		const popup = window.open(url, NAME, FEATURES);
		if (popup) {
			popup.focus();
			const handleMessage = (event: MessageEvent) => {
				if (
					event.data.type === "REQUEST_STONE_INFO" &&
					event.data.rowId === rowId
				) {
					const row = stockRows.find((r) => r.id === rowId);
					popup.postMessage(
						{
							type: "STONE_INFO_DATA",
							stoneInfos: row?.stoneInfos || [],
						},
						window.location.origin
					);
				} else if (
					event.data.type === "STONE_INFO_SAVE" &&
					event.data.rowId === rowId
				) {
					updateStockRow(rowId, "stoneInfos", event.data.stoneInfos);

					const calculatedStoneData = calculateStoneDetails(
						event.data.stoneInfos
					);
					updateStockRow(
						rowId,
						"mainStonePrice",
						calculatedStoneData.mainStonePrice
					);
					updateStockRow(
						rowId,
						"assistanceStonePrice",
						calculatedStoneData.assistanceStonePrice
					);
					updateStockRow(
						rowId,
						"stoneAddLaborCost",
						calculatedStoneData.stoneAddLaborCost
					);
					updateStockRow(
						rowId,
						"mainStoneCount",
						calculatedStoneData.mainStoneCount
					);
					updateStockRow(
						rowId,
						"assistanceStoneCount",
						calculatedStoneData.assistanceStoneCount
					);
					updateStockRow(
						rowId,
						"stoneWeightTotal",
						calculatedStoneData.stoneWeight
					);
					updateStockRow(
						rowId,
						"stoneWeight",
						calculatedStoneData.stoneWeight.toString()
					);
				}
			};

			window.addEventListener("message", handleMessage);

			const checkClosed = setInterval(() => {
				if (popup.closed) {
					window.removeEventListener("message", handleMessage);
					clearInterval(checkClosed);
				}
			}, 1000);
		}
	};

	const resetOrderRow = (id: string) => {
		if (window.confirm("초기화하시겠습니까?")) {
			// assistantStoneId가 "1"인 보조석 찾기
			const defaultAssistantStone =
				assistantStones.find((a) => a.assistantStoneId.toString() === "1") ||
				assistantStones[0] ||
				null;

			setStockRows((prevRows) =>
				prevRows.map((row) => {
					if (row.id === id) {
						return {
							...row,
							createAt: currentDate,
							storeId: "",
							storeName: "",
							grade: "1",
							productId: "",
							productName: "",
							materialId: "",
							materialName: "",
							colorId: "1",
							colorName: "",
							factoryId: "",
							factoryName: "",
							productSize: "",
							productPurchaseCost: 0,
							goldWeight: "",
							stoneWeight: "0",
							isProductWeightSale: false,
							mainStoneNote: "",
							assistanceStoneNote: "",
							orderNote: "",
							stoneInfos: [],
							productLaborCost: 0,
							productAddLaborCost: 0,
							mainStonePrice: 0,
							assistanceStonePrice: 0,
							mainStoneCount: 0,
							assistanceStoneCount: 0,
							additionalStonePrice: 0,
							stoneWeightTotal: 0,
							assistantStone: false,
							assistantStoneId: defaultAssistantStone?.assistantStoneId.toString() || "1",
							assistantStoneName:
								defaultAssistantStone?.assistantStoneName || "",
							assistantStoneCreateAt: "",
							totalWeight: 0,
							storeHarry: "",
							classificationId: "",
							classificationName: "",
							setTypeId: "",
							setTypeName: "",
						};
					}
					return row;
				})
			);
		}
	};

	// 초기 데이터 로드
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				setLoading(true);

				const productId = searchParams.get("productId");

				const [
					materialRes,
					colorRes,
					assistantStoneRes,
					goldHarryRes,
					productDetail,
				] = await Promise.all([
					materialApi.getMaterials(),
					colorApi.getColors(),
					assistantStoneApi.getAssistantStones(),
					goldHarryApi.getGoldHarry(),
					productId ? fetchProductDetail(productId) : Promise.resolve(null),
				]);


				if (materialRes.success) {
					const loadedMaterials = (materialRes.data || []).map((m) => ({
						materialId: m.materialId?.toString() || "",
						materialName: m.materialName,
						materialGoldPurityPercent: m.materialGoldPurityPercent || "",
					}));
					setMaterials(loadedMaterials);
				}
				if (colorRes.success) {
					const loadedColors = (colorRes.data || []).map((c) => ({
						colorId: c.colorId || "",
						colorName: c.colorName,
						colorNote: c.colorNote || "",
					}));
					setColors(loadedColors);
				}
				if (assistantStoneRes.success) {
					const loadedAssistantStones = (assistantStoneRes.data || []).map((a) => ({
						assistantStoneId: a.assistantStoneId,
						assistantStoneName: a.assistantStoneName,
					}));
					setAssistantStones(loadedAssistantStones);
				}
				if (goldHarryRes.success) {
					const loadedGoldHarries = (goldHarryRes.data || []).map((g) => ({
						goldHarryId: g.goldHarryId?.toString() || "",
						goldHarry: g.goldHarry,
					}));
					setGoldHarries(loadedGoldHarries);
				}

				// assistantStoneId가 "1"인 보조석 찾기
				const defaultAssistantStone =
					assistantStones.find((a) => a.assistantStoneId.toString() === "1") ||
					assistantStones[0] ||
					null;

				// 초기 5개 행 생성
				const initialRowCount = 5;
				const initialRows: StockOrderRows[] = [];

				if (productDetail) {
					setCurrentProductDetail(productDetail);
				}
				for (let i = 0; i < initialRowCount; i++) {
					let newRow: StockOrderRows = {
						id: `${Date.now()}-${i}`,
						createAt: currentDate,
						shippingAt: currentDate,
						storeId: "",
						storeName: "",
						grade: "1",
						productId: "",
						productName: "",
						productFactoryName: "",
						materialId: "",
						materialName: "",
						colorId: "",
						colorName: "",
						factoryId: "",
						factoryName: "",
						productSize: "",
						productPurchaseCost: 0,
						goldWeight: "",
						stoneWeight: "",
						isProductWeightSale: false,
						mainStoneNote: "",
						assistanceStoneNote: "",
						orderNote: "",
						stoneInfos: [],
						productLaborCost: 0,
						productAddLaborCost: 0,
						mainStonePrice: 0,
						assistanceStonePrice: 0,
						mainStoneCount: 0,
						assistanceStoneCount: 0,
						stoneAddLaborCost: 0,
						stoneWeightTotal: 0,
						assistantStoneId: defaultAssistantStone?.assistantStoneId.toString() || "1",
						assistantStone: false,
						assistantStoneName: defaultAssistantStone?.assistantStoneName || "",
						assistantStoneCreateAt: "",
						totalWeight: 0,
						storeHarry: "",
						classificationId: "",
						classificationName: "",
						setTypeId: "",
						setTypeName: "",
					};

					if (i === 0 && productDetail) {
						const policyGrade = "GRADE_1"; // 기본 등급
						const transformedStoneInfos = productDetail.productStoneDtos.map(
							(stone) => {
								const matchingPolicy = stone.stoneWorkGradePolicyDtos.find(
									(p) => p.grade === policyGrade
								);
								const laborCost = matchingPolicy
									? matchingPolicy.laborCost
									: stone.stoneWorkGradePolicyDtos[0]?.laborCost || 0;
								return {
									stoneId: stone.stoneId,
									stoneName: stone.stoneName,
									stoneWeight: stone.stoneWeight,
									purchaseCost: stone.stonePurchase,
									laborCost: laborCost,
									quantity: stone.stoneQuantity,
									mainStone: stone.mainStone,
									includeStone: stone.includeStone,
									addLaborCost: 0,
								};
							}
						);

						// 스톤 가격 계산
						const stoneCalcs = calculateStoneDetails(transformedStoneInfos);

						// 재질 매칭
						const matchedMaterial = materials.find(
							(m) => m.materialName === productDetail.materialDto?.materialName
						);
						// 색상 매칭 (ProductDto에 color 정보가 있다고 가정)
						const matchedColor = productDetail.productWorkGradePolicyGroupDto[0]
							.colorName
							? colors.find(
									(c) =>
										c.colorName ===
										productDetail.productWorkGradePolicyGroupDto[0].colorName
							  )
							: null;
						newRow = {
							...newRow,
							productId: productDetail.productId,
							productName: productDetail.productName,
							productFactoryName: productDetail.productFactoryName || "",
							factoryId: productDetail.factoryId.toString(),
							factoryName: productDetail.factoryName,
							classificationId:
								productDetail.classificationDto.classificationId || "",
							classificationName:
								productDetail.classificationDto.classificationName || "",
							setTypeId: productDetail.setTypeDto.setTypeId || "",
							setTypeName: productDetail.setTypeDto.setTypeName || "",

							// 스톤 관련
							stoneInfos: transformedStoneInfos,
							mainStonePrice: stoneCalcs.mainStonePrice,
							assistanceStonePrice: stoneCalcs.assistanceStonePrice,
							stoneAddLaborCost: stoneCalcs.stoneAddLaborCost,
							mainStoneCount: stoneCalcs.mainStoneCount,
							assistanceStoneCount: stoneCalcs.assistanceStoneCount,
							stoneWeightTotal: stoneCalcs.stoneWeight,
							stoneWeight: stoneCalcs.stoneWeight.toString(),

							// 재질 & 색상
							materialId: matchedMaterial ? matchedMaterial.materialId : "",
							materialName: matchedMaterial ? matchedMaterial.materialName : "",
							colorId: matchedColor ? matchedColor.colorId : "1",
							colorName: matchedColor ? matchedColor.colorName : "",
						};
					}

					initialRows.push(newRow);
				}
				setStockRows(initialRows);
			} catch (err) {
				handleError(err);
			} finally {
				setLoading(false);
			}
		};

		loadInitialData();
	}, []);

	// 재고 제출
	const handleSubmit = async () => {
		const validRows = stockRows.filter(
			(row) => row.storeId && row.productId && row.materialId
		);

		// 필터링된 행 정보 출력
		const filteredOutRows = stockRows.filter(
			(row) => !row.storeId || !row.productId || !row.materialId || !row.colorId
		);

		if (validRows.length === 0) {
			alert(
				"주문할 상품을 추가해주세요. (거래처, 모델번호, 재질, 색상은 필수입니다)"
			);
			return;
		}

		if (filteredOutRows.length > 0) {
			const confirmMsg = `${validRows.length}개의 재고가 저장됩니다.`;
			if (!confirm(confirmMsg)) {
				return;
			}
		}

		try {
			setLoading(true);

			const promises = validRows.map((row) => {
				let assistantStoneName = row.assistantStoneName;
				if (!assistantStoneName && row.assistantStoneId) {
					const foundStone = assistantStones.find(
						(s) => s.assistantStoneId.toString() === row.assistantStoneId
					);
					assistantStoneName = foundStone?.assistantStoneName || "";
				}

				const stockData: StockCreateRequest = {
					storeId: row.storeId,
					storeName: row.storeName,
					storeGrade: row.grade,
					storeHarry: row.storeHarry,
					factoryId: row.factoryId,
					factoryName: row.factoryName,
					productId: row.productId,
					productName: row.productName,
					productFactoryName: row.productFactoryName,
					productSize: row.productSize,
					stockNote: row.orderNote,
					isProductWeightSale: row.isProductWeightSale,
					productPurchaseCost: row.productPurchaseCost,
					productLaborCost: row.productLaborCost || 0,
					productAddLaborCost: row.productAddLaborCost as number,
					materialId: row.materialId,
					materialName: row.materialName,
					colorId: row.colorId,
					colorName: row.colorName,
					classificationId: row.classificationId,
					classificationName: row.classificationName,
					setTypeId: row.setTypeId,
					setTypeName: row.setTypeName,
					goldWeight: parseFloat(row.goldWeight) || 0,
					stoneWeight: parseFloat(row.stoneWeight) || 0,
					mainStoneNote: row.mainStoneNote,
					assistanceStoneNote: row.assistanceStoneNote,
					assistantStone: row.assistantStone,
					assistantStoneId: row.assistantStoneId,
					assistantStoneName: assistantStoneName,
					assistantStoneCreateAt: row.assistantStoneCreateAt,
					stoneInfos: row.stoneInfos,
					stoneAddLaborCost: row.stoneAddLaborCost || 0,
				};

				return stockApi.createStock(stockData, orderStatus);
			});

			const responses = await Promise.all(promises);
			const successCount = responses.filter((res) => res.success).length;

			alert(`${successCount}개의 재고가 성공적으로 등록되었습니다.`);

			if (window.opener) {
				window.opener.postMessage(
					{
						type: "STOCK_CREATED",
						count: successCount,
					},
					window.location.origin
				);
			}

			// 팝업창 닫기 또는 페이지 리프레시
			if (window.opener) {
				window.close();
			}
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
		}
	};

	// 취소
	const handleCancel = () => {
		if (window.confirm("작성을 취소하시겠습니까?")) {
			if (window.opener) {
				window.close();
			}
		}
	};

	if (loading && stockRows.length === 0) {
		return (
			<div className="loading-container">
				<div className="spinner"></div>
				<p>데이터 불러오는 중...</p>
			</div>
		);
	}

	return (
		<div className="stock-create-page">
			{/* 상품 정보 섹션 */}
			<ProductInfoSection
				currentProductDetail={currentProductDetail}
				title="선택된 상품 정보"
			/>

			{/* 과거 거래내역 섹션 */}
			<PastOrderHistory
				pastOrders={currentDisplayedPastOrders}
				title="과거 거래내역"
				maxRows={4}
			/>

			{/* 재고 주문 테이블 */}
			<StockTable
				mode="create"
				stockRows={stockRows}
				loading={loading}
				materials={materials}
				colors={colors}
				assistantStones={assistantStones}
				goldHarries={goldHarries}
				onRowDelete={resetOrderRow}
				onRowUpdate={updateStockRow}
				onRowFocus={handleRowFocus}
				onRequiredFieldClick={handleRequiredFieldClick}
				onStoreSearchOpen={openStoreSearch}
				onProductSearchOpen={openProductSearch}
				onFactorySearchOpen={openFactorySearch}
				onAssistanceStoneArrivalChange={handleAssistanceStoneArrivalChange}
				onAddStockRow={() => {}}
				onStoneInfoOpen={openStoneInfoManager}
				validateSequence={validateSequence}
				isRowInputEnabled={isRowInputEnabled}
			/>

			{/* 하단 버튼 */}
			<div className="form-actions">
				<button
					className="btn-cancel"
					onClick={handleCancel}
					disabled={loading}
				>
					취소
				</button>
				<button
					className="btn-submit"
					onClick={handleSubmit}
					disabled={loading}
				>
					{loading ? "처리 중..." : "등록"}
				</button>
			</div>

			{/* 검색 컴포넌트들 - 팝업 방식 */}
			{storeModal.isOpen && (
				<StoreSearch
					onSelectStore={handleStoreSelect}
					onClose={storeModal.closeModal}
				/>
			)}

			{factoryModal.isOpen && (
				<FactorySearch
					onSelectFactory={handleFactorySelect}
					onClose={factoryModal.closeModal}
				/>
			)}

			{productModal.isOpen && (
				<ProductSearch
					onSelectProduct={handleProductSelect}
					onClose={productModal.closeModal}
					grade={productModal.additionalParams.grade || "1"}
				/>
			)}
		</div>
	);
};

export default StockCreatePage;
