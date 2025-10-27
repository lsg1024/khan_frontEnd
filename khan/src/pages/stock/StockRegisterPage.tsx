import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { stockApi } from "../../../libs/api/stock";
import { saleApi } from "../../../libs/api/sale";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { goldHarryApi } from "../../../libs/api/goldHarry";
import { storeApi } from "../../../libs/api/store";
import { useErrorHandler } from "../../utils/errorHandler";
import { getLocalDate } from "../../utils/dateUtils";
import type {
	StockOrderRows,
	StockRegisterRequest,
	StockRegisterResponse,
} from "../../types/stock";
import StoreSearch from "../../components/common/store/StoreSearch";
import FactorySearch from "../../components/common/factory/FactorySearch";
import ProductSearch from "../../components/common/product/ProductSearch";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto } from "../../types/store";
import type { ProductDto } from "../../types/product";
import StockTable from "../../components/common/stock/StockTable";
import { calculateStoneDetails } from "../../utils/calculateStone";

const POPUP_ORIGIN = window.location.origin;

const convertToStockOrderRowData = (
	response: StockRegisterResponse,
	grade: string,
	materials: { materialId: string; materialName: string }[],
	colors: { colorId: string; colorName: string }[],
	assistantStones: { assistantStoneId: string; assistantStoneName: string }[]
): StockOrderRows => {
	const calculatedStoneData = calculateStoneDetails(response.stoneInfos);

	const foundMaterial = materials.find(
		(m) => m.materialName === response.materialName
	);
	const foundColor = colors.find((c) => c.colorName === response.colorName);
	const foundAssistantStone = assistantStones.find(
		(a) => a.assistantStoneName === response.assistantStoneName
	);

	const stockRow: StockOrderRows = {
		createAt: response.createAt,
		shippingAt: response.shippingAt,
		id: response.flowCode,
		storeId: response.storeId,
		storeName: response.storeName,
		grade: grade,
		productId: response.productId,
		productName: response.productName,
		productPurchaseCost: response.productPurchaseCost || 0,
		materialId: foundMaterial?.materialId || "",
		materialName: response.materialName,
		colorId: foundColor?.colorId || "",
		colorName: response.colorName,
		factoryId: response.factoryId,
		factoryName: response.factoryName,
		productSize: response.productSize,
		goldWeight: response.goldWeight,
		stoneWeight: response.stoneWeight,
		isProductWeightSale: false,
		mainStoneNote: response.mainStoneNote,
		assistanceStoneNote: response.assistanceStoneNote,
		orderNote: response.orderNote,
		stoneInfos: response.stoneInfos || [],
		productLaborCost: response.productLaborCost || 0,
		productAddLaborCost: response.productAddLaborCost || 0,
		mainStonePrice: calculatedStoneData.mainStonePrice,
		assistanceStonePrice: calculatedStoneData.assistanceStonePrice,
		mainStoneCount: calculatedStoneData.mainStoneCount,
		assistanceStoneCount: calculatedStoneData.assistanceStoneCount,
		// 서버에서 받은 stoneAddLaborCost 값 사용 (undefined이면 0)
		stoneAddLaborCost: response.stoneAddLaborCost || 0,
		stoneWeightTotal: calculatedStoneData.stoneWeight, // 계산된 알중량 합계
		// 보조석 관련 필드
		assistantStone: response.assistantStone || false,
		assistantStoneId: foundAssistantStone?.assistantStoneId || "",
		assistantStoneName: response.assistantStoneName || "",
		assistantStoneCreateAt: response.assistantStoneCreateAt || "",
		totalWeight: (
			Number(response.goldWeight) + Number(response.stoneWeight)
		).toFixed(3) as unknown as number,
		storeHarry: response.storeHarry,
		classificationId: response.classificationId,
		classificationName: response.classificationName,
		setTypeId: response.setTypeId,
		setTypeName: response.setTypeName,
	};

	return stockRow;
};

const StockRegisterPage: React.FC = () => {
	const [searchParams] = useSearchParams();
	const { handleError } = useErrorHandler();

	// 1. 상태: 단일 객체/값에서 배열 또는 Map 형태로 변경
	const [stockRows, setOrderRows] = useState<StockOrderRows[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	// 드롭다운 데이터 (한 번만 로드하면 됨)
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

	const [isStoreSearchOpen, setIsStoreSearchOpen] = useState(false);
	const [selectedRowForStore, setSelectedRowForStore] = useState<string>("");
	const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);
	const [selectedRowForFactory, setSelectedRowForFactory] =
		useState<string>("");
	const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
	const [selectedRowForProduct, setSelectedRowForProduct] =
		useState<string>("");

	const currentDate = getLocalDate();

	// 검색 컴포넌트 핸들러들
	const openStoreSearch = (rowId: string) => {
		setSelectedRowForStore(rowId);
		setIsStoreSearchOpen(true);
	};

	const openProductSearch = (rowId: string) => {
		setSelectedRowForProduct(rowId);
		setIsProductSearchOpen(true);
	};

	const openFactorySearch = (rowId: string) => {
		setSelectedRowForFactory(rowId);
		setIsFactoryModalOpen(true);
	};

	// 검색 결과 선택 핸들러들
	const handleStoreSelect = async (store: StoreSearchDto) => {
		if (selectedRowForStore) {
			if (store.storeId === undefined || store.storeId === null) {
				alert("거래처 ID가 누락되었습니다. 다른 거래처를 선택해주세요.");
				return;
			}

			onRowUpdate(selectedRowForStore, "storeId", store.storeId.toString());
			onRowUpdate(selectedRowForStore, "storeName", store.storeName || "");

			try {
				const gradeResponse = await storeApi.getStoreGrade(
					store.storeId.toString()
				);
				if (gradeResponse.success && gradeResponse.data) {
					// 3. 조회된 등급으로 해당 row의 grade 필드를 업데이트
					onRowUpdate(selectedRowForStore, "grade", gradeResponse.data);
				}
			} catch (err) {
				handleError(err, setError);
				alert("거래처 등급을 불러오는 데 실패했습니다.");
				onRowUpdate(selectedRowForStore, "grade", ""); // 실패 시 등급 초기화
			}
		}
		setIsStoreSearchOpen(false);
		setSelectedRowForStore("");
	};

	// 거래처 검색 팝업 닫기 핸들러
	const handleStoreSearchClose = useCallback(() => {
		setIsStoreSearchOpen(false);
		setSelectedRowForStore("");
	}, []);

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
			onRowUpdate(selectedRowForProduct, "productId", productIdValue);
			onRowUpdate(
				selectedRowForProduct,
				"productName",
				product.productName || ""
			);
			onRowUpdate(selectedRowForProduct, "factoryId", factoryIdValue);
			onRowUpdate(
				selectedRowForProduct,
				"factoryName",
				product.factoryName || ""
			);

			onRowUpdate(
				selectedRowForProduct,
				"productPurchaseCost",
				product.productPurchaseCost || 0
			);
			onRowUpdate(
				selectedRowForProduct,
				"productLaborCost",
				product.productLaborCost || 0
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

	const handleFactorySelect = (factory: FactorySearchDto) => {
		if (selectedRowForFactory) {
			if (factory.factoryId === undefined || factory.factoryId === null) {
				alert("제조사 ID가 누락되었습니다. 다른 제조사를 선택해주세요.");
				return;
			}

			const factoryIdValue = factory.factoryId.toString();
			onRowUpdate(selectedRowForFactory, "factoryId", factoryIdValue);
			onRowUpdate(
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

	// 스톤 정보 관리 팝업 열기
	const openStoneInfoManager = (rowId: string) => {
		const url = `/orders/stone-info?rowId=${rowId}&origin=${POPUP_ORIGIN}`;
		const NAME = `stoneInfo_${rowId}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1200,height=400";
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
					// 스톤 정보 업데이트
					onRowUpdate(rowId, "stoneInfos", event.data.stoneInfos);

					// 스톤 정보 변경 시 알 단가 자동 계산
					const calculatedStoneData = calculateStoneDetails(
						event.data.stoneInfos
					);
					onRowUpdate(
						rowId,
						"mainStonePrice",
						calculatedStoneData.mainStonePrice
					);
					onRowUpdate(
						rowId,
						"assistanceStonePrice",
						calculatedStoneData.assistanceStonePrice
					);
					onRowUpdate(
						rowId,
						"stoneAddLaborCost",
						calculatedStoneData.stoneAddLaborCost
					);
					onRowUpdate(
						rowId,
						"mainStoneCount",
						calculatedStoneData.mainStoneCount
					);
					onRowUpdate(
						rowId,
						"assistanceStoneCount",
						calculatedStoneData.assistanceStoneCount
					);

					// stoneWeightTotal 업데이트 (UI 표시용)
					onRowUpdate(
						rowId,
						"stoneWeightTotal",
						calculatedStoneData.stoneWeight
					);

					// stoneWeight와 goldWeight 자동 계산
					const row = stockRows.find((r) => r.id === rowId);
					if (row) {
						const totalWeight = Number(row.totalWeight || 0);
						const newStoneWeightTotal = calculatedStoneData.stoneWeight;

						// goldWeight = 총중량 - 알중량
						const calculatedGoldWeight = totalWeight - newStoneWeightTotal;

						// goldWeight 업데이트 (총중량 - 알중량)
						onRowUpdate(rowId, "goldWeight", calculatedGoldWeight.toFixed(3));
						// stoneWeight 업데이트 (알중량 기준)
						onRowUpdate(rowId, "stoneWeight", newStoneWeightTotal.toFixed(3));
					}
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

	useEffect(() => {
		const idsParam = searchParams.get("ids");
		if (!idsParam) {
			setError("재고등록할 주문 ID가 전달되지 않았습니다.");
			setLoading(false);
			return;
		}
		const ids = idsParam.split(",");

		const loadAllData = async () => {
			try {
				const [
					materialRes,
					colorRes,
					assistantStoneRes,
					goldHarryRes,
					stockOrdersRes,
				] = await Promise.all([
					materialApi.getMaterials(),
					colorApi.getColors(),
					assistantStoneApi.getAssistantStones(),
					goldHarryApi.getGoldHarry(),
					stockApi.getStockDetail(ids),
				]);

				const loadedMaterials = materialRes.success
					? (materialRes.data || []).map((m) => ({
							materialId: m.materialId?.toString() || "",
							materialName: m.materialName,
					  }))
					: [];
				const loadedColors = colorRes.success
					? (colorRes.data || []).map((c) => ({
							colorId: c.colorId?.toString() || "",
							colorName: c.colorName,
					  }))
					: [];
				const loadedAssistantStones = assistantStoneRes.success
					? (assistantStoneRes.data || []).map((a) => ({
							assistantStoneId: a.assistantStoneId?.toString() || "",
							assistantStoneName: a.assistantStoneName,
					  }))
					: [];
				const loadedGoldHarries = goldHarryRes.success
					? (goldHarryRes.data || []).map((h) => ({
							goldHarryId: h.goldHarryId?.toString() || "",
							goldHarry: h.goldHarry, // goldHarryName이 아니라 goldHarry
					  }))
					: [];

				setMaterials(loadedMaterials);
				setColors(loadedColors);
				setAssistantStones(loadedAssistantStones);
				setGoldHarries(loadedGoldHarries);
				if (stockOrdersRes.success && stockOrdersRes.data) {
					const stockResponses = stockOrdersRes.data;

					const gradePromises = stockResponses.map((res) =>
						storeApi.getStoreGrade(res.storeId)
					);
					const gradeResults = await Promise.all(gradePromises);
					const grades = gradeResults.map((res) => res.data);

					const allRows = stockResponses.map((response, index) =>
						convertToStockOrderRowData(
							response,
							grades[index] ?? "1",
							loadedMaterials,
							loadedColors,
							loadedAssistantStones
						)
					);

					console.log("변환된 stockRows:", allRows);
					console.log("첫 번째 row의 storeHarry:", allRows[0]?.storeHarry);

					setOrderRows(allRows);
				}
			} catch (err) {
				handleError(err, setError);
			} finally {
				setLoading(false);
			}
		};

		loadAllData();
	}, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

	const onRowUpdate = (
		id: string,
		field: keyof StockOrderRows,
		value: unknown
	) => {
		setOrderRows((prevRows) =>
			prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
		);
	};

	const handleSave = async () => {
		if (stockRows.length === 0) {
			alert("저장할 정보가 없습니다.");
			return;
		}

		// type 파라미터에 따라 메시지와 API 호출 구분
		const typeParam = searchParams.get("type");
		const isStockRegister = typeParam === "STOCK";
		const actionText = isStockRegister ? "재고 등록" : "판매 등록";
		const apiStatus = isStockRegister ? "STOCK" : "SALES";

		if (
			!window.confirm(
				`총 ${stockRows.length}개의 주문을 일괄 ${actionText}하시겠습니까?`
			)
		) {
			return;
		}

		setLoading(true);
		try {
			const savePromises = stockRows.map((row) => {
				const stockDto: StockRegisterRequest = {
					createAt: row.createAt,
					flowCode: row.id,
					materialId: row.materialId,
					materialName: row.materialName,
					colorId: row.colorId,
					colorName: row.colorName,
					productSize: row.productSize,
					isProductWeightSale: row.isProductWeightSale,
					productPurchaseCost: row.productPurchaseCost || 0,
					productLaborCost: row.productLaborCost || 0,
					productAddLaborCost: row.productAddLaborCost || 0,
					storeHarry: row.storeHarry,
					goldWeight: row.goldWeight || "0",
					stoneWeight: row.stoneWeight || "0",
					orderNote: row.orderNote || "",
					mainStoneNote: row.mainStoneNote || "",
					assistanceStoneNote: row.assistanceStoneNote || "",
					// 보조석 관련 필드
					assistantStoneId: row.assistantStoneId || "1",
					assistantStone: row.assistantStone || false,
					assistantStoneName: row.assistantStoneName || "",
					assistantStoneCreateAt: row.assistantStoneCreateAt || "",
					stoneInfos: row.stoneInfos || [],
					stoneAddLaborCost: row.stoneAddLaborCost || 0,
				};

				// type에 따라 다른 API 호출
				if (isStockRegister) {
					return stockApi.updateStockRegister(row.id, apiStatus, stockDto);
				} else {
					// 판매 등록은 saleApi 사용
					return saleApi.updateSaleRegister(row.id, apiStatus, stockDto);
				}
			});

			await Promise.all(savePromises);

			// 자식 창에서 alert 표시 (주문 생성과 동일한 방식)
			alert(
				`총 ${stockRows.length}개의 주문이 성공적으로 ${actionText}되었습니다.`
			);

			// 부모 창으로 메시지 전송 (새로고침용)
			if (window.opener) {
				const messageType = isStockRegister
					? "STOCK_REGISTERED"
					: "SALES_REGISTERED";
				window.opener.postMessage(
					{ type: messageType },
					window.location.origin
				);
			}

			// alert 확인 후 창 닫기
			window.close();
		} catch (err) {
			handleError(err, setError);
			alert(`일괄 ${actionText}에 실패했습니다.`);
		} finally {
			setLoading(false);
		}
	};

	if (loading || error) {
		return (
			<div className="loading-container">
				<div className="spinner"></div>
				<p>주문 정보를 불러오는 중...</p>
			</div>
		);
	}

	const handleAssistanceStoneArrivalChange = (id: string, value: string) => {
		if (value === "Y") {
			// Y로 변경 시 현재 날짜를 자동 설정
			onRowUpdate(id, "assistantStone", true);
			onRowUpdate(id, "assistantStoneCreateAt", currentDate);
		} else {
			// N으로 변경 시 날짜 초기화
			onRowUpdate(id, "assistantStone", false);
			onRowUpdate(id, "assistantStoneCreateAt", "");
		}
	};

	// type에 따른 제목과 버튼 텍스트 결정
	const typeParam = searchParams.get("type");
	const isStockRegister = typeParam === "STOCK";
	const pageTitle = isStockRegister ? "일괄 재고 등록" : "일괄 판매 등록";
	const buttonText = isStockRegister ? "재고 등록" : "판매 등록";

	return (
		<div className="order-update-page">
			<div className="page-header">
				<h3>{pageTitle}</h3>
				<p>총 {stockRows.length}개의 주문을 등록합니다.</p>
			</div>
			<div className="bulk-order-item">
				<StockTable
					mode="update"
					stockRows={stockRows}
					loading={loading}
					materials={materials}
					colors={colors}
					assistantStones={assistantStones}
					goldHarries={goldHarries}
					onRowUpdate={onRowUpdate}
					onAssistanceStoneArrivalChange={handleAssistanceStoneArrivalChange}
					onStoneInfoOpen={openStoneInfoManager}
					onStoreSearchOpen={openStoreSearch}
					onProductSearchOpen={openProductSearch}
					onFactorySearchOpen={openFactorySearch}
				/>
			</div>

			{/* 저장/취소 버튼 */}
			<div className="detail-button-group">
				<button
					className="btn-cancel"
					onClick={() => window.close()}
					disabled={loading}
				>
					취소
				</button>
				<button className="btn-submit" onClick={handleSave} disabled={loading}>
					{loading ? "저장 중..." : `전체 ${stockRows.length}개 ${buttonText}`}
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

export default StockRegisterPage;
