import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { stockApi } from "../../../libs/api/stock";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { goldHarryApi } from "../../../libs/api/goldHarry";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { productApi } from "../../../libs/api/product";
import { useErrorHandler } from "../../utils/errorHandler";
import { getLocalDate } from "../../utils/dateUtils";
import type { PastOrderDto } from "../../types/order";
import type { Product, ProductDto } from "../../types/product";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto } from "../../types/store";
import type { StockOrderRows, StockCreateRequest } from "../../types/stock";
import StockTable from "../../components/common/stock/StockTable";
import StoreSearch from "../../components/common/store/StoreSearch";
import FactorySearch from "../../components/common/factory/FactorySearch";
import ProductSearch from "../../components/common/product/ProductSearch";
import PastOrderHistory from "../../components/common/PastOrderHistory";
import ProductInfoSection from "../../components/common/ProductInfoSection";
import { calculateStoneDetails } from "../../utils/calculateStone";
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

	// 재고 행 데이터
	const [stockRows, setStockRows] = useState<StockOrderRows[]>([]);
	const orderStatus = MODE_TO_STATUS[mode as UpdateMode]; // api 상태값으로 사용

	// 검색 모달 상태
	const [isStoreSearchOpen, setIsStoreSearchOpen] = useState(false);
	const [selectedRowForStore, setSelectedRowForStore] = useState<string>("");
	const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);
	const [selectedRowForFactory, setSelectedRowForFactory] =
		useState<string>("");
	const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
	const [selectedRowForProduct, setSelectedRowForProduct] =
		useState<string>("");

	// 드롭다운 데이터
	const [materials, setMaterials] = useState<
		{ materialId: string; materialName: string }[]
	>([]);
	const [colors, setColors] = useState<
		{ colorId: string; colorName: string }[]
	>([]);
	const [assistantStones, setAssistantStones] = useState<
		{ assistantStoneId: string; assistantStoneName: string }[]
	>([]);
	const [goldHarries, setGoldHarries] = useState<
		{ goldHarryId: string; goldHarry: string }[]
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

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const currentDate = getLocalDate();

	// 과거 주문 데이터 가져오기
	const fetchPastOrders = async (
		storeId: string,
		productId: string,
		materialName: string
	): Promise<PastOrderDto[]> => {
		try {
			const cacheKey = `${storeId}-${productId}-${materialName}`;

			// 캐시에 데이터가 있으면 캐시에서 반환
			if (pastOrdersCache.has(cacheKey)) {
				return pastOrdersCache.get(cacheKey) || [];
			}

			const response = await orderApi.getPastOrders(
				parseInt(storeId),
				parseInt(productId),
				materialName
			);

			if (response.success && response.data) {
				// 캐시에 저장
				const newCache = new Map(pastOrdersCache);
				newCache.set(cacheKey, response.data);
				setPastOrdersCache(newCache);

				return response.data;
			}

			return [];
		} catch {
			return [];
		}
	};

	// 재고 행 데이터 업데이트
	const updateStockRow = async (
		id: string,
		field: keyof StockOrderRows,
		value: unknown
	) => {
		setStockRows((prevRows) => {
			const updatedRows = prevRows.map((row) => {
				if (row.id === id) {
					const updatedRow = { ...row, [field]: value };

					// 독립적인 체크를 위해 별도 실행
					setTimeout(() => {
						// 3개 필수 데이터가 모두 완성되면 과거 주문 데이터 가져오기
						if (
							updatedRow.storeId &&
							updatedRow.productId &&
							updatedRow.materialName
						) {
							updatePastOrders(
								updatedRow.storeId,
								updatedRow.productId,
								updatedRow.materialName
							);
						}

						// productId 필드가 변경될 때만 상품 상세 정보 가져오기
						if (field === "productId") {
							if (updatedRow.productId) {
								updateProductDetail(updatedRow.productId, updatedRow.id);
							} else {
								setCurrentProductDetail(null);
							}
						}
					}, 0);

					return updatedRow;
				}
				return row;
			});
			return updatedRows;
		});
	};

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
	const updateProductDetail = async (productId?: string, rowId?: string) => {
		if (!productId) {
			setCurrentProductDetail(null);
			return;
		}

		const productDetail = await fetchProductDetail(productId);
		setCurrentProductDetail(productDetail);

		if (productDetail && rowId) {
			const targetRow = stockRows.find((row) => row.id === rowId);
			if (!targetRow) return;

			const storeGrade = targetRow.grade || "1";
			const policyGrade = `GRADE_${storeGrade}`;

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
		}
	};

	// 3개 필수값이 모두 있을 때 과거 주문 데이터 업데이트
	const updatePastOrders = async (
		storeId: string,
		productId: string,
		materialName: string
	) => {
		const pastOrders = await fetchPastOrders(storeId, productId, materialName);
		setCurrentDisplayedPastOrders(pastOrders);
	};

	// 행에 포커스가 활성화될 때 과거 주문 데이터와 상품 상세 정보 표시
	const handleRowFocus = async (rowId: string) => {
		const row = stockRows.find((r) => r.id === rowId);
		if (!row) {
			setCurrentDisplayedPastOrders([]);
			setCurrentProductDetail(null);
			return;
		}

		// 3개 필수값이 모두 있으면 과거 주문 데이터 처리
		if (row.storeId && row.productId && row.materialName) {
			// 캐시에서 데이터 가져오기
			const cacheKey = `${row.storeId}-${row.productId}-${row.materialName}`;
			const cachedData = pastOrdersCache.get(cacheKey);

			if (cachedData) {
				setCurrentDisplayedPastOrders(cachedData);
			} else {
				// 캐시에 없으면 새로 가져오기
				await updatePastOrders(row.storeId, row.productId, row.materialName);
			}
		} else {
			setCurrentDisplayedPastOrders([]);
		}

		// productId가 있고, 현재 표시된 상품과 다른 경우에만 상품 상세 정보 처리
		if (row.productId) {
			// 현재 표시된 상품과 동일한지 확인
			if (
				!currentProductDetail ||
				currentProductDetail.productId !== row.productId
			) {
				await updateProductDetail(row.productId, row.id);
			}
		} else {
			setCurrentProductDetail(null);
		}
	};

	// 검색 컴포넌트 핸들러들
	const openStoreSearch = (rowId: string) => {
		setSelectedRowForStore(rowId);
		setIsStoreSearchOpen(true);
	};

	const handleStoreSelect = (store: StoreSearchDto) => {
		if (selectedRowForStore) {
			const storeIdValue = store.storeId?.toString();

			updateStockRow(selectedRowForStore, "storeId", storeIdValue);
			updateStockRow(selectedRowForStore, "storeName", store.storeName || "");
			updateStockRow(
				selectedRowForStore,
				"storeHarry",
				store.goldHarryLoss || ""
			);
			updateStockRow(selectedRowForStore, "grade", store.level || "1");
		}
		setIsStoreSearchOpen(false);
		setSelectedRowForStore("");
	};

	const handleStoreSearchClose = useCallback(() => {
		setIsStoreSearchOpen(false);
		setSelectedRowForStore("");
	}, []);

	const openFactorySearch = (rowId: string) => {
		setSelectedRowForFactory(rowId);
		setIsFactoryModalOpen(true);
	};

	const handleFactorySelect = (factory: FactorySearchDto) => {
		if (selectedRowForFactory) {
			updateStockRow(
				selectedRowForFactory,
				"factoryId",
				factory.factoryId?.toString()
			);
			updateStockRow(
				selectedRowForFactory,
				"factoryName",
				factory.factoryName || ""
			);
		}
		setIsFactoryModalOpen(false);
		setSelectedRowForFactory("");
	};

	const handleFactorySearchClose = useCallback(() => {
		setIsFactoryModalOpen(false);
		setSelectedRowForFactory("");
	}, []);

	const openProductSearch = (rowId: string) => {
		setSelectedRowForProduct(rowId);
		setIsProductSearchOpen(true);
	};

	const handleProductSelect = async (product: ProductDto) => {
		if (selectedRowForProduct) {
			const productIdValue = product.productId;
			const factoryIdValue = product.factoryId;

			updateStockRow(selectedRowForProduct, "productId", productIdValue);
			updateStockRow(
				selectedRowForProduct,
				"productName",
				product.productName || ""
			);
			updateStockRow(
				selectedRowForProduct,
				"productFactoryName",
				product.productFactoryName || ""
			);
			updateStockRow(selectedRowForProduct, "factoryId", factoryIdValue);
			updateStockRow(
				selectedRowForProduct,
				"factoryName",
				product.factoryName || ""
			);
			updateStockRow(
				selectedRowForProduct,
				"productLaborCost",
				product.productLaborCost || 0
			);
			updateStockRow(
				selectedRowForProduct,
				"productPurchaseCost",
				product.productPurchaseCost || 0
			);

			// 상품 상세 정보를 가져와서 classification과 setType 정보 설정
			const productDetail = await fetchProductDetail(productIdValue);
			if (productDetail) {
				updateStockRow(
					selectedRowForProduct,
					"classificationId",
					productDetail.classificationDto?.classificationId || ""
				);
				updateStockRow(
					selectedRowForProduct,
					"classificationName",
					productDetail.classificationDto?.classificationName || ""
				);
				updateStockRow(
					selectedRowForProduct,
					"setTypeId",
					productDetail.setTypeDto?.setTypeId || ""
				);
				updateStockRow(
					selectedRowForProduct,
					"setTypeName",
					productDetail.setTypeDto?.setTypeName || ""
				);
			}

			const mainStone = product.productStones.find((stone) => stone.mainStone);
			const mainStonePrice = mainStone
				? (mainStone.laborCost || 0) * (mainStone.stoneQuantity || 0)
				: 0;
			const mainStoneCount = mainStone?.stoneQuantity || 0;

			updateStockRow(selectedRowForProduct, "mainStonePrice", mainStonePrice);
			updateStockRow(selectedRowForProduct, "mainStoneCount", mainStoneCount);

			const assistanceStone = product.productStones.find(
				(stone) => !stone.mainStone
			);
			const assistanceStonePrice = assistanceStone
				? (assistanceStone.laborCost || 0) *
				  (assistanceStone.stoneQuantity || 0)
				: 0;
			const assistanceStoneCount = assistanceStone?.stoneQuantity || 0;

			updateStockRow(
				selectedRowForProduct,
				"assistanceStonePrice",
				assistanceStonePrice
			);
			updateStockRow(
				selectedRowForProduct,
				"assistanceStoneCount",
				assistanceStoneCount
			);
		}
		setIsProductSearchOpen(false);
		setSelectedRowForProduct("");
	};

	const handleProductSearchClose = useCallback(() => {
		setIsProductSearchOpen(false);
		setSelectedRowForProduct("");
	}, []);

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
				assistantStones.find((a) => a.assistantStoneId === "1") ||
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
							assistantStoneId: defaultAssistantStone?.assistantStoneId || "1",
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

	// 바로 직전 행의 필수값 가져오기
	const getPreviousRowRequiredValues = (currentIndex: number) => {
		if (currentIndex === 0) return null;

		// 바로 직전 행만 체크
		const prevRow = stockRows[currentIndex - 1];
		if (prevRow && prevRow.storeId && prevRow.productId && prevRow.materialId) {
			return {
				storeId: prevRow.storeId,
				storeName: prevRow.storeName,
				storeHarry: prevRow.storeHarry,
				grade: prevRow.grade,
				productId: prevRow.productId,
				productName: prevRow.productName,
				materialId: prevRow.materialId,
				materialName: prevRow.materialName,
				factoryId: prevRow.factoryId,
				factoryName: prevRow.factoryName,
				productLaborCost: prevRow.productLaborCost,
				mainStonePrice: prevRow.mainStonePrice,
				assistanceStonePrice: prevRow.assistanceStonePrice,
				mainStoneCount: prevRow.mainStoneCount,
				assistanceStoneCount: prevRow.assistanceStoneCount,
				classificationId: prevRow.classificationId,
				classificationName: prevRow.classificationName,
				setTypeId: prevRow.setTypeId,
				setTypeName: prevRow.setTypeName,
			};
		}
		return null;
	};

	// 필수값 자동 복사 핸들러
	const handleRequiredFieldClick = (
		currentRowId: string,
		fieldType: "store" | "product" | "material" | "color"
	) => {
		const currentIndex = stockRows.findIndex((row) => row.id === currentRowId);
		const currentRow = stockRows[currentIndex];

		// 현재 행에 이미 값이 있으면 복사하지 않음
		if (
			(fieldType === "store" && currentRow.storeId) ||
			(fieldType === "product" && currentRow.productId) ||
			(fieldType === "material" && currentRow.materialId)
		) {
			return;
		}

		const prevValues = getPreviousRowRequiredValues(currentIndex);
		if (prevValues) {
			if (fieldType === "store") {
				updateStockRow(currentRowId, "storeId", prevValues.storeId);
				updateStockRow(currentRowId, "storeName", prevValues.storeName);
				updateStockRow(currentRowId, "storeHarry", prevValues.storeHarry);
				updateStockRow(currentRowId, "grade", prevValues.grade);
			} else if (fieldType === "product") {
				updateStockRow(currentRowId, "productId", prevValues.productId);
				updateStockRow(currentRowId, "productName", prevValues.productName);
				updateStockRow(currentRowId, "factoryId", prevValues.factoryId);
				updateStockRow(currentRowId, "factoryName", prevValues.factoryName);
				updateStockRow(
					currentRowId,
					"productLaborCost",
					prevValues.productLaborCost
				);
				updateStockRow(
					currentRowId,
					"mainStonePrice",
					prevValues.mainStonePrice
				);
				updateStockRow(
					currentRowId,
					"assistanceStonePrice",
					prevValues.assistanceStonePrice
				);
				updateStockRow(
					currentRowId,
					"mainStoneCount",
					prevValues.mainStoneCount
				);
				updateStockRow(
					currentRowId,
					"assistanceStoneCount",
					prevValues.assistanceStoneCount
				);
				updateStockRow(
					currentRowId,
					"classificationId",
					prevValues.classificationId
				);
				updateStockRow(
					currentRowId,
					"classificationName",
					prevValues.classificationName
				);
				updateStockRow(currentRowId, "setTypeId", prevValues.setTypeId);
				updateStockRow(currentRowId, "setTypeName", prevValues.setTypeName);
			} else if (fieldType === "material") {
				updateStockRow(currentRowId, "materialId", prevValues.materialId);
				updateStockRow(currentRowId, "materialName", prevValues.materialName);
			}
		}
	};

	// 초기 데이터 로드
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				setLoading(true);

				const [materialRes, colorRes, assistantStoneRes, goldHarryRes] =
					await Promise.all([
						materialApi.getMaterials(),
						colorApi.getColors(),
						assistantStoneApi.getAssistantStones(),
						goldHarryApi.getGoldHarry(),
					]);

				let loadedMaterials: { materialId: string; materialName: string }[] =
					[];
				let loadedColors: { colorId: string; colorName: string }[] = [];
				let loadedAssistantStones: {
					assistantStoneId: string;
					assistantStoneName: string;
				}[] = [];
				let loadedGoldHarries: { goldHarryId: string; goldHarry: string }[] =
					[];

				if (materialRes.success) {
					loadedMaterials = (materialRes.data || []).map((m) => ({
						materialId: m.materialId?.toString() || "",
						materialName: m.materialName,
					}));
					setMaterials(loadedMaterials);
				}
				if (colorRes.success) {
					loadedColors = (colorRes.data || []).map((c) => ({
						colorId: c.colorId?.toString() || "",
						colorName: c.colorName,
					}));
					setColors(loadedColors);
				}
				if (assistantStoneRes.success) {
					loadedAssistantStones = (assistantStoneRes.data || []).map((a) => ({
						assistantStoneId: a.assistantStoneId.toString(),
						assistantStoneName: a.assistantStoneName,
					}));
					setAssistantStones(loadedAssistantStones);
				}
				if (goldHarryRes.success) {
					loadedGoldHarries = (goldHarryRes.data || []).map((g) => ({
						goldHarryId: g.goldHarryId?.toString() || "",
						goldHarry: g.goldHarry,
					}));
					setGoldHarries(loadedGoldHarries);
				}

				// assistantStoneId가 "1"인 보조석 찾기
				const defaultAssistantStone =
					loadedAssistantStones.find((a) => a.assistantStoneId === "1") ||
					loadedAssistantStones[0] ||
					null;

				// 초기 5개 행 생성
				const initialRowCount = 5;
				const initialRows: StockOrderRows[] = [];
				for (let i = 0; i < initialRowCount; i++) {
					const newRow: StockOrderRows = {
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
						assistantStoneId: defaultAssistantStone?.assistantStoneId || "1",
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
					initialRows.push(newRow);
				}
				setStockRows(initialRows);
			} catch (err) {
				handleError(err, setError);
			} finally {
				setLoading(false);
			}
		};

		loadInitialData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 재고 제출
	const handleSubmit = async () => {
		const validRows = stockRows.filter(
			(row) => row.storeId && row.productId && row.materialId
		);

		if (validRows.length === 0) {
			alert("등록할 재고를 추가해주세요. (거래처, 상품, 재질은 필수입니다)");
			return;
		}

		try {
			setLoading(true);

			const promises = validRows.map((row) => {
				// assistantStoneName이 비어있으면 assistantStoneId로 이름 찾기
				let assistantStoneName = row.assistantStoneName;
				if (!assistantStoneName && row.assistantStoneId) {
					const foundStone = assistantStones.find(
						(s) => s.assistantStoneId === row.assistantStoneId
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
					stoneAddLaborCost: 0,
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
			handleError(err, setError);
			alert("재고 등록에 실패했습니다.");
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
			{/* 에러 메시지 */}
			{error && (
				<div className="error-message">
					<span>⚠️</span>
					<p>{error}</p>
				</div>
			)}

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
			{isStoreSearchOpen && (
				<StoreSearch
					onSelectStore={handleStoreSelect}
					onClose={handleStoreSearchClose}
				/>
			)}

			{isFactoryModalOpen && (
				<FactorySearch
					onSelectFactory={handleFactorySelect}
					onClose={handleFactorySearchClose}
				/>
			)}

			{isProductSearchOpen && (
				<ProductSearch
					onSelectProduct={handleProductSelect}
					onClose={handleProductSearchClose}
				/>
			)}
		</div>
	);
};

export default StockCreatePage;
