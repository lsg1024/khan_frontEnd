import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { storeApi } from "../../../libs/api/store";
import { priorityApi } from "../../../libs/api/priority";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { useErrorHandler } from "../../utils/errorHandler";
import {
	addBusinessDays,
	formatDateToString,
	getLocalDate,
	formatToLocalDate,
} from "../../utils/dateUtils";
import type {
	OrderRowData,
	OrderResponseDetail,
	OrderRequestDetail,
} from "../../types/order";
import type { StoneInfo } from "../../types/stone";
import OrderTable from "../../components/common/order/OrderTable";
import StoreSearch from "../../components/common/store/StoreSearch";
import FactorySearch from "../../components/common/factory/FactorySearch";
import ProductSearch from "../../components/common/product/ProductSearch";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto } from "../../types/store";
import type { ProductDto } from "../../types/product";
import "../../styles/pages/OrderCreatePage.css";

const POPUP_ORIGIN = window.location.origin;

type UpdateMode = "order" | "fix" | "expact";

const MODE_TO_STATUS = {
	order: "ORDER",
	fix: "FIX",
	expact: "EXPACT",
} as const satisfies Record<UpdateMode, "ORDER" | "FIX" | "EXPACT">;

// 스톤 계산
const calculateStoneDetails = (stoneInfos: StoneInfo[]) => {
	const details = {
		mainStonePrice: 0,
		assistanceStonePrice: 0,
		additionalStonePrice: 0,
		mainStoneCount: 0,
		assistanceStoneCount: 0,
		stoneWeightTotal: 0,
	};

	if (!stoneInfos || stoneInfos.length === 0) {
		return details;
	}

	stoneInfos.forEach((stone) => {
		const quantity = stone.quantity || 0;
		const weight = stone.stoneWeight || 0;
		const laborCost = stone.laborCost || 0;

		if (stone.includeStone) {
			details.stoneWeightTotal += Number(weight) * Number(quantity);
			if (stone.mainStone) {
				details.mainStoneCount += quantity;
				details.mainStonePrice += laborCost * quantity;
			} else {
				details.assistanceStoneCount += quantity;
				details.assistanceStonePrice += laborCost * quantity;
			}
		}
	});
	details.mainStonePrice = Math.round(details.mainStonePrice * 1000) / 1000;
	details.assistanceStonePrice =
		Math.round(details.assistanceStonePrice * 1000) / 1000;
	details.stoneWeightTotal = Math.round(details.stoneWeightTotal * 1000) / 1000;
	return details;
};

const OrderUpdatePage: React.FC = () => {
	const { mode, flowCode } = useParams<{
		mode: UpdateMode;
		flowCode: string;
	}>();
	const [searchParams] = useSearchParams();
	const stockMode = searchParams.get("mode") === "stock";

	const { handleError } = useErrorHandler();

	// 팝업 참조를 저장하는 ref
	const popupMapRef = useRef<{ [key: string]: Window }>({});
	const storeSearchPopupRef = useRef<Window | null>(null);
	const factorySearchPopupRef = useRef<Window | null>(null);
	const productSearchPopupRef = useRef<Window | null>(null);

	const [orderDetail, setOrderDetail] = useState<OrderResponseDetail | null>(
		null
	);
	const [initialImagePath, setInitialImagePath] = useState<
		string | undefined
	>();
	const [orderRows, setOrderRows] = useState<OrderRowData[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// 검색 모달 상태
	const [isStoreSearchOpen, setIsStoreSearchOpen] = useState(false);
	const [selectedRowForStore, setSelectedRowForStore] = useState<string>("");
	const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);
	const [selectedRowForFactory, setSelectedRowForFactory] =
		useState<string>("");
	const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
	const [selectedRowForProduct, setSelectedRowForProduct] =
		useState<string>("");
	const [storeGrade, setStoreGrade] = useState<string>("");

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

	const orderStatus = MODE_TO_STATUS[mode as UpdateMode];
	const currentDate = getLocalDate();

	const convertToOrderRowData = (
		detail: OrderResponseDetail,
		storeGrade: string,
		materials: { materialId: string; materialName: string }[],
		colors: { colorId: string; colorName: string }[],
		priorities: { priorityName: string; priorityDate: number }[],
		assistantStonesParam: {
			assistantStoneId: number;
			assistantStoneName: string;
		}[]
	): OrderRowData => {
		const calculatedStoneData = calculateStoneDetails(detail.stoneInfos);

		const foundPriority = priorities.find(
			(p) => p.priorityName === detail.priority
		);

		let deliveryDate = detail.createAt;
		if (foundPriority && detail.createAt) {
			const calculatedDate = addBusinessDays(
				detail.createAt,
				foundPriority.priorityDate
			);
			deliveryDate = formatDateToString(calculatedDate);
		}

		const foundAssistantStone = assistantStonesParam.find(
			(a) =>
				a.assistantStoneId.toString() ===
				(detail.assistantStoneId?.toString() ?? "")
		);

		const baseRowData: Omit<OrderRowData, keyof typeof calculatedStoneData> = {
			id: detail.flowCode,
			storeId: detail.storeId,
			storeName: detail.storeName,
			storeGrade: storeGrade,
			storeHarry: detail.storeHarry,
			productId: detail.productId,
			productName: detail.productName,
			productFactoryName: detail.productFactoryName,
			classificationId: detail.classificationId,
			classificationName: detail.classificationName,
			materialId: detail.materialId,
			materialName: detail.materialName,
			colorId: detail.colorId,
			colorName: detail.colorName,
			setTypeId: detail.setTypeId,
			setTypeName: detail.setTypeName,
			factoryId: detail.factoryId,
			factoryName: detail.factoryName,
			factoryHarry: detail.factoryHarry,
			productSize: detail.productSize,
			orderNote: detail.orderNote,
			mainStoneNote: detail.mainStoneNote,
			assistanceStoneNote: detail.assistanceStoneNote,
			priorityName: detail.priority,
			stoneInfos: detail.stoneInfos || [],
			createAt: formatToLocalDate(detail.createAt),
			shippingAt: deliveryDate,
			assistantStone: detail.assistantStone || false,
			assistantStoneId: detail.assistantStoneId?.toString() ?? "",
			assistantStoneName:
				foundAssistantStone?.assistantStoneName ||
				detail.assistantStoneName ||
				"",
			assistantStoneCreateAt: detail.assistantStoneCreateAt || "",

			mainPrice: 0,
			additionalPrice: 0,
			stoneWeight: 0,
			productAddLaborCost: 0,
			isProductWeightSale: false,
		};

		return {
			...baseRowData,
			...calculatedStoneData,
		};
	};

	// 주문 행 업데이트
	const updateOrderRow = (
		id: string,
		field: keyof OrderRowData,
		value: unknown
	) => {
		setOrderRows((prevRows) => {
			const updatedRows = prevRows.map((row) => {
				if (row.id === id) {
					const updatedRow = { ...row, [field]: value };
					return updatedRow;
				}
				return row;
			});
			return updatedRows;
		});
	};

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

	// 검색 모달 핸들러들
	const handleStoreSearchOpen = (rowId: string) => {
		// 기존 팝업이 있으면 닫기
		if (storeSearchPopupRef.current && !storeSearchPopupRef.current.closed) {
			storeSearchPopupRef.current.close();
		}

		const url = `/store-search?rowId=${rowId}&origin=${POPUP_ORIGIN}`;
		const NAME = `storeSearch_${rowId}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=800,height=600";

		const popup = window.open(url, NAME, FEATURES);
		if (popup) {
			storeSearchPopupRef.current = popup;

			// 팝업에서 거래처 선택 시 처리
			const handleMessage = (event: MessageEvent) => {
				if (
					event.data.type === "STORE_SELECTED" &&
					event.data.rowId === rowId
				) {
					const store = event.data.store as StoreSearchDto;
					handleStoreSelectWithRowId(store, rowId);
				}
			};

			window.addEventListener("message", handleMessage);

			// 팝업이 닫힐 때 이벤트 리스너 제거
			const checkClosed = setInterval(() => {
				if (popup.closed) {
					window.removeEventListener("message", handleMessage);
					clearInterval(checkClosed);
					storeSearchPopupRef.current = null;
				}
			}, 1000);
		} else {
			// 팝업 방식이 실패하면 기존 모달 방식 사용
			setSelectedRowForStore(rowId);
			setIsStoreSearchOpen(true);
		}
	};

	const handleProductSearchOpen = (rowId: string) => {
		// 기존 팝업이 있으면 닫기
		if (
			productSearchPopupRef.current &&
			!productSearchPopupRef.current.closed
		) {
			productSearchPopupRef.current.close();
		}

		const url = `/product-search?rowId=${rowId}&origin=${POPUP_ORIGIN}`;
		const NAME = `productSearch_${rowId}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=800,height=600";

		const popup = window.open(url, NAME, FEATURES);
		if (popup) {
			productSearchPopupRef.current = popup;

			// 팝업에서 상품 선택 시 처리
			const handleMessage = (event: MessageEvent) => {
				if (
					event.data.type === "PRODUCT_SELECTED" &&
					event.data.rowId === rowId
				) {
					const product = event.data.product as ProductDto;
					handleProductSelectWithRowId(product, rowId);
				}
			};

			window.addEventListener("message", handleMessage);

			// 팝업이 닫힐 때 이벤트 리스너 제거
			const checkClosed = setInterval(() => {
				if (popup.closed) {
					window.removeEventListener("message", handleMessage);
					clearInterval(checkClosed);
					productSearchPopupRef.current = null;
				}
			}, 1000);
		} else {
			// 팝업 방식이 실패하면 기존 모달 방식 사용
			setSelectedRowForProduct(rowId);
			setIsProductSearchOpen(true);
		}
	};

	const handleFactorySearchOpen = (rowId: string) => {
		// 기존 팝업이 있으면 닫기
		if (
			factorySearchPopupRef.current &&
			!factorySearchPopupRef.current.closed
		) {
			factorySearchPopupRef.current.close();
		}

		const url = `/factory-search?rowId=${rowId}&origin=${POPUP_ORIGIN}`;
		const NAME = `factorySearch_${rowId}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=800,height=600";

		const popup = window.open(url, NAME, FEATURES);
		if (popup) {
			factorySearchPopupRef.current = popup;

			// 팝업에서 제조사 선택 시 처리
			const handleMessage = (event: MessageEvent) => {
				if (
					event.data.type === "FACTORY_SELECTED" &&
					event.data.rowId === rowId
				) {
					const factory = event.data.factory as FactorySearchDto;
					handleFactorySelectWithRowId(factory, rowId);
				}
			};

			window.addEventListener("message", handleMessage);

			// 팝업이 닫힐 때 이벤트 리스너 제거
			const checkClosed = setInterval(() => {
				if (popup.closed) {
					window.removeEventListener("message", handleMessage);
					clearInterval(checkClosed);
					factorySearchPopupRef.current = null;
				}
			}, 1000);
		} else {
			// 팝업 방식이 실패하면 기존 모달 방식 사용
			setSelectedRowForFactory(rowId);
			setIsFactoryModalOpen(true);
		}
	};

	// 스톤 정보 관리 모달 열기
	const openStoneInfoManager = (rowId: string) => {
		// 기존 해당 rowId의 팝업이 있으면 닫기
		const existingPopup = popupMapRef.current[rowId];
		if (existingPopup && !existingPopup.closed) {
			existingPopup.close();
		}

		const url = `/orders/stone-info?rowId=${rowId}&origin=${POPUP_ORIGIN}`;
		const NAME = `stoneInfo_${rowId}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1200,height=400";

		const popup = window.open(url, NAME, FEATURES);
		if (popup) {
			popupMapRef.current[rowId] = popup; // ref에 팝업 참조 저장
			popup.focus();
		} else {
			alert("팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.");
		}
	};

	useEffect(() => {
		const handleMessageFromPopup = (event: MessageEvent) => {
			if (event.origin !== POPUP_ORIGIN) {
				return;
			}

			const { type, rowId, stoneInfos } = event.data;

			switch (type) {
				case "REQUEST_STONE_INFO": {
					setOrderRows((currentRows) => {
						const targetRow = currentRows.find((row) => row.id === rowId);
						const popup = popupMapRef.current[rowId];

						if (targetRow && popup && !popup.closed) {
							popup.postMessage(
								{
									type: "STONE_INFO_DATA",
									stoneInfos: targetRow.stoneInfos,
								},
								POPUP_ORIGIN
							);
						}
						return currentRows;
					});
					break;
				}
				case "REQUEST_STORE_GRADE": {
					const popup = popupMapRef.current[rowId];
					if (popup && !popup.closed) {
						popup.postMessage(
							{
								type: "STORE_GRADE_DATA",
								storeGrade: storeGrade,
							},
							POPUP_ORIGIN
						);
					}
					break;
				}
				case "STONE_INFO_SAVE": {
					// orderDetail의 stoneInfos 업데이트
					setOrderDetail((currentDetail) => {
						if (currentDetail) {
							const updatedOrderDetail = {
								...currentDetail,
								stoneInfos: stoneInfos,
							};
							return updatedOrderDetail;
						}
						return currentDetail;
					});

					// orderRows도 직접 업데이트 (즉시 반영을 위해)
					updateOrderRow(rowId, "stoneInfos", stoneInfos);

					// 스톤 정보 변경 시 알 단가 등 자동 재계산
					const calculated = calculateStoneDetails(stoneInfos);
					updateOrderRow(rowId, "mainStonePrice", calculated.mainStonePrice);
					updateOrderRow(
						rowId,
						"assistanceStonePrice",
						calculated.assistanceStonePrice
					);
					updateOrderRow(
						rowId,
						"additionalStonePrice",
						calculated.additionalStonePrice
					);
					updateOrderRow(rowId, "mainStoneCount", calculated.mainStoneCount);
					updateOrderRow(
						rowId,
						"assistanceStoneCount",
						calculated.assistanceStoneCount
					);
					updateOrderRow(
						rowId,
						"stoneWeightTotal",
						calculated.stoneWeightTotal
					);
					break;
				}
			}
		};

		window.addEventListener("message", handleMessageFromPopup);

		return () => {
			window.removeEventListener("message", handleMessageFromPopup);
		};
	}, [storeGrade]);

	// orderDetail이 변경될 때마다 orderRows 재계산
	useEffect(() => {
		if (
			orderDetail &&
			materials.length > 0 &&
			colors.length > 0 &&
			priorities.length > 0
		) {
			const rowData = convertToOrderRowData(
				orderDetail,
				storeGrade,
				materials,
				colors,
				priorities,
				assistantStones
			);
			setOrderRows([rowData]);
		}
	}, [orderDetail, materials, colors, priorities, storeGrade]); // eslint-disable-line react-hooks/exhaustive-deps

	// 검색 결과 선택 핸들러들 (팝업용)
	const handleStoreSelectWithRowId = (store: StoreSearchDto, rowId: string) => {
		if (store.storeId === undefined || store.storeId === null) {
			alert("거래처 ID가 누락되었습니다. 다른 거래처를 선택해주세요.");
			return;
		}

		updateOrderRow(rowId, "storeId", store.storeId.toString());
		updateOrderRow(rowId, "storeName", store.storeName || "");
	};

	// 검색 결과 선택 핸들러들 (모달용)
	const handleStoreSelect = (store: StoreSearchDto) => {
		if (selectedRowForStore) {
			if (store.storeId === undefined || store.storeId === null) {
				alert("거래처 ID가 누락되었습니다. 다른 거래처를 선택해주세요.");
				return;
			}

			updateOrderRow(selectedRowForStore, "storeId", store.storeId.toString());
			updateOrderRow(selectedRowForStore, "storeName", store.storeName || "");
		}
		setIsStoreSearchOpen(false);
		setSelectedRowForStore("");
	};

	// 거래처 검색 팝업 닫기 핸들러
	const handleStoreSearchClose = useCallback(() => {
		setIsStoreSearchOpen(false);
		setSelectedRowForStore("");
	}, []);

	const handleProductSelectWithRowId = (product: ProductDto, rowId: string) => {
		if (!product.productId) {
			alert("상품 ID가 누락되었습니다. 다른 상품을 선택해주세요.");
			return;
		}

		if (!product.factoryId) {
			alert("제조사 ID가 누락되었습니다. 다른 상품을 선택해주세요.");
			return;
		}

		const productIdValue = product.productId;
		const factoryIdValue = product.factoryId;
		updateOrderRow(rowId, "productId", productIdValue);
		updateOrderRow(rowId, "productName", product.productName || "");
		updateOrderRow(
			rowId,
			"productFactoryName",
			product.productFactoryName || ""
		);
		updateOrderRow(rowId, "factoryId", factoryIdValue);
		updateOrderRow(rowId, "factoryName", product.factoryName || "");
	};

	const handleProductSelect = (product: ProductDto) => {
		if (selectedRowForProduct) {
			if (!product.productId) {
				alert("상품 ID가 누락되었습니다. 다른 상품을 선택해주세요.");
				return;
			}

			if (!product.factoryId) {
				alert("제조사 ID가 누락되었습니다. 다른 상품을 선택해주세요.");
				return;
			}

			const productIdValue = product.productId;
			const factoryIdValue = product.factoryId;
			updateOrderRow(selectedRowForProduct, "productId", productIdValue);
			updateOrderRow(
				selectedRowForProduct,
				"productName",
				product.productName || ""
			);
			updateOrderRow(selectedRowForProduct, "factoryId", factoryIdValue);
			updateOrderRow(
				selectedRowForProduct,
				"factoryName",
				product.factoryName || ""
			);
		}
		setIsProductSearchOpen(false);
		setSelectedRowForProduct("");
	};

	// 상품 검색 팝업 닫기 핸들러
	const handleProductSearchClose = useCallback(() => {
		setIsProductSearchOpen(false);
		setSelectedRowForProduct("");
	}, []);

	const handleFactorySelectWithRowId = (
		factory: FactorySearchDto,
		rowId: string
	) => {
		if (factory.factoryId === undefined || factory.factoryId === null) {
			alert("제조사 ID가 누락되었습니다. 다른 제조사를 선택해주세요.");
			return;
		}

		const factoryIdValue = factory.factoryId.toString();
		updateOrderRow(rowId, "factoryId", factoryIdValue);
		updateOrderRow(rowId, "factoryName", factory.factoryName || "");
	};

	const handleFactorySelect = (factory: FactorySearchDto) => {
		if (selectedRowForFactory) {
			if (factory.factoryId === undefined || factory.factoryId === null) {
				alert("제조사 ID가 누락되었습니다. 다른 제조사를 선택해주세요.");
				return;
			}

			const factoryIdValue = factory.factoryId.toString();
			updateOrderRow(selectedRowForFactory, "factoryId", factoryIdValue);
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

	// 초기 데이터 로드
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				const tempImagePath = sessionStorage.getItem("tempImagePath");
				if (tempImagePath) {
					setInitialImagePath(tempImagePath);
				}
				setLoading(true);

				// 주문 상세 정보와 드롭다운 데이터를 병렬로 로드
				const [
					orderRes,
					materialRes,
					colorRes,
					priorityRes,
					assistantStoneRes,
				] = await Promise.all([
					flowCode
						? orderApi.getOrder(flowCode)
						: Promise.resolve({ success: false, data: null }),
					materialApi.getMaterials(),
					colorApi.getColors(),
					priorityApi.getPriorities(),
					assistantStoneApi.getAssistantStones(),
				]);

				// 드롭다운 데이터 설정
				let materialsData: { materialId: string; materialName: string }[] = [];
				let colorsData: { colorId: string; colorName: string }[] = [];
				let prioritiesData: { priorityName: string; priorityDate: number }[] =
					[];
				let assistantStonesData: {
					assistantStoneId: number;
					assistantStoneName: string;
				}[] = [];

				if (materialRes.success) {
					materialsData = (materialRes.data || []).map((m) => ({
						materialId: m.materialId?.toString() || "",
						materialName: m.materialName,
					}));
					setMaterials(materialsData);
				}

				if (colorRes.success) {
					colorsData = (colorRes.data || []).map((c) => ({
						colorId: c.colorId?.toString() || "",
						colorName: c.colorName,
					}));
					setColors(colorsData);
				}

				if (priorityRes.success) {
					prioritiesData = (priorityRes.data || []).map((p) => ({
						priorityName: p.priorityName,
						priorityDate: p.priorityDate,
					}));
					setPriorities(prioritiesData);
				}

				if (assistantStoneRes.success) {
					assistantStonesData = (assistantStoneRes.data || []).map((a) => ({
						assistantStoneId: a.assistantStoneId,
						assistantStoneName: a.assistantStoneName,
					}));
					setAssistantStones(assistantStonesData);
				}

				// 주문 상세 정보를 OrderRowData로 변환 (드롭다운 데이터와 함께)
				if (orderRes.success && orderRes.data) {
					const detail = orderRes.data as OrderResponseDetail;
					setOrderDetail(detail);

					let grade = "";
					const storeGradeRes = await storeApi.getStoreGrade(detail.storeId);
					if (storeGradeRes.success && storeGradeRes.data) {
						grade = storeGradeRes.data;
						setStoreGrade(grade);
					}

					// OrderRowData로 변환하여 설정 (드롭다운 데이터 포함)
					const rowData = convertToOrderRowData(
						detail,
						grade,
						materialsData,
						colorsData,
						prioritiesData,
						assistantStonesData
					);
					setOrderRows([rowData]);
				}

				if (assistantStoneRes.success) {
					const assistantStones = (assistantStoneRes.data || []).map((a) => ({
						assistantStoneId: a.assistantStoneId,
						assistantStoneName: a.assistantStoneName,
					}));
					setAssistantStones(assistantStones);
				}
			} catch (err) {
				handleError(err, setError);
			} finally {
				setLoading(false);
			}
		};

		loadInitialData();
	}, [flowCode]); // eslint-disable-line react-hooks/exhaustive-deps

	// 저장 핸들러
	const handleSave = async () => {
		if (!orderDetail || orderRows.length === 0) {
			alert("저장할 주문 정보가 없습니다.");
			return;
		}

		try {
			setLoading(true);

			const currentRow = orderRows[0];

			// OrderCreateRequest 형식으로 데이터 변환
			const orderUpdateData: OrderRequestDetail = {
				storeId: currentRow.storeId,
				orderNote: currentRow.orderNote,
				factoryId: currentRow.factoryId,
				productId: currentRow.productId,
				productSize: currentRow.productSize,
				isProductWeightSale: currentRow.isProductWeightSale,
				productAddLaborCost: currentRow.productAddLaborCost,
				materialId: currentRow.materialId,
				colorId: currentRow.colorId,
				priorityName: currentRow.priorityName,
				stoneWeight: Number(currentRow.stoneWeightTotal),
				mainStoneNote: currentRow.mainStoneNote,
				assistanceStoneNote: currentRow.assistanceStoneNote,
				assistantStone: currentRow.assistantStone,
				assistantStoneId: currentRow.assistantStoneId || "1", // 기본값 설정
				assistantStoneName: currentRow.assistantStoneName,
				assistantStoneCreateAt: currentRow.assistantStoneCreateAt,
				createAt: formatToLocalDate(currentRow.createAt),
				shippingAt: currentRow.shippingAt,
				stoneInfos: currentRow.stoneInfos,
			};
			// 필수 필드 검증
			if (!orderUpdateData.storeId) {
				alert("거래처 정보가 누락되었습니다.");
				return;
			}
			if (!orderUpdateData.factoryId) {
				alert("제조사 정보가 누락되었습니다.");
				return;
			}
			if (!orderUpdateData.productId) {
				alert("상품 정보가 누락되었습니다.");
				return;
			}
			const response = await orderApi.orderUpdate(
				flowCode!,
				orderStatus!,
				orderUpdateData
			);

			if (response.success) {
				alert("주문이 성공적으로 업데이트되었습니다.");

				window.close();
			} else {
				throw new Error(response.message || "주문 업데이트에 실패했습니다.");
			}
		} catch (err) {
			handleError(err, setError);
			alert("주문 업데이트에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// 취소 핸들러
	const handleCancel = () => {
		if (window.confirm("작성을 취소하시겠습니까?")) {
			window.close();
		}
	};

	if (loading && !orderDetail) {
		return (
			<>
				<div className="loading-container">
					<div className="spinner"></div>
					<p>주문정보를 불러오는 중...</p>
				</div>
			</>
		);
	}

	return (
		<div className="order-update-page">
			{/* 에러 메시지 */}
			{error && (
				<div className="error-message">
					<span>⚠️</span>
					<p>{error}</p>
				</div>
			)}

			{/* 주문 상세 정보 카드 */}
			<div className="order-detail-card">
				<img src={initialImagePath} alt="Product" />
				<h3>{stockMode ? "재고 등록" : "주문 정보"}</h3>
				<div className="detail-grid">
					<div className="detail-item">
						<label>주문코드:</label>
						<span>{orderDetail?.flowCode}</span>
					</div>
					<div className="detail-item">
						<label>주문일:</label>
						<span>
							{orderDetail?.createAt
								? formatToLocalDate(orderDetail.createAt)
								: "-"}
						</span>
					</div>
					<div className="detail-item">
						<label>주문 상태:</label>
						<span>{orderDetail?.orderStatus}</span>
					</div>
				</div>
			</div>

			{/* 주문 테이블 */}
			<OrderTable
				mode="update"
				orderRows={orderRows}
				loading={loading}
				materials={materials}
				colors={colors}
				priorities={priorities}
				assistantStones={assistantStones}
				onRowUpdate={updateOrderRow}
				onAssistanceStoneArrivalChange={handleAssistanceStoneArrivalChange}
				onStoreSearchOpen={handleStoreSearchOpen}
				onProductSearchOpen={handleProductSearchOpen}
				onFactorySearchOpen={handleFactorySearchOpen}
				onStoneInfoOpen={openStoneInfoManager}
			/>

			{/* 저장/취소 버튼 */}
			<div className="form-actions">
				<button
					className="btn-cancel"
					onClick={handleCancel}
					disabled={loading}
				>
					{orderDetail?.orderStatus === "재고" ? "닫기" : "취소"}
				</button>
				<button
					className="btn-submit"
					onClick={handleSave}
					disabled={loading || orderDetail?.orderStatus === "재고"}
					style={{
						opacity: orderDetail?.orderStatus === "재고" ? 0.5 : 1,
						cursor:
							orderDetail?.orderStatus === "재고" ? "not-allowed" : "pointer",
					}}
				>
					{loading ? "저장 중..." : stockMode ? "등록" : "수정"}
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

export default OrderUpdatePage;
