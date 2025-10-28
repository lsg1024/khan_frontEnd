import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { priorityApi } from "../../../libs/api/priority";
import { productApi } from "../../../libs/api/product";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { useErrorHandler } from "../../utils/errorHandler";
import {
	addBusinessDays,
	getLocalDate,
	formatDateToString,
} from "../../utils/dateUtils";
import type {
	OrderRowData,
	OrderCreateRequest,
	PastOrderDto,
} from "../../types/order";
import type { Product, ProductDto } from "../../types/product";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto } from "../../types/store";
import StoreSearch from "../../components/common/store/StoreSearch";
import FactorySearch from "../../components/common/factory/FactorySearch";
import ProductSearch from "../../components/common/product/ProductSearch";
import OrderTable from "../../components/common/order/OrderTable";
import PastOrderHistory from "../../components/common/PastOrderHistory";
import ProductInfoSection from "../../components/common/ProductInfoSection";
import { calculateStoneDetails } from "../../utils/calculateStone";
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

	// 주문 행 데이터
	const [orderRows, setOrderRows] = useState<OrderRowData[]>([]);
	const orderStatus = MODE_TO_STATUS[mode as UpdateMode];

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
	const [priorities, setPriorities] = useState<
		{ priorityName: string; priorityDate: number }[]
	>([]);
	const [assistantStones, setAssistantStones] = useState<
		{ assistantStoneId: number; assistantStoneName: string }[]
	>([]);

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
	const [error, setError] = useState("");

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
	const updateOrderRow = async (
		id: string,
		field: keyof OrderRowData,
		value: unknown
	) => {
		setOrderRows((prevRows) => {
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

	// productId가 있을 때 상품 상세 정보 업데이트
	const updateProductDetail = async (productId?: string, rowId?: string) => {
		if (!productId) {
			setCurrentProductDetail(null);
			return;
		}

		const productDetail = await fetchProductDetail(productId);
		setCurrentProductDetail(productDetail);

		if (productDetail && rowId) {
			const targetRow = orderRows.find((row) => row.id === rowId);
			if (!targetRow) return;

			const storeGrade = targetRow.storeGrade || "1";
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

			updateOrderRow(rowId, "stoneInfos", transformedStoneInfos);
			updateOrderRow(
				rowId,
				"classificationId",
				productDetail.classificationDto.classificationId || ""
			);
			updateOrderRow(
				rowId,
				"classificationName",
				productDetail.classificationDto.classificationName || ""
			);
			updateOrderRow(
				rowId,
				"setTypeId",
				productDetail.setTypeDto.setTypeId || ""
			);
			updateOrderRow(
				rowId,
				"setTypeName",
				productDetail.setTypeDto.setTypeName || ""
			);
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
		const row = orderRows.find((r) => r.id === rowId);
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

	// 바로 직전 행의 필수값 가져오기
	const getPreviousRowRequiredValues = (currentIndex: number) => {
		if (currentIndex === 0) return null;

		// 바로 직전 행만 체크
		const prevRow = orderRows[currentIndex - 1];
		if (prevRow && prevRow.storeId && prevRow.productId && prevRow.materialId) {
			return {
				storeId: prevRow.storeId,
				storeName: prevRow.storeName,
				productId: prevRow.productId,
				productName: prevRow.productName,
				materialId: prevRow.materialId,
				materialName: prevRow.materialName,
				factoryId: prevRow.factoryId,
				factoryName: prevRow.factoryName,
				productLaborCost: prevRow.productLaborCost,
				productAddLaborCost: prevRow.productAddLaborCost,
				mainStonePrice: prevRow.mainStonePrice,
				stoneAddLaborCost: prevRow.stoneAddLaborCost,
				mainStoneCount: prevRow.mainStoneCount,
				assistanceStoneCount: prevRow.assistanceStoneCount,
			};
		}
		return null;
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

	// 필수값 자동 복사 핸들러
	const handleRequiredFieldClick = (
		currentRowId: string,
		fieldType: "store" | "product" | "material" | "color"
	) => {
		const currentIndex = orderRows.findIndex((row) => row.id === currentRowId);
		const currentRow = orderRows[currentIndex];

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
				updateOrderRow(currentRowId, "storeId", prevValues.storeId);
				updateOrderRow(currentRowId, "storeName", prevValues.storeName);
			} else if (fieldType === "product") {
				updateOrderRow(currentRowId, "productId", prevValues.productId);
				updateOrderRow(currentRowId, "productName", prevValues.productName);
				updateOrderRow(currentRowId, "factoryId", prevValues.factoryId);
				updateOrderRow(currentRowId, "factoryName", prevValues.factoryName);
				updateOrderRow(currentRowId, "productLaborCost", prevValues.productLaborCost);
				updateOrderRow(currentRowId, "productAddLaborCost", prevValues.productAddLaborCost);
				updateOrderRow(
					currentRowId,
					"mainStonePrice",
					prevValues.mainStonePrice
				);
				updateOrderRow(
					currentRowId,
					"stoneAddLaborCost",
					prevValues.stoneAddLaborCost
				);
				updateOrderRow(
					currentRowId,
					"mainStoneCount",
					prevValues.mainStoneCount
				);
				updateOrderRow(
					currentRowId,
					"assistanceStoneCount",
					prevValues.assistanceStoneCount
				);
			} else if (fieldType === "material") {
				updateOrderRow(currentRowId, "materialId", prevValues.materialId);
				updateOrderRow(currentRowId, "materialName", prevValues.materialName);
			}
		}
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
		setSelectedRowForStore(rowId);
		setIsStoreSearchOpen(true);
	};

	// 거래처 선택 처리
	const handleStoreSelect = (store: StoreSearchDto) => {
		if (selectedRowForStore) {
			const storeIdValue = store.storeId?.toString();

			updateOrderRow(selectedRowForStore, "storeId", storeIdValue);
			updateOrderRow(selectedRowForStore, "storeName", store.storeName || "");
			updateOrderRow(
				selectedRowForStore,
				"storeHarry",
				store.goldHarryLoss || ""
			);
			updateOrderRow(selectedRowForStore, "storeGrade", store.level || "1");
		}
		setIsStoreSearchOpen(false);
		setSelectedRowForStore("");
	};

	// 거래처 검색 팝업 닫기 핸들러
	const handleStoreSearchClose = useCallback(() => {
		setIsStoreSearchOpen(false);
		setSelectedRowForStore("");
	}, []);

	// 제조사 검색 모달 열기
	const openFactorySearch = (rowId: string) => {
		// 기존 팝업이 있으면 닫기
		setSelectedRowForFactory(rowId);
		setIsFactoryModalOpen(true);
	};

	// 제조사 선택 처리
	const handleFactorySelect = (factory: FactorySearchDto) => {
		if (selectedRowForFactory) {
			updateOrderRow(
				selectedRowForFactory,
				"factoryId",
				factory.factoryId?.toString()
			);
			updateOrderRow(
				selectedRowForFactory,
				"factoryName",
				factory.factoryName || ""
			);
		}
		setIsFactoryModalOpen(false);
		setSelectedRowForFactory("");
	};

	// 제조사 검색 팝업 닫기 핸들러
	const handleFactorySearchClose = useCallback(() => {
		setIsFactoryModalOpen(false);
		setSelectedRowForFactory("");
	}, []);

	// 상품 검색 모달 열기
	const openProductSearch = (rowId: string) => {
		if (!validateSequence(rowId, "product")) {
			return;
		}

		setSelectedRowForProduct(rowId);
		setIsProductSearchOpen(true);
	};

	// 상품 선택 처리
	const handleProductSelect = (product: ProductDto) => {
		if (selectedRowForProduct) {
			const productIdValue = product.productId;
			const factoryIdValue = product.factoryId;

			updateOrderRow(selectedRowForProduct, "productId", productIdValue);
			updateOrderRow(
				selectedRowForProduct,
				"productName",
				product.productName || ""
			);
			updateOrderRow(
				selectedRowForProduct,
				"productFactoryName",
				product.productFactoryName || ""
			);
			updateOrderRow(
				selectedRowForProduct,
				"classificationName",
				currentProductDetail?.classificationDto.classificationName || ""
			);
			updateOrderRow(
				selectedRowForProduct,
				"setTypeId",
				currentProductDetail?.setTypeDto.setTypeId || ""
			);
			updateOrderRow(
				selectedRowForProduct,
				"setTypeName",
				currentProductDetail?.setTypeDto.setTypeName || ""
			);
			updateOrderRow(selectedRowForProduct, "factoryId", factoryIdValue);
			updateOrderRow(
				selectedRowForProduct,
				"factoryName",
				product.factoryName || ""
			);
			updateOrderRow(
				selectedRowForProduct,
				"productLaborCost",
				product.productLaborCost || 0
			);

			const mainStone = product.productStones.find((stone) => stone.mainStone);

			const mainStonePrice = mainStone
				? (mainStone.laborCost || 0) * (mainStone.stoneQuantity || 0)
				: 0;
			const mainStoneCount = mainStone?.stoneQuantity || 0;

			updateOrderRow(selectedRowForProduct, "mainStonePrice", mainStonePrice);
			updateOrderRow(selectedRowForProduct, "mainStoneCount", mainStoneCount);

			const assistanceStone = product.productStones.find(
				(stone) => !stone.mainStone
			);

			const assistanceStonePrice = assistanceStone
				? (assistanceStone.laborCost || 0) *
				  (assistanceStone.stoneQuantity || 0)
				: 0;
			const assistanceStoneCount = assistanceStone?.stoneQuantity || 0;

			updateOrderRow(
				selectedRowForProduct,
				"assistanceStonePrice",
				assistanceStonePrice
			);
			updateOrderRow(
				selectedRowForProduct,
				"assistanceStoneCount",
				assistanceStoneCount
			);

			updateOrderRow(
				selectedRowForProduct,
				"mainStoneCount",
				product.productStones.find((stone) => stone.mainStone)?.stoneQuantity ||
					0
			);
			updateOrderRow(
				selectedRowForProduct,
				"assistanceStoneCount",
				product.productStones.find((stone) => !stone.mainStone)
					?.stoneQuantity || 0
			);
		}
		setIsProductSearchOpen(false);
		setSelectedRowForProduct("");
	};

	// 스톤 정보 관리 모달 열기
	const openStoneInfoManager = (rowId: string) => {
		const url = `/orders/stone-info?rowId=${rowId}&origin=${window.location.origin}`;
		const NAME = `stoneInfo_${rowId}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1200,height=800";

		const popup = window.open(url, NAME, FEATURES);
		if (popup) {
			// 팝업에서 스톤 정보 요청 시 응답
			const handleMessage = (event: MessageEvent) => {
				if (
					event.data.type === "REQUEST_STONE_INFO" &&
					event.data.rowId === rowId
				) {
					const row = orderRows.find((r) => r.id === rowId);
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
					// 스톤 정보 업데이트
					updateOrderRow(rowId, "stoneInfos", event.data.stoneInfos);

					// 스톤 정보 변경 시 알 단가 자동 계산
					const calculatedStoneData = calculateStoneDetails(
						event.data.stoneInfos
					);
					updateOrderRow(
						rowId,
						"mainStonePrice",
						calculatedStoneData.mainStonePrice
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
				}
			};

			window.addEventListener("message", handleMessage);

			// 팝업이 닫힐 때 이벤트 리스너 제거
			const checkClosed = setInterval(() => {
				if (popup.closed) {
					window.removeEventListener("message", handleMessage);
					clearInterval(checkClosed);
				}
			}, 1000);
		}
	};

	// 상품 검색 팝업 닫기 핸들러
	const handleProductSearchClose = useCallback(() => {
		setIsProductSearchOpen(false);
		setSelectedRowForProduct("");
	}, []);

	// 초기 데이터 로드
	useEffect(() => {
		const loadInitialData = async () => {
			console.log("mode = ", mode);
			try {
				setLoading(true);

				// 기본 드롭다운 데이터만 로드
				const [materialRes, colorRes, priorityRes, assistantStoneRes] =
					await Promise.all([
						materialApi.getMaterials(),
						colorApi.getColors(),
						priorityApi.getPriorities(),
						assistantStoneApi.getAssistantStones(),
					]);

				if (materialRes.success) {
					const materials = (materialRes.data || []).map((m) => ({
						materialId: m.materialId?.toString() || "",
						materialName: m.materialName,
					}));
					setMaterials(materials);
				}
				if (colorRes.success) {
					const colors = (colorRes.data || []).map((c) => ({
						colorId: c.colorId?.toString() || "",
						colorName: c.colorName,
					}));
					setColors(colors);
				}
				if (assistantStoneRes.success) {
					const assistantStones = (assistantStoneRes.data || []).map((a) => ({
						assistantStoneId: a.assistantStoneId,
						assistantStoneName: a.assistantStoneName,
					}));
					setAssistantStones(assistantStones);
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
						const newRow: OrderRowData = {
							id: `${Date.now()}-${i}`,
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
							colorId: "",
							colorName: "",
							factoryId: "",
							factoryName: "",
							factoryHarry: "",
							productSize: "",
							stoneWeight: 0,
							isProductWeightSale: false,
							priorityName: priorities[0]?.priorityName || "일반",
							mainStoneNote: "",
							assistanceStoneNote: "",
							orderNote: "",
							stoneInfos: [],
							productLaborCost: 0, // 중심단가
							productAddLaborCost: 0, // 추가단가
							mainStonePrice: 0,
							assistanceStonePrice: 0,
							mainStoneCount: 0,
							assistanceStoneCount: 0,
							stoneAddLaborCost: 0, // 추가 스톤 판매단가
							stoneWeightTotal: 0,
							createAt: currentDate,
							shippingAt: defaultDeliveryDate,
							// 보조석 관련 필드
							assistantStone: false,
							assistantStoneId:
								defaultAssistantStone?.assistantStoneId.toString() || "1",
							assistantStoneName:
								defaultAssistantStone?.assistantStoneName || "",
							assistantStoneCreateAt: "",
						};
						initialRows.push(newRow);
					}
					setOrderRows(initialRows);
				}
			} catch (err) {
				handleError(err, setError);
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
			(row) => row.storeId && row.productId && row.materialId
		);

		if (validRows.length === 0) {
			alert(
				"주문할 상품을 추가해주세요. (거래처, 모델번호, 재질은 필수입니다)"
			);
			return;
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
			const responses = await Promise.all(promises);
			const createdFlowCodes = responses.map((res) => res.data).filter(Boolean);

			// 팝업창에서 먼저 alert 표시
			alert(`${createdFlowCodes.length}개의 주문이 성공적으로 생성되었습니다.`);

			// 부모창에 메시지 전송
			if (window.opener) {
				window.opener.postMessage(
					{
						type: "ORDER_CREATED",
						flowCodes: createdFlowCodes,
					},
					window.location.origin
				);
			}

			console.log("Created flow codes:", createdFlowCodes);

			// 팝업창 닫기
			window.close();
		} catch (err) {
			handleError(err, setError);
			alert("주문 등록에 실패했습니다.");
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

export default OrderCreatePage;
