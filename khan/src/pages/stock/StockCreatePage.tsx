import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { stockApi } from "../../../libs/api/stock";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { productApi } from "../../../libs/api/product";
import { useErrorHandler } from "../../utils/errorHandler";
import { getLocalDate } from "../../utils/dateUtils";
import type { PastOrderDto } from "../../types/order";
import type { Product, ProductDto } from "../../types/product";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto } from "../../types/store";
import type { StockOrderRowData, StockCreateRequest } from "../../types/stock";
import StockTable from "../../components/common/stock/StockTable";
import StoreSearch from "../../components/common/store/StoreSearch";
import FactorySearch from "../../components/common/factory/FactorySearch";
import ProductSearch from "../../components/common/product/ProductSearch";
import PastOrderHistory from "../../components/common/PastOrderHistory";
import ProductInfoSection from "../../components/common/ProductInfoSection";
import { calculateStoneDetails } from "../../utils/calculateStone";
import "../../styles/pages/StockCreatePage.css";

export const StockCreatePage = () => {
	const { handleError } = useErrorHandler();

	// 재고 행 데이터
	const [stockRows, setStockRows] = useState<StockOrderRowData[]>([]);

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

	// 새 재고 행 추가
	const addStockRow = () => {
		const defaultAssistantStone =
			assistantStones.length > 0 ? assistantStones[0] : null;

		const newRow: StockOrderRowData = {
			id: Date.now().toString(),
			createAt: currentDate,
			storeId: "",
			storeName: "",
			grade: "1",
			productId: "",
			productName: "",
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
			productLaborCost: "",
			productAddLaborCost: "",
			mainStonePrice: "",
			assistanceStonePrice: "",
			mainStoneCount: "",
			assistanceStoneCount: "",
			additionalStonePrice: "",
			stoneWeightTotal: "",
			assistantStoneId:
				defaultAssistantStone?.assistantStoneId.toString() || "1",
			assistantStone: false,
			assistantStoneName: defaultAssistantStone?.assistantStoneName || "",
			assistantStoneCreateAt: "",
			totalWeight: 0,
			storeHarry: "",
		};
		setStockRows([...stockRows, newRow]);
	};

	// 재고 행 데이터 업데이트
	const updateStockRow = async (
		id: string,
		field: keyof StockOrderRowData,
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

	const handleProductSelect = (product: ProductDto) => {
		if (selectedRowForProduct) {
			const productIdValue = product.productId;
			const factoryIdValue = product.factoryId;

			updateStockRow(selectedRowForProduct, "productId", productIdValue);
			updateStockRow(
				selectedRowForProduct,
				"productName",
				product.productName || ""
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
		const FEATURES = "resizable=yes,scrollbars=yes,width=1200,height=800";

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
						"additionalStonePrice",
						calculatedStoneData.additionalStonePrice
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
						calculatedStoneData.stoneWeightTotal
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

	// 초기 데이터 로드
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				setLoading(true);

				const [materialRes, colorRes, assistantStoneRes] = await Promise.all([
					materialApi.getMaterials(),
					colorApi.getColors(),
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
						assistantStoneId: a.assistantStoneId.toString(),
						assistantStoneName: a.assistantStoneName,
					}));
					setAssistantStones(assistantStones);
				}

				// 초기 5개 행 생성
				const initialRowCount = 5;
				const initialRows: StockOrderRowData[] = [];
				for (let i = 0; i < initialRowCount; i++) {
					const defaultAssistantStone =
						assistantStones.length > 0 ? assistantStones[0] : null;

					const newRow: StockOrderRowData = {
						id: `${Date.now()}-${i}`,
						createAt: currentDate,
						storeId: "",
						storeName: "",
						grade: "1",
						productId: "",
						productName: "",
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
						productLaborCost: "",
						productAddLaborCost: "",
						mainStonePrice: "",
						assistanceStonePrice: "",
						mainStoneCount: "",
						assistanceStoneCount: "",
						additionalStonePrice: "",
						stoneWeightTotal: "",
						assistantStoneId:
							defaultAssistantStone?.assistantStoneId.toString() || "1",
						assistantStone: false,
						assistantStoneName: defaultAssistantStone?.assistantStoneName || "",
						assistantStoneCreateAt: "",
						totalWeight: 0,
						storeHarry: "",
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
				const stockData: StockCreateRequest = {
					storeId: row.storeId,
					storeName: row.storeName,
					storeGrade: row.grade,
					storeHarry: row.storeHarry,
					factoryId: row.factoryId,
					factoryName: row.factoryName,
					productId: row.productId,
					productName: row.productName,
					productFactoryName: "", // StockOrderRowData에서 가져올 수 있으면 추가
					productSize: row.productSize,
					stockNote: row.orderNote,
					isProductWeightSale: row.isProductWeightSale,
					productPurchaseCost: row.productPurchaseCost,
					productAddLaborCost: row.productAddLaborCost as number,
					materialId: row.materialId,
					materialName: row.materialName,
					colorId: row.colorId,
					colorName: row.colorName,
					classificationId: "", // 상품 정보에서 설정
					classificationName: "",
					setTypeId: "",
					setTypeName: "",
					goldWeight: parseFloat(row.goldWeight) || 0,
					stoneWeight: parseFloat(row.stoneWeight) || 0,
					mainStoneNote: row.mainStoneNote,
					assistanceStoneNote: row.assistanceStoneNote,
					assistantStone: row.assistantStone,
					assistantStoneId: row.assistantStoneId,
					assistantStoneCreateAt: row.assistantStoneCreateAt,
					stoneInfos: row.stoneInfos,
					stoneAddLaborCost: 0,
				};

				return stockApi.createStock("STOCK", stockData);
			});

			const responses = await Promise.all(promises);
			const successCount = responses.filter((res) => res.success).length;

			alert(`${successCount}개의 재고가 성공적으로 등록되었습니다.`);

			// 부모창에 메시지 전송 (필요한 경우)
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
				orderRows={stockRows}
				loading={loading}
				materials={materials}
				colors={colors}
				assistantStones={assistantStones}
				onRowUpdate={updateStockRow}
				onAssistanceStoneArrivalChange={handleAssistanceStoneArrivalChange}
				onStoneInfoOpen={openStoneInfoManager}
				onStoreSearch={openStoreSearch}
				onFactorySearch={openFactorySearch}
				onProductSearch={openProductSearch}
				onAddRow={addStockRow}
				onRowFocus={handleRowFocus}
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
