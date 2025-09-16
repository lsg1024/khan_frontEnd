import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { priorityApi } from "../../../libs/api/priority";
import { productApi } from "../../../libs/api/product";
import { useErrorHandler } from "../../utils/errorHandler";
import type {
	OrderRowData,
	OrderCreateRequest,
	PastOrderDto,
} from "../../types/order";
import type { Product } from "../../types/product";
import type { ProductStoneDto } from "../../types/stone";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto } from "../../types/store";
import type { ProductDto } from "../../types/catalog";
import StoreSearch from "../../components/common/product/StoreSearch";
import FactorySearch from "../../components/common/product/FactorySearch";
import ProductSearch from "../../components/common/product/ProductSearch";
import "../../styles/pages/OrderCreatePage.css";

const OrderCreatePage = () => {
	const navigate = useNavigate();
	const { handleError } = useErrorHandler();

	// 주문 행 데이터
	const [orderRows, setOrderRows] = useState<OrderRowData[]>([]);

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

	// 새 주문 행 추가
	const addOrderRow = () => {
		const defaultPriority =
			priorities.length > 0
				? priorities[0]
				: { priorityName: "일반", priorityDate: 7 };
		const currentDate = new Date();
		const defaultDeliveryDate = new Date(currentDate);
		defaultDeliveryDate.setDate(
			currentDate.getDate() + defaultPriority.priorityDate
		);
		const formattedDefaultDate = defaultDeliveryDate
			.toISOString()
			.split("T")[0];

		const newRow: OrderRowData = {
			id: Date.now().toString(),
			storeId: "",
			storeName: "",
			productId: "",
			productName: "",
			productImage: "",
			materialId: "",
			materialName: "",
			colorId: "",
			colorName: "",
			classificationId: "",
			classificationName: "",
			setType: "",
			factoryId: "",
			factoryName: "",
			productSize: "",
			productWeight: 0,
			stoneWeight: 0,
			productAddLaborCost: 0,
			isProductWeightSale: false,
			priorityName: defaultPriority.priorityName,
			mainStoneNote: "",
			assistanceStoneNote: "",
			orderNote: "",
			stoneInfos: [],
			mainPrice: 0, // 기본 판매단가
			additionalPrice: 0, // 추가 판매단가
			mainStonePrice: 0, // 스톤 중심 판매단가
			assistanceStonePrice: 0, // 보조 중심 판매단가
			additionalStonePrice: 0, // 추가 스톤 판매단가
			mainStoneCount: 0,
			assistanceStoneCount: 0,
			stoneWeightTotal: 0,
			deliveryDate: formattedDefaultDate,
			// 보조석 관련 필드
			assistanceStoneType: "없음",
			assistanceStoneArrival: "N",
			assistanceStoneArrivalDate: "",
		};
		setOrderRows([...orderRows, newRow]);
	};

	// 주문 행 초기화 (삭제 대신)
	const resetOrderRow = (id: string) => {
		if (window.confirm("초기화하시겠습니까?")) {
			// 기본 priority 날짜 계산 (서버에서 받아온 첫 번째 데이터 사용)
			const defaultPriority = priorities[0];
			const currentDate = new Date();
			const defaultDeliveryDate = new Date(currentDate);
			defaultDeliveryDate.setDate(
				currentDate.getDate() + defaultPriority.priorityDate
			);
			const formattedDefaultDate = defaultDeliveryDate
				.toISOString()
				.split("T")[0];

			setOrderRows((prevRows) =>
				prevRows.map((row) => {
					if (row.id === id) {
						return {
							...row,
							storeId: "",
							storeName: "",
							productId: "",
							productName: "",
							productImage: "",
							materialId: "",
							materialName: "",
							colorId: "",
							colorName: "",
							classificationId: "",
							classificationName: "",
							setType: "",
							factoryId: "",
							factoryName: "",
							productSize: "",
							productWeight: 0,
							stoneWeight: 0,
							productAddLaborCost: 0,
							isProductWeightSale: false,
							priorityName: defaultPriority.priorityName,
							mainStoneNote: "",
							assistanceStoneNote: "",
							orderNote: "",
							stoneInfos: [],
							basicPrice: 0,
							additionalPrice: 0,
							mainStonePrice: 0,
							assistanceStonePrice: 0,
							additionalStonePrice: 0,
							mainStoneCount: 0,
							assistanceStoneCount: 0,
							stoneWeightTotal: 0,
							deliveryDate: formattedDefaultDate,
							assistanceStoneType: "없음",
							assistanceStoneArrival: "N",
							assistanceStoneArrivalDate: "",
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
		value: string | number | boolean
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
								updateProductDetail(updatedRow.productId);
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
	const updateProductDetail = async (productId?: string) => {
		if (!productId) {
			setCurrentProductDetail(null);
			return;
		}
		const productDetail = await fetchProductDetail(productId);
		setCurrentProductDetail(productDetail);
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
				await updateProductDetail(row.productId);
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
				productImage: prevRow.productImage,
				materialId: prevRow.materialId,
				materialName: prevRow.materialName,
				factoryId: prevRow.factoryId,
				factoryName: prevRow.factoryName,
				mainPrice: prevRow.mainPrice,
				mainStonePrice: prevRow.mainStonePrice,
				assistanceStonePrice: prevRow.assistanceStonePrice,
				mainStoneCount: prevRow.mainStoneCount,
				assistanceStoneCount: prevRow.assistanceStoneCount,
				productWeight: prevRow.productWeight,
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
			prevRow.materialId
		);
	};

	// 필수값 자동 복사 핸들러
	const handleRequiredFieldClick = (
		currentRowId: string,
		fieldType: "store" | "product" | "material"
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
				updateOrderRow(currentRowId, "productImage", prevValues.productImage);
				updateOrderRow(currentRowId, "factoryId", prevValues.factoryId);
				updateOrderRow(currentRowId, "factoryName", prevValues.factoryName);
				updateOrderRow(currentRowId, "mainPrice", prevValues.mainPrice);
				updateOrderRow(
					currentRowId,
					"mainStonePrice",
					prevValues.mainStonePrice
				);
				updateOrderRow(
					currentRowId,
					"assistanceStonePrice",
					prevValues.assistanceStonePrice
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
				updateOrderRow(currentRowId, "productWeight", prevValues.productWeight);
			} else if (fieldType === "material") {
				updateOrderRow(currentRowId, "materialId", prevValues.materialId);
				updateOrderRow(currentRowId, "materialName", prevValues.materialName);
			}
		}
	};
	const handleAssistanceStoneArrivalChange = (id: string, value: string) => {
		if (value === "Y") {
			// Y로 변경 시 현재 날짜를 자동 설정
			const currentDate = new Date().toISOString().split("T")[0];
			updateOrderRow(id, "assistanceStoneArrival", value);
			updateOrderRow(id, "assistanceStoneArrivalDate", currentDate);
		} else {
			// N으로 변경 시 날짜 초기화
			updateOrderRow(id, "assistanceStoneArrival", value);
			updateOrderRow(id, "assistanceStoneArrivalDate", "");
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
		currentStep: "product" | "material" | "other"
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
			const storeIdValue = store.storeId?.toString() || "";

			updateOrderRow(selectedRowForStore, "storeId", storeIdValue);
			updateOrderRow(selectedRowForStore, "storeName", store.storeName);
		}
		setIsStoreSearchOpen(false);
		setSelectedRowForStore("");
	};

	// 제조사 검색 모달 열기
	const openFactorySearch = (rowId: string) => {
		setSelectedRowForFactory(rowId);
		setIsFactoryModalOpen(true);
	};

	// 제조사 선택 처리
	const handleFactorySelect = (factory: FactorySearchDto) => {
		if (selectedRowForFactory) {
			updateOrderRow(
				selectedRowForFactory,
				"factoryId",
				factory.factoryId?.toString() || ""
			);
			updateOrderRow(selectedRowForFactory, "factoryName", factory.factoryName);
		}
		setIsFactoryModalOpen(false);
		setSelectedRowForFactory("");
	};

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
			updateOrderRow(selectedRowForProduct, "productId", product.productId);
			updateOrderRow(selectedRowForProduct, "productName", product.productName);
			updateOrderRow(
				selectedRowForProduct,
				"productImage",
				product.productImagePath || "/images/not_ready.png"
			);
			updateOrderRow(selectedRowForProduct, "factoryId", product.factoryId);
			updateOrderRow(selectedRowForProduct, "factoryName", product.factoryName);
			updateOrderRow(
				selectedRowForProduct,
				"mainPrice",
				product.productLaborCost
			);

			const mainStone = product.productStones.find((stone) => stone.mainStone);
			const mainStonePrice = mainStone
				? (mainStone.laborCost || 0) * (mainStone.stoneQuantity || 0)
				: 0;
			updateOrderRow(selectedRowForProduct, "mainStonePrice", mainStonePrice);

			const assistanceStone = product.productStones.find(
				(stone) => !stone.mainStone
			);
			const assistanceStonePrice = mainStone
				? (assistanceStone?.laborCost || 0) *
				  (assistanceStone?.stoneQuantity || 0)
				: 0;
			updateOrderRow(
				selectedRowForProduct,
				"assistanceStonePrice",
				assistanceStonePrice
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
			updateOrderRow(
				selectedRowForProduct,
				"productWeight",
				parseFloat(product.productWeight) || 0
			);
		}
		setIsProductSearchOpen(false);
		setSelectedRowForProduct("");
	};

	// 초기 데이터 로드
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				setLoading(true);

				// 기본 드롭다운 데이터만 로드
				const [materialRes, colorRes, priorityRes] = await Promise.all([
					materialApi.getMaterials(),
					colorApi.getColors(),
					priorityApi.getPriorities(),
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
				if (priorityRes.success) {
					const priorities = (priorityRes.data || []).map((p) => ({
						priorityName: p.priorityName,
						priorityDate: p.priorityDate,
					}));
					setPriorities(priorities);
				}

				// 기본 priority 값 (서버에서 받아온 첫 번째 데이터 사용)
				const defaultPriority =
					priorityRes.data && priorityRes.data[0]
						? priorityRes.data[0]
						: { priorityName: "일반", priorityDate: 7 };
				const currentDate = new Date();
				const defaultDeliveryDate = new Date(currentDate);
				defaultDeliveryDate.setDate(
					currentDate.getDate() + defaultPriority.priorityDate
				);
				const formattedDefaultDate = defaultDeliveryDate
					.toISOString()
					.split("T")[0];

				// 초기 10개 행 생성
				const initialRows: OrderRowData[] = [];
				for (let i = 0; i < 10; i++) {
					const newRow: OrderRowData = {
						id: `${Date.now()}-${i}`,
						storeId: "",
						storeName: "",
						productId: "",
						productName: "",
						productImage: "",
						materialId: "",
						materialName: "",
						colorId: "",
						colorName: "",
						classificationId: "",
						classificationName: "",
						setType: "",
						factoryId: "",
						factoryName: "",
						productSize: "",
						productWeight: 0,
						stoneWeight: 0,
						productAddLaborCost: 0,
						isProductWeightSale: false,
						priorityName: defaultPriority.priorityName,
						mainStoneNote: "",
						assistanceStoneNote: "",
						orderNote: "",
						stoneInfos: [],
						mainPrice: 0, // 중심단가
						additionalPrice: 0, // 추가단가
						mainStonePrice: 0,
						assistanceStonePrice: 0,
						mainStoneCount: 0,
						assistanceStoneCount: 0,
						additionalStonePrice: 0, // 추가 스톤 판매단가
						stoneWeightTotal: 0,
						deliveryDate: formattedDefaultDate,
						// 보조석 관련 필드
						assistanceStoneType: "없음",
						assistanceStoneArrival: "N",
						assistanceStoneArrivalDate: "",
					};
					initialRows.push(newRow);
				}
				setOrderRows(initialRows);
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

			// 유효한 주문 행만 API 요청으로 처리
			const promises = validRows.map((row) => {
				const orderData: OrderCreateRequest = {
					storeId: row.storeId,
					orderNote: row.orderNote,
					factoryId: row.factoryId,
					productId: row.productId,
					productSize: row.productSize,
					productAddLaborCost: row.productAddLaborCost,
					isProductWeightSale: row.isProductWeightSale,
					productWeight: row.productWeight,
					stoneWeight: row.stoneWeight,
					materialId: row.materialId,
					classificationId: row.classificationId,
					colorId: row.colorId,
					setType: row.setType,
					priorityName: row.priorityName,
					mainStoneNote: row.mainStoneNote,
					assistanceStoneNote: row.assistanceStoneNote,
					productStatus: "접수",
					createAt: new Date().toISOString(),
					stoneInfos: row.stoneInfos,
				};
				return orderApi.createOrder(orderData);
			});

			await Promise.all(promises);

			alert(`${validRows.length}개의 주문이 성공적으로 등록되었습니다.`);
			navigate("/orders");
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
			navigate("/orders");
		}
	};

	if (loading && orderRows.length === 0) {
		return (
			<div className="order-create-page">
				<div className="loading-container">
					<div className="spinner"></div>
					<p>데이터를 불러오는 중...</p>
				</div>
			</div>
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
			<div className="product-info-section">
				<h2>선택된 상품 정보</h2>
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
													.gradePolicyDtos &&
												currentProductDetail.productWorkGradePolicyGroupDto[0]
													.gradePolicyDtos.length > 0
													? currentProductDetail.productWorkGradePolicyGroupDto[0].gradePolicyDtos[0].laborCost.toLocaleString() +
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

			{/* 과거 거래내역 섹션 */}
			<div className="order-history-section">
				<h2>과거 거래내역</h2>
				<div className="order-history-table-container">
					<table className="order-history-table">
						<thead>
							<tr>
								<th className="col-no">No</th>
								<th className="col-date">거래일</th>
								<th className="col-model">모델번호</th>
								<th className="col-material">재질</th>
								<th className="col-color">색상</th>
								<th colSpan={2}>알 메모</th>
								<th className="col-size">사이즈</th>
								<th className="col-etc">기타</th>
								<th className="col-gold-weight">금중량</th>
								<th className="col-stone-weight">알중량</th>
								<th colSpan={2}>상품 단가</th>
								<th colSpan={3}>알 단가</th>
								<th colSpan={2}>알 수량</th>
								<th colSpan={3}>보조석</th>
								<th className="col-total-fee">공임합</th>
							</tr>
							<tr>
								<th className="col-no"></th>
								<th className="col-date"></th>
								<th className="col-model"></th>
								<th className="col-material"></th>
								<th className="col-color"></th>
								<th className="col-stone-memo-main">메인</th>
								<th className="col-stone-memo-sub">보조</th>
								<th className="col-size"></th>
								<th className="col-etc"></th>
								<th className="col-gold-weight"></th>
								<th className="col-stone-weight"></th>
								<th className="col-price-base">기본</th>
								<th className="col-price-add">추가</th>
								<th className="col-stone-price-main">메인</th>
								<th className="col-stone-price-sub">보조</th>
								<th className="col-stone-price-add">추가</th>
								<th className="col-stone-qty-main">메인</th>
								<th className="col-stone-qty-sub">보조</th>
								<th className="col-side-stone-type">유형</th>
								<th className="col-side-stone-status">입고여부</th>
								<th className="col-side-stone-date">입고날짜</th>
								<th className="col-total-fee"></th>
							</tr>
						</thead>
						<tbody>
							{/* 최대 4개 행 표시 */}
							{[...Array(4)].map((_, index) => {
								const pastOrder = currentDisplayedPastOrders[index];
								const totalFee = pastOrder
									? pastOrder.productLaborCost +
									  pastOrder.productAddLaborCost +
									  pastOrder.mainStoneLaborCost * pastOrder.mainStoneQuantity +
									  pastOrder.assistanceStoneLaborCost *
											pastOrder.assistanceStoneQuantity +
									  pastOrder.addStoneLaborCost
									: 0;

								return (
									<tr key={index}>
										<td>{index + 1}</td>
										<td>
											{pastOrder
												? new Date(pastOrder.saleCreateAt)
														.toLocaleDateString("ko-KR")
														.slice(0, 11)
												: ""}
										</td>
										<td>{pastOrder?.productName || ""}</td>
										<td>{pastOrder?.productMaterial || ""}</td>
										<td>{pastOrder?.productColor || ""}</td>
										<td>{pastOrder?.stockMainStoneNote || ""}</td>
										<td>{pastOrder?.stockAssistanceStoneNote || ""}</td>
										<td>{pastOrder?.productSize || ""}</td>
										<td>{pastOrder?.stockNote || ""}</td>
										<td>{pastOrder ? pastOrder.goldWeight.toFixed(3) : ""}</td>
										<td>{pastOrder ? pastOrder.stoneWeight.toFixed(3) : ""}</td>
										<td>
											{pastOrder
												? pastOrder.productLaborCost.toLocaleString()
												: ""}
										</td>
										<td>
											{pastOrder
												? pastOrder.productAddLaborCost.toLocaleString()
												: ""}
										</td>
										<td>
											{pastOrder
												? pastOrder.mainStoneLaborCost.toLocaleString()
												: ""}
										</td>
										<td>
											{pastOrder
												? pastOrder.assistanceStoneLaborCost.toLocaleString()
												: ""}
										</td>
										<td>
											{pastOrder
												? pastOrder.addStoneLaborCost.toLocaleString()
												: ""}
										</td>
										<td>{pastOrder?.mainStoneQuantity || ""}</td>
										<td>{pastOrder?.assistanceStoneQuantity || ""}</td>
										<td>
											{pastOrder?.assistantStone
												? pastOrder.assistantStoneName
												: ""}
										</td>
										<td>
											{pastOrder?.assistantStone ? "Y" : pastOrder ? "N" : ""}
										</td>
										<td>
											{pastOrder?.assistantStoneCreateAt
												? new Date(pastOrder.assistantStoneCreateAt)
														.toLocaleDateString("ko-KR")
														.slice(0, 11)
												: ""}
										</td>
										<td>{pastOrder ? totalFee.toLocaleString() : ""}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>

			{/* 주문 테이블 */}
			<div className="order-table-container">
				<table className="order-create-table">
					<thead>
						<tr>
							<th>No</th>
							<th>삭제</th>
							<th>
								<span className="required-field-basic">*</span>거래처
							</th>
							<th>
								<span className="required-field-basic">*</span>모델번호
							</th>
							<th>제조사</th>
							<th>
								<span className="required-field-basic">*</span>재질
							</th>
							<th>색상</th>
							<th colSpan={3}>보조석</th>
							<th colSpan={2}>상품 단가</th>
							<th colSpan={3}>알 단가</th>
							<th colSpan={2}>알 개수</th>
							<th>알중량</th>
							<th colSpan={2}>알 메모사항</th>
							<th>사이즈</th>
							<th>급</th>
							<th>기타</th>
							<th>출고일</th>
						</tr>
						<tr>
							<th></th>
							<th></th>
							<th></th>
							<th></th>
							<th></th>
							<th></th>
							<th></th>
							<th>유형</th>
							<th>입고여부</th>
							<th>입고날짜</th>
							<th>기본</th>
							<th>추가</th>
							<th>중심</th>
							<th>보조</th>
							<th>추가</th>
							<th>메인</th>
							<th>보조</th>
							<th></th>
							<th>메인</th>
							<th>보조</th>
							<th></th>
							<th></th>
							<th></th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{orderRows.map((row, index) => (
							<tr key={row.id}>
								<td>{index + 1}</td>
								<td>
									<button
										className="btn-delete-row"
										onClick={() => resetOrderRow(row.id)}
										disabled={loading}
									>
										🗑️
									</button>
								</td>
								<td>
									<div className="search-field-container">
										<input
											type="text"
											value={row.storeName}
											readOnly
											placeholder="거래처"
											disabled={!isRowInputEnabled(index)}
											onClick={() => {
												if (isRowInputEnabled(index)) {
													if (!row.storeName) {
														handleRequiredFieldClick(row.id, "store");
													}
												} else {
													alert(
														"바로 위 행의 필수값(거래처, 모델번호, 재질)을 먼저 입력해주세요."
													);
												}
											}}
											onFocus={() => {
												if (isRowInputEnabled(index)) {
													handleRowFocus(row.id);
													if (!row.storeName) {
														handleRequiredFieldClick(row.id, "store");
													}
												}
											}}
										/>
										<span
											className="search-icon"
											onClick={() => {
												if (isRowInputEnabled(index)) {
													openStoreSearch(row.id);
												} else {
													alert("이전 주문장을 완성해 주세요.");
												}
											}}
											style={{
												opacity: !isRowInputEnabled(index) ? 0.5 : 1,
												cursor: !isRowInputEnabled(index)
													? "not-allowed"
													: "pointer",
											}}
										>
											🔍
										</span>
									</div>
								</td>
								<td>
									<div className="search-field-container">
										<input
											type="text"
											value={row.productName}
											readOnly
											placeholder="모델번호"
											disabled={!isRowInputEnabled(index)}
											onClick={() => {
												if (isRowInputEnabled(index)) {
													// 값이 없으면 자동 복사
													if (!row.productName) {
														handleRequiredFieldClick(row.id, "product");
													}
												} else {
													alert("이전 주문장을 완성해 주세요.");
												}
											}}
											onFocus={() => {
												if (isRowInputEnabled(index)) {
													handleRowFocus(row.id);
													// 값이 없으면 자동 복사
													if (!row.productName) {
														handleRequiredFieldClick(row.id, "product");
													}
												}
											}}
										/>
										<span
											className="search-icon"
											onClick={() => {
												if (isRowInputEnabled(index)) {
													openProductSearch(row.id);
												} else {
													alert("이전 주문장을 완성해 주세요.");
												}
											}}
											style={{
												opacity: !isRowInputEnabled(index) ? 0.5 : 1,
												cursor: !isRowInputEnabled(index)
													? "not-allowed"
													: "pointer",
											}}
										>
											🔍
										</span>
									</div>
								</td>
								<td>
									<div className="search-field-container">
										<input
											type="text"
											value={row.factoryName}
											readOnly
											placeholder="제조사"
										/>
										<span
											className="search-icon"
											onClick={() => {
												if (isRowInputEnabled(index)) {
													openFactorySearch(row.id);
												} else {
													alert("이전 주문장을 완성해 주세요.");
												}
											}}
											style={{
												opacity: !isRowInputEnabled(index) ? 0.5 : 1,
												cursor: !isRowInputEnabled(index)
													? "not-allowed"
													: "pointer",
											}}
										>
											🔍
										</span>
									</div>
								</td>
								<td>
									<select
										value={row.materialId}
										onChange={(e) => {
											if (!validateSequence(row.id, "material")) {
												return;
											}
											const selectedMaterial = materials.find(
												(m) => m.materialId === e.target.value
											);
											updateOrderRow(row.id, "materialId", e.target.value);
											updateOrderRow(
												row.id,
												"materialName",
												selectedMaterial?.materialName || ""
											);
										}}
										disabled={loading || !isRowInputEnabled(index)}
										data-row-id={row.id}
										data-field="material"
										onClick={() => {
											if (isRowInputEnabled(index) && !row.materialId) {
												handleRequiredFieldClick(row.id, "material");
											} else if (!isRowInputEnabled(index)) {
												alert("이전 주문장을 완성해 주세요.");
											}
										}}
										onFocus={() => {
											if (isRowInputEnabled(index)) {
												handleRowFocus(row.id);
												if (!row.materialId) {
													handleRequiredFieldClick(row.id, "material");
												}
											}
										}}
										style={{
											opacity: !isRowInputEnabled(index) ? 0.5 : 1,
											cursor: !isRowInputEnabled(index)
												? "not-allowed"
												: "pointer",
										}}
									>
										<option value="">선택</option>
										{materials.map((material) => (
											<option
												key={material.materialId}
												value={material.materialId}
											>
												{material.materialName}
											</option>
										))}
									</select>
								</td>
								<td>
									<select
										value={row.colorId}
										onChange={(e) => {
											if (!validateSequence(row.id, "other")) {
												return;
											}
											const selectedColor = colors.find(
												(c) => c.colorId === e.target.value
											);
											updateOrderRow(row.id, "colorId", e.target.value);
											updateOrderRow(
												row.id,
												"colorName",
												selectedColor?.colorName || ""
											);
										}}
										disabled={loading || !isRowInputEnabled(index)}
										onFocus={() => {
											if (isRowInputEnabled(index)) {
												handleRowFocus(row.id);
											}
										}}
										style={{
											opacity: !isRowInputEnabled(index) ? 0.5 : 1,
											cursor: !isRowInputEnabled(index)
												? "not-allowed"
												: "pointer",
										}}
									>
										<option value="">선택</option>
										{colors.map((color) => (
											<option key={color.colorId} value={color.colorId}>
												{color.colorName}
											</option>
										))}
									</select>
								</td>
								{/* 보조석 필드들 */}
								<td>
									<select
										value={row.assistanceStoneType}
										onChange={(e) =>
											updateOrderRow(
												row.id,
												"assistanceStoneType",
												e.target.value
											)
										}
										disabled={loading || !isRowInputEnabled(index)}
										style={{
											opacity: !isRowInputEnabled(index) ? 0.5 : 1,
										}}
									>
										<option value="없음">없음</option>
										<option value="랩">랩</option>
										<option value="천연">천연</option>
										<option value="모이사">모이사</option>
										<option value="유색석">유색석</option>
									</select>
								</td>
								<td>
									<select
										value={row.assistanceStoneArrival}
										onChange={(e) =>
											handleAssistanceStoneArrivalChange(row.id, e.target.value)
										}
										disabled={loading || !isRowInputEnabled(index)}
										className={`arrival-status ${
											row.assistanceStoneArrival === "Y" ? "arrived" : ""
										}`}
										style={{
											opacity: !isRowInputEnabled(index) ? 0.5 : 1,
										}}
									>
										<option value="N">N</option>
										<option value="Y">Y</option>
									</select>
								</td>
								<td>
									<input
										type="date"
										value={row.assistanceStoneArrivalDate}
										onChange={(e) =>
											updateOrderRow(
												row.id,
												"assistanceStoneArrivalDate",
												e.target.value
											)
										}
										disabled={loading || row.assistanceStoneArrival === "N"}
										style={{
											backgroundColor:
												row.assistanceStoneArrival === "N"
													? "#f5f5f5"
													: "white",
										}}
									/>
								</td>
								<td>
									<input
										type="text"
										value={row.mainPrice.toLocaleString()}
										readOnly
										disabled={loading}
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								<td>
									<input
										type="number"
										value={row.additionalPrice}
										onChange={(e) =>
											updateOrderRow(
												row.id,
												"additionalPrice",
												parseInt(e.target.value)
											)
										}
										disabled={loading || !isRowInputEnabled(index)}
										placeholder="0"
										style={{
											opacity: !isRowInputEnabled(index) ? 0.5 : 1,
										}}
									/>
								</td>
								<td>
									<input
										type="text"
										value={row.mainStonePrice.toLocaleString()}
										readOnly
										disabled={loading}
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								<td>
									<input
										type="text"
										value={row.assistanceStonePrice.toLocaleString()}
										readOnly
										disabled={loading}
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								<td>
									<input
										type="number"
										value={row.additionalStonePrice}
										onChange={(e) =>
											updateOrderRow(
												row.id,
												"additionalStonePrice",
												parseInt(e.target.value) || 0
											)
										}
										disabled={loading || !isRowInputEnabled(index)}
										placeholder="추가단가"
										style={{
											opacity: !isRowInputEnabled(index) ? 0.5 : 1,
										}}
									/>
								</td>
								<td>
									<input
										type="number"
										value={row.mainStoneCount}
										readOnly
										disabled={loading}
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								<td>
									<input
										type="number"
										value={row.assistanceStoneCount}
										readOnly
										disabled={loading}
										style={{ backgroundColor: "#f5f5f5" }}
									/>
								</td>
								<td>
									<input
										type="number"
										step="0.01"
										value={row.stoneWeightTotal}
										onChange={(e) =>
											updateOrderRow(
												row.id,
												"stoneWeightTotal",
												parseFloat(e.target.value) || 0
											)
										}
										disabled={loading}
									/>
								</td>
								<td>
									<input
										type="text"
										value={row.mainStoneNote}
										onChange={(e) =>
											updateOrderRow(row.id, "mainStoneNote", e.target.value)
										}
										onFocus={() => handleRowFocus(row.id)}
										disabled={loading}
									/>
								</td>
								<td>
									<input
										type="text"
										value={row.assistanceStoneNote}
										onChange={(e) =>
											updateOrderRow(
												row.id,
												"assistanceStoneNote",
												e.target.value
											)
										}
										onFocus={() => handleRowFocus(row.id)}
										disabled={loading}
									/>
								</td>
								<td>
									<input
										type="text"
										value={row.productSize}
										onChange={(e) =>
											updateOrderRow(row.id, "productSize", e.target.value)
										}
										onFocus={() => handleRowFocus(row.id)}
										disabled={loading}
										placeholder="호"
									/>
								</td>
								<td>
									<select
										value={row.priorityName}
										onChange={(e) => {
											if (!validateSequence(row.id, "other")) {
												return;
											}
											const selectedPriority = priorities.find(
												(p) => p.priorityName === e.target.value
											);
											updateOrderRow(row.id, "priorityName", e.target.value);

											// priorityDate만큼 현재 날짜에 더해서 출고일 설정
											if (selectedPriority && selectedPriority.priorityDate) {
												const currentDate = new Date();
												const deliveryDate = new Date(currentDate);
												deliveryDate.setDate(
													currentDate.getDate() + selectedPriority.priorityDate
												);
												const formattedDate = deliveryDate
													.toISOString()
													.split("T")[0];
												updateOrderRow(row.id, "deliveryDate", formattedDate);
											}
										}}
										disabled={loading || !isRowInputEnabled(index)}
										style={{
											opacity: !isRowInputEnabled(index) ? 0.5 : 1,
											cursor: !isRowInputEnabled(index)
												? "not-allowed"
												: "pointer",
										}}
									>
										<option value="">선택</option>
										{priorities.map((priority) => (
											<option
												key={priority.priorityName}
												value={priority.priorityName}
											>
												{priority.priorityName}
											</option>
										))}
									</select>
								</td>
								<td>
									<input
										type="text"
										value={row.orderNote}
										onChange={(e) =>
											updateOrderRow(row.id, "orderNote", e.target.value)
										}
										disabled={loading}
									/>
								</td>
								<td>
									<input
										type="date"
										value={row.deliveryDate}
										onChange={(e) =>
											updateOrderRow(row.id, "deliveryDate", e.target.value)
										}
										disabled={loading}
									/>
								</td>
							</tr>
						))}
						{/* 추가 버튼 행 */}
						<tr>
							<td>{orderRows.length + 1}</td>
							<td>
								<button
									className="btn-add-row"
									onClick={addOrderRow}
									disabled={loading}
								>
									+
								</button>
							</td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
						</tr>
					</tbody>
				</table>
			</div>

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

			{/* 검색 모달들 */}
			<StoreSearch
				isOpen={isStoreSearchOpen}
				onClose={() => {
					setIsStoreSearchOpen(false);
					setSelectedRowForStore("");
				}}
				onSelectStore={handleStoreSelect}
			/>

			<FactorySearch
				isOpen={isFactoryModalOpen}
				onClose={() => setIsFactoryModalOpen(false)}
				onSelectFactory={handleFactorySelect}
			/>

			<ProductSearch
				isOpen={isProductSearchOpen}
				onClose={() => setIsProductSearchOpen(false)}
				onSelectProduct={handleProductSelect}
			/>
		</div>
	);
};

export default OrderCreatePage;
