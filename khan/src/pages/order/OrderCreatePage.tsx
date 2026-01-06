import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { priorityApi } from "../../../libs/api/priority";
import { productApi } from "../../../libs/api/product";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { useErrorHandler } from "../../utils/errorHandler";
import { useSearchModal } from "../../hooks/useSearchModal";
import { usePreviousRowCopy } from "../../hooks/usePreviousRowCopy";
import { useStoneInfoManager } from "../../hooks/useStoneInfoManager";
import {
	addBusinessDays,
	getLocalDate,
	formatDateToString,
} from "../../utils/dateUtils";
import type { ColorDto } from "../../types/color";
import type { MaterialDto } from "../../types/material";
import type { AssistantStoneDto } from "../../types/AssistantStoneDto";
import type {
	OrderRowData,
	OrderCreateRequest,
	PastOrderDto,
} from "../../types/order";
import type { Product, ProductDto } from "../../types/product";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto, AccountInfoDto } from "../../types/store";
import StoreSearch from "../../components/common/store/StoreSearch";
import FactorySearch from "../../components/common/factory/FactorySearch";
import ProductSearch from "../../components/common/product/ProductSearch";
import OrderTable from "../../components/common/order/OrderTable";
import PastOrderHistory from "../../components/common/PastOrderHistory";
import ProductInfoSection from "../../components/common/ProductInfoSection";
import { calculateStoneDetails } from "../../utils/calculateStone";
import { handleApiSubmit } from "../../utils/apiSubmitHandler";
import "../../styles/pages/OrderCreatePage.css";

type UpdateMode = "order" | "fix" | "expact";

const MODE_TO_STATUS = {
	order: "ORDER",
	fix: "FIX",
	expact: "EXPACT",
} as const satisfies Record<UpdateMode, "ORDER" | "FIX" | "EXPACT">;

const OrderCreatePage = () => {
	const { handleError } = useErrorHandler();
	const { mode } = useParams<{
		mode: UpdateMode;
	}>();
	const [searchParams] = useSearchParams();

	// 주문 행 데이터
	const [orderRows, setOrderRows] = useState<OrderRowData[]>([]);
	const orderStatus = MODE_TO_STATUS[mode as UpdateMode];

	// 검색 모달 상태 - 커스텀 훅 사용
	const storeModal = useSearchModal();
	const factoryModal = useSearchModal();
	const productModal = useSearchModal();

	// 드롭다운 데이터
	const [materials, setMaterials] = useState<MaterialDto[]>([]);
	const [colors, setColors] = useState<ColorDto[]>([]);
	const [priorities, setPriorities] = useState<
		{ priorityName: string; priorityDate: number }[]
	>([]);
	const [assistantStones, setAssistantStones] = useState<AssistantStoneDto[]>(
		[]
	);

	// 과거 주문 데이터 관련 state
	const [pastOrdersCache, setPastOrdersCache] = useState<
		Map<string, PastOrderDto[]>
	>(new Map());
	const [currentDisplayedPastOrders, setCurrentDisplayedPastOrders] = useState<
		PastOrderDto[]
	>([]);

	// 상품 상세 정보 관련 state
	const [currentProductDetail, setCurrentProductDetail] =
		useState<Product | null>(null);

	const [loading, setLoading] = useState(false);
	const currentDate = getLocalDate();

	const foundPriority = priorities.find(
		(p) => p.priorityName === priorities[0]?.priorityName
	);

	let deliveryDate = currentDate;
	if (foundPriority && currentDate) {
		const calculatedDate = addBusinessDays(
			currentDate,
			foundPriority.priorityDate
		);
		deliveryDate = formatDateToString(calculatedDate);
	}

	// 새 주문 행 추가
	const addOrderRow = () => {
		const defaultPriority =
			priorities.length > 0
				? priorities[0]
				: { priorityName: "일반", priorityDate: 7 };

		const defaultAssistantStone =
			assistantStones.length > 0 ? assistantStones[0] : null;

		const newRow: OrderRowData = {
			id: Date.now().toString(),
			storeId: "",
			storeName: "",
			storeHarry: "",
			storeGrade: "1",
			productId: "",
			productName: "",
			productFactoryName: "",
			classificationId: "",
			classificationName: "",
			setTypeId: "",
			setTypeName: "",
			materialId: "",
			materialName: "",
			colorId: "1",
			colorName: "",
			factoryId: "",
			factoryName: "",
			factoryHarry: "",
			productSize: "",
			stoneWeight: 0,
			isProductWeightSale: false,
			priorityName: defaultPriority.priorityName,
			mainStoneNote: "",
			assistanceStoneNote: "",
			orderNote: "",
			stoneInfos: [],
			productLaborCost: 0, // 기본 판매단가
			productAddLaborCost: 0, // 추가 판매단가
			mainStonePrice: 0, // 스톤 중심 판매단가
			assistanceStonePrice: 0, // 보조 중심 판매단가
			stoneAddLaborCost: 0, // 추가 스톤 판매단가
			mainStoneCount: 0,
			assistanceStoneCount: 0,
			stoneWeightTotal: 0,
			createAt: currentDate,
			shippingAt: deliveryDate,
			// 보조석 관련 필드
			assistantStone: false,
			assistantStoneId:
				defaultAssistantStone?.assistantStoneId.toString() || "1",
			assistantStoneName: defaultAssistantStone?.assistantStoneName || "",
			assistantStoneCreateAt: "",
		};
		setOrderRows([...orderRows, newRow]);
	};

	// 주문 행 초기화 (삭제 대신)
	const resetOrderRow = (id: string) => {
		if (window.confirm("초기화하시겠습니까?")) {
			// 기본 priority 날짜 계산 (서버에서 받아온 첫 번째 데이터 사용)
			const defaultPriority = priorities[0];
			const defaultAssistantStone =
				assistantStones.length > 0 ? assistantStones[0] : null;

			setOrderRows((prevRows) =>
				prevRows.map((row) => {
					if (row.id === id) {
						return {
							...row,
							storeId: "",
							storeName: "",
							storeHarry: "",
							storeGrade: "1",
							productId: "",
							productName: "",
							productImage: "",
							materialId: "",
							materialName: "",
							colorId: "1",
							colorName: "",
							setType: "",
							factoryId: "",
							factoryName: "",
							factoryHarry: "",
							productSize: "",
							productWeight: "",
							stoneWeight: 0,
							productAddLaborCost: 0,
							isProductWeightSale: false,
							priorityName: defaultPriority.priorityName,
							mainStoneNote: "",
							assistanceStoneNote: "",
							orderNote: "",
							stoneInfos: [],
							basicPrice: "",
							additionalPrice: "",
							mainStonePrice: "",
							assistanceStonePrice: "",
							stoneAddLaborCost: "",
							mainStoneCount: "",
							assistanceStoneCount: "",
							stoneWeightTotal: "",
							createAt: currentDate,
							shippingAt: deliveryDate,
							// 보조석 관련 필드들을 서버 데이터 기반으로 초기화
							assistantStone: false,
							assistantStoneId:
								defaultAssistantStone?.assistantStoneId.toString() || "1",
							assistantStoneName:
								defaultAssistantStone?.assistantStoneName || "",
							assistantStoneCreateAt: "",
						};
					}
					return row;
				})
			);
		}
	};

	// 주문 행 데이터 업데이트
	const updateOrderRow = useCallback(
		(id: string, field: keyof OrderRowData, value: unknown) => {
			setOrderRows((prevRows) => {
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
		orderRows,
		updateOrderRow
	);

	// 스톤 정보 관리 - 커스텀 훅 사용
	const { openStoneInfoManager } = useStoneInfoManager({
		orderRows,
		updateOrderRow,
	});

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
		}
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

	const handleRowFocus = async (rowId: string) => {
		const row = orderRows.find((r) => r.id === rowId);
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

	// 현재 행이 입력 가능한지 체크 (바로 직전 행의 필수값 완성 여부)
	const isRowInputEnabled = (currentIndex: number): boolean => {
		if (currentIndex === 0) return true; // 첫 번째 행은 항상 입력 가능

		// 바로 직전 행의 필수값이 완성되어 있으면 입력 가능
		const prevRow = orderRows[currentIndex - 1];
		return !!(
			prevRow &&
			prevRow.storeId &&
			prevRow.productId &&
			prevRow.materialId &&
			prevRow.colorId
		);
	};

	// 보조석 입고 여부 변경 핸들러
	const handleAssistanceStoneArrivalChange = (id: string, value: string) => {
		if (value === "Y") {
			// Y로 변경 시 현재 날짜를 자동 설정
			updateOrderRow(id, "assistantStone", true);
			updateOrderRow(id, "assistantStoneCreateAt", currentDate);
		} else {
			// N으로 변경 시 날짜 초기화
			updateOrderRow(id, "assistantStone", false);
			updateOrderRow(id, "assistantStoneCreateAt", "");
		}
	};

	// 필수 선택 순서 체크 함수들
	const checkStoreSelected = (rowId: string): boolean => {
		const row = orderRows.find((r) => r.id === rowId);
		return !!(row?.storeId && row?.storeName);
	};

	const checkProductSelected = (rowId: string): boolean => {
		const row = orderRows.find((r) => r.id === rowId);
		return !!(row?.productId && row?.productName);
	};

	const checkMaterialSelected = (rowId: string): boolean => {
		const row = orderRows.find((r) => r.id === rowId);
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

	// 거래처 검색 모달 열기
	const openStoreSearch = (rowId: string) => {
		storeModal.openModal(rowId);
	};

	// 거래처 선택 처리
	const handleStoreSelect = async (store: StoreSearchDto | AccountInfoDto) => {
		if (storeModal.selectedRowId) {
			const storeIdValue = store.accountId?.toString();
			const rowId = storeModal.selectedRowId;
			const newGrade = store.grade || "1";

			updateOrderRow(rowId, "storeId", storeIdValue);
			updateOrderRow(rowId, "storeName", store.accountName || "");
			updateOrderRow(rowId, "storeHarry", store.goldHarryLoss || "");
			updateOrderRow(rowId, "storeGrade", newGrade);

			// 거래처 선택 시 productId가 있으면 상품 정보 자동 로드
			const currentRow = orderRows.find((r) => r.id === rowId);
			if (currentRow?.productId) {
				try {
					const productDetail = await fetchProductDetail(currentRow.productId);
					if (productDetail) {
						setCurrentProductDetail(productDetail);

						const policyGrade = `GRADE_${newGrade}`;

						// 상품 기본 정보
						updateOrderRow(
							rowId,
							"productFactoryName",
							productDetail.productFactoryName || ""
						);
						updateOrderRow(rowId, "factoryId", productDetail.factoryId);
						updateOrderRow(rowId, "factoryName", productDetail.factoryName);
						updateOrderRow(
							rowId,
							"classificationId",
							productDetail.classificationDto?.classificationId || ""
						);
						updateOrderRow(
							rowId,
							"classificationName",
							productDetail.classificationDto?.classificationName || ""
						);
						updateOrderRow(
							rowId,
							"setTypeId",
							productDetail.setTypeDto?.setTypeId || ""
						);
						updateOrderRow(
							rowId,
							"setTypeName",
							productDetail.setTypeDto?.setTypeName || ""
						);

						let productLaborCost = 0;
						let matchingColorName = "";

						console.log("상품 상세 정보:", productDetail);
						for (const priceGroup of productDetail.productWorkGradePolicyGroupDto) {
							const matchingPolicy = priceGroup.policyDtos?.find(
								(policy) => {
									console.log("검사 중인 등급 정책:", policy, policyGrade);
									return policy.grade === policyGrade;
								}
							);
							if (matchingPolicy) {
								console.log("일치하는 정책 발견:", matchingPolicy);
								productLaborCost = matchingPolicy.laborCost || 0;
								matchingColorName = priceGroup.colorName;
								break;
							}
						}


						// 상품 단가 설정
						updateOrderRow(rowId, "productLaborCost", productLaborCost);

						// 스톤 정보 변환 (등급별 단가 적용)
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

						updateOrderRow(rowId, "stoneInfos", transformedStoneInfos);

						// 알 가격 계산
						const calculatedStoneData = calculateStoneDetails(
							transformedStoneInfos
						);
						updateOrderRow(
							rowId,
							"mainStonePrice",
							calculatedStoneData.mainStonePrice
						);
						updateOrderRow(
							rowId,
							"assistanceStonePrice",
							calculatedStoneData.assistanceStonePrice
						);
						updateOrderRow(
							rowId,
							"stoneAddLaborCost",
							calculatedStoneData.stoneAddLaborCost
						);
						updateOrderRow(
							rowId,
							"mainStoneCount",
							calculatedStoneData.mainStoneCount
						);
						updateOrderRow(
							rowId,
							"assistanceStoneCount",
							calculatedStoneData.assistanceStoneCount
						);
						updateOrderRow(
							rowId,
							"stoneWeightTotal",
							calculatedStoneData.stoneWeight
						);
						updateOrderRow(
							rowId,
							"stoneWeight",
							calculatedStoneData.stoneWeight
						);

						// 재질 자동 선택
						if (productDetail.materialDto?.materialName) {
							const foundMaterial = materials.find(
								(m) =>
									m.materialName === productDetail.materialDto?.materialName
							);
							if (foundMaterial) {
								updateOrderRow(rowId, "materialId", foundMaterial.materialId);
								updateOrderRow(
									rowId,
									"materialName",
									foundMaterial.materialName
								);
							}
						}

						// 색상 자동 선택
						if (matchingColorName) {
							const foundColor = colors.find(
								(c) => c.colorName === matchingColorName
							);
							if (foundColor) {
								updateOrderRow(rowId, "colorId", foundColor.colorId);
								updateOrderRow(rowId, "colorName", foundColor.colorName);
							}
						} else if (colors.length > 0) {
							updateOrderRow(rowId, "colorId", colors[0].colorId || "1");
							updateOrderRow(rowId, "colorName", colors[0].colorName);
						}
					}
				} catch (err) {
					console.error("상품 정보 자동 로드 실패:", err);
				}
			}
		}
		storeModal.handleSelect();
	};

	// 제조사 검색 모달 열기
	const openFactorySearch = (rowId: string) => {
		factoryModal.openModal(rowId);
	};

	// 제조사 선택 처리
	const handleFactorySelect = (factory: FactorySearchDto) => {
		if (factoryModal.selectedRowId) {
			updateOrderRow(
				factoryModal.selectedRowId,
				"factoryId",
				factory.factoryId?.toString()
			);
			updateOrderRow(
				factoryModal.selectedRowId,
				"factoryName",
				factory.factoryName || ""
			);
		}
		factoryModal.handleSelect();
	};

	// 상품 검색 모달 열기
	const openProductSearch = (rowId: string) => {
		if (!validateSequence(rowId, "product")) {
			return;
		}
		const row = orderRows.find((r) => r.id === rowId);
		const grade = row?.storeGrade || "1";
		productModal.openModal(rowId, { grade: grade });
	};

	// 상품 선택 처리
	const handleProductSelect = async (product: ProductDto) => {
		if (productModal.selectedRowId) {
			const productIdValue = product.productId;
			const factoryIdValue = product.factoryId;

			const currentProductDetail = await fetchProductDetail(productIdValue);
			setCurrentProductDetail(currentProductDetail);

			// 현재 행의 storeGrade 가져오기
			const currentRow = orderRows.find(
				(r) => r.id === productModal.selectedRowId
			);
			const storeGrade = currentRow?.storeGrade || "1";
			const policyGrade = `GRADE_${storeGrade}`;

			updateOrderRow(productModal.selectedRowId, "productId", productIdValue);
			updateOrderRow(
				productModal.selectedRowId,
				"productName",
				product.productName || ""
			);
			updateOrderRow(
				productModal.selectedRowId,
				"productFactoryName",
				product.productFactoryName || ""
			);
			updateOrderRow(
				productModal.selectedRowId,
				"classificationId",
				currentProductDetail?.classificationDto.classificationId || ""
			);
			updateOrderRow(
				productModal.selectedRowId,
				"classificationName",
				currentProductDetail?.classificationDto.classificationName || ""
			);
			updateOrderRow(
				productModal.selectedRowId,
				"setTypeId",
				currentProductDetail?.setTypeDto.setTypeId || ""
			);
			updateOrderRow(
				productModal.selectedRowId,
				"setTypeName",
				currentProductDetail?.setTypeDto.setTypeName || ""
			);
			updateOrderRow(productModal.selectedRowId, "factoryId", factoryIdValue);
			updateOrderRow(
				productModal.selectedRowId,
				"factoryName",
				product.factoryName || ""
			);
			updateOrderRow(
				productModal.selectedRowId,
				"productLaborCost",
				product.productLaborCost || 0
			);

			// 스톤 정보 변환 및 업데이트
			if (currentProductDetail?.productStoneDtos) {
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

				updateOrderRow(
					productModal.selectedRowId,
					"stoneInfos",
					transformedStoneInfos
				);

				// 알 가격 및 개수 계산
				const calculatedStoneData = calculateStoneDetails(
					transformedStoneInfos
				);

				updateOrderRow(
					productModal.selectedRowId,
					"mainStonePrice",
					calculatedStoneData.mainStonePrice
				);
				updateOrderRow(
					productModal.selectedRowId,
					"assistanceStonePrice",
					calculatedStoneData.assistanceStonePrice
				);
				updateOrderRow(
					productModal.selectedRowId,
					"stoneAddLaborCost",
					calculatedStoneData.stoneAddLaborCost
				);
				updateOrderRow(
					productModal.selectedRowId,
					"mainStoneCount",
					calculatedStoneData.mainStoneCount
				);
				updateOrderRow(
					productModal.selectedRowId,
					"assistanceStoneCount",
					calculatedStoneData.assistanceStoneCount
				);
				updateOrderRow(
					productModal.selectedRowId,
					"stoneWeight",
					calculatedStoneData.stoneWeight
				);
				updateOrderRow(
					productModal.selectedRowId,
					"stoneWeightTotal",
					calculatedStoneData.stoneWeight
				);
			}

			// productMaterial 값이 있으면 자동으로 드롭다운에서 선택
			if (product.productMaterial) {
				const foundMaterial = materials.find(
					(m) => m.materialName === product.productMaterial
				);
				if (foundMaterial) {
					updateOrderRow(
						productModal.selectedRowId,
						"materialId",
						foundMaterial.materialId.toString()
					);
					updateOrderRow(
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
					updateOrderRow(
						productModal.selectedRowId,
						"colorId",
						foundColor.colorId.toString()
					);
					updateOrderRow(
						productModal.selectedRowId,
						"colorName",
						foundColor.colorName
					);
				}
			}
		}
		productModal.handleSelect();
	};

	// 초기 데이터 로드
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				setLoading(true);

				const productId = searchParams.get("productId");
				const productName = searchParams.get("productName");

				// 기본 드롭다운 데이터만 로드
				const [materialRes, colorRes, priorityRes, assistantStoneRes] =
					await Promise.all([
						materialApi.getMaterials(),
						colorApi.getColors(),
						priorityApi.getPriorities(),
						assistantStoneApi.getAssistantStones(),
					]);

				let loadedMaterials: MaterialDto[] = [];
				let loadedColors: ColorDto[] = [];

				if (materialRes.success) {
					loadedMaterials = (materialRes.data || []).map((m) => ({
						materialId: m.materialId?.toString() || "",
						materialName: m.materialName,
						materialGoldPurityPercent: m.materialGoldPurityPercent || "",
					}));
					setMaterials(loadedMaterials);
				}
				if (colorRes.success) {
					loadedColors = (colorRes.data || []).map((c) => ({
						colorId: c.colorId || "",
						colorName: c.colorName,
						colorNote: c.colorNote || "",
					}));
					setColors(loadedColors);
				}
				if (assistantStoneRes.success) {
					setAssistantStones(
						(assistantStoneRes.data || []).map((a) => ({
							assistantStoneId: a.assistantStoneId,
							assistantStoneName: a.assistantStoneName,
						}))
					);
				}

				if (priorityRes.success && priorityRes.data) {
					const loadedPriorities = (priorityRes.data || []).map((p) => ({
						priorityName: p.priorityName,
						priorityDate: p.priorityDate,
					}));
					setPriorities(loadedPriorities);

					const defaultPriority =
						loadedPriorities.length > 0
							? loadedPriorities[0]
							: { priorityName: "일반", priorityDate: 7 };

					const calculatedDate = addBusinessDays(
						new Date(),
						defaultPriority.priorityDate
					);
					const defaultDeliveryDate = formatDateToString(calculatedDate);

					// 보조석 기본값 설정
					const defaultAssistantStone =
						assistantStones.length > 0 ? assistantStones[0] : null;

					// 초기 10개 행 생성
					const initialRowCount = 10; // 행 개수를 변수로 관리
					const initialRows: OrderRowData[] = [];

					for (let i = 0; i < initialRowCount; i++) {
						const rowId = `${Date.now()}-${i}`; // ID 생성

						// 기본 빈 행 생성
						const newRow: OrderRowData = {
							id: rowId,
							storeId: "",
							storeName: "",
							storeHarry: "",
							storeGrade: "1",
							productId: i === 0 && productId ? productId : "",
							productName:
								i === 0 && productName ? decodeURIComponent(productName) : "",
							productFactoryName: "",
							classificationId: "",
							classificationName: "",
							setTypeId: "",
							setTypeName: "",
							materialId: "",
							materialName: "",
							colorId: "1", // 기본값
							colorName: "",
							factoryId: "",
							factoryName: "",
							factoryHarry: "",
							productSize: "",
							stoneWeight: 0,
							isProductWeightSale: false,
							priorityName: defaultPriority.priorityName,
							mainStoneNote: "",
							assistanceStoneNote: "",
							orderNote: "",
							stoneInfos: [],
							productLaborCost: 0,
							productAddLaborCost: 0,
							mainStonePrice: 0,
							assistanceStonePrice: 0,
							stoneAddLaborCost: 0,
							mainStoneCount: 0,
							assistanceStoneCount: 0,
							stoneWeightTotal: 0,
							createAt: currentDate,
							shippingAt: defaultDeliveryDate,
							assistantStone: false,
							assistantStoneId:
								defaultAssistantStone?.assistantStoneId.toString() || "1",
							assistantStoneName:
								defaultAssistantStone?.assistantStoneName || "",
							assistantStoneCreateAt: "",
						};

						initialRows.push(newRow);
					}

					// 3. 완성된 전체 행 데이터를 상태에 저장
					setOrderRows(initialRows);
				}
			} catch (err) {
				handleError(err);
			} finally {
				setLoading(false);
			}
		};
		loadInitialData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 주문 제출
	const handleSubmit = async () => {
		const validRows = orderRows.filter(
			(row) => row.storeId && row.productId && row.materialId && row.colorId
		);

		// 필터링된 행 정보 출력
		const filteredOutRows = orderRows.filter(
			(row) => !row.storeId || !row.productId || !row.materialId || !row.colorId
		);

		if (validRows.length === 0) {
			alert(
				"주문할 상품을 추가해주세요. (거래처, 모델번호, 재질, 색상은 필수입니다)"
			);
			return;
		}

		// 사용자에게 저장될 행 수 확인
		if (filteredOutRows.length > 0) {
			const confirmMsg = `${validRows.length}개의 주문이 저장됩니다.`;
			if (!confirm(confirmMsg)) {
				return;
			}
		}

		try {
			setLoading(true);

			const promises = validRows.map((row) => {
				const priority = priorities.find(
					(p) => p.priorityName === row.priorityName
				);
				const priorityDays = priority?.priorityDate || 7;
				const shippingDate = addBusinessDays(currentDate, priorityDays);
				const shippingAtFormatted = formatDateToString(shippingDate);

				const orderData: OrderCreateRequest = {
					storeId: row.storeId,
					storeName: row.storeName,
					storeGrade: row.storeGrade,
					storeHarry: row.storeHarry as string,
					orderNote: row.orderNote,
					factoryId: row.factoryId,
					factoryName: row.factoryName,
					factoryHarry: row.factoryHarry as string,
					productId: row.productId,
					productName: row.productName,
					productFactoryName: row.productFactoryName,
					productSize: row.productSize,
					productAddLaborCost: row.productAddLaborCost || 0,
					isProductWeightSale: row.isProductWeightSale,
					stoneWeight: row.stoneWeight,
					materialId: row.materialId,
					materialName: row.materialName,
					colorId: row.colorId,
					colorName: row.colorName,
					classificationId: row.classificationId,
					classificationName: row.classificationName,
					setTypeId: row.setTypeId,
					setTypeName: row.setTypeName,
					priorityName: row.priorityName,
					mainStoneNote: row.mainStoneNote,
					assistanceStoneNote: row.assistanceStoneNote,
					assistantStone: row.assistantStone,
					assistantStoneId: row.assistantStoneId || "1",
					assistantStoneCreateAt: row.assistantStoneCreateAt,
					createAt: currentDate,
					shippingAt: shippingAtFormatted,
					stoneInfos: row.stoneInfos,
					stoneAddLaborCost: Number(row.stoneAddLaborCost) || 0,
				};

				return orderApi.createOrder(orderStatus, orderData);
			});

			await handleApiSubmit({
				promises,
				successMessage: `${validRows.length}개의 주문이 성공적으로 생성되었습니다.`,
				parentMessageType: "ORDER_CREATED",
				parentMessageData: {
					success: true,
				},
				logMessage: "주문 생성",
				closeDelay: 0, // 서버 응답 직후 바로 창 닫기
			});
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
		}
	};

	// 취소
	const handleCancel = () => {
		if (window.confirm("작성을 취소하시겠습니까?")) {
			window.close();
		}
	};

	if (loading && orderRows.length === 0) {
		return (
			<>
				<div className="loading-container">
					<div className="spinner"></div>
					<p>데이터 불러오는 중...</p>
				</div>
			</>
		);
	}

	return (
		<div className="order-create-page">
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

			{/* 주문 테이블 */}
			<OrderTable
				mode="create"
				orderRows={orderRows}
				loading={loading}
				materials={materials}
				colors={colors}
				priorities={priorities}
				assistantStones={assistantStones}
				onRowDelete={resetOrderRow}
				onRowUpdate={updateOrderRow}
				onRowFocus={handleRowFocus}
				onRequiredFieldClick={handleRequiredFieldClick}
				onStoreSearchOpen={openStoreSearch}
				onProductSearchOpen={openProductSearch}
				onFactorySearchOpen={openFactorySearch}
				onAssistanceStoneArrivalChange={handleAssistanceStoneArrivalChange}
				onAddOrderRow={addOrderRow}
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
export default OrderCreatePage;
