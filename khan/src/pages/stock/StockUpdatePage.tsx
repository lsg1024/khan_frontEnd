import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { stockApi } from "../../../libs/api/stock";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { goldHarryApi } from "../../../libs/api/goldHarry";
import { useErrorHandler } from "../../utils/errorHandler";
import { formatToLocalDate, getLocalDate } from "../../utils/dateUtils";
import { calculateStoneDetails } from "../../utils/calculateStone";
import { handleApiSubmit } from "../../utils/apiSubmitHandler";
import type { MaterialDto } from "../../types/material";
import type { ColorDto } from "../../types/color";
import type { AssistantStoneDto } from "../../types/AssistantStoneDto";
import type { goldHarryResponse as GoldHarryDto } from "../../types/goldHarry";
import type {
	ResponseDetail,
	StockOrderRows,
	StockUpdateRequest,
} from "../../types/stock";
import StockTable from "../../components/common/stock/StockTable";
import "../../styles/pages/stock/StockUpdatePage.css";

const StockUpdatePage: React.FC = () => {
	const { flowCode } = useParams<{ flowCode: string }>();
	const { handleError } = useErrorHandler();

	const [stockDetail, setStockDetail] = useState<ResponseDetail | null>(null);
	const [stockRows, setStockRows] = useState<StockOrderRows[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [flowCodes, setFlowCodes] = useState<string[]>([]);

	// 드롭다운 데이터
	const [materials, setMaterials] = useState<MaterialDto[]>([]);
	const [colors, setColors] = useState<ColorDto[]>([]);
	const [assistantStones, setAssistantStones] = useState<AssistantStoneDto[]>(
		[]
	);
	const [goldHarries, setGoldHarries] = useState<GoldHarryDto[]>([]);

	// 재고 행 업데이트
	const handleRowUpdate = (
		id: string,
		field: keyof StockOrderRows,
		value: unknown
	) => {
		setStockRows((prev) =>
			prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
		);
	};

	// 보조석 입고 여부 변경 핸들러
	const handleAssistanceStoneArrivalChange = (id: string, value: string) => {
		const currentDate = getLocalDate();
		if (value === "Y") {
			handleRowUpdate(id, "assistantStone", true);
			handleRowUpdate(id, "assistantStoneCreateAt", currentDate);
		} else {
			handleRowUpdate(id, "assistantStone", false);
			handleRowUpdate(id, "assistantStoneCreateAt", "");
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
					handleRowUpdate(rowId, "stoneInfos", event.data.stoneInfos);

					const calculatedStoneData = calculateStoneDetails(
						event.data.stoneInfos
					);
					handleRowUpdate(
						rowId,
						"mainStonePrice",
						calculatedStoneData.mainStonePrice
					);
					handleRowUpdate(
						rowId,
						"assistanceStonePrice",
						calculatedStoneData.assistanceStonePrice
					);
					handleRowUpdate(
						rowId,
						"mainStoneCount",
						calculatedStoneData.mainStoneCount
					);
					handleRowUpdate(
						rowId,
						"assistanceStoneCount",
						calculatedStoneData.assistanceStoneCount
					);
					handleRowUpdate(
						rowId,
						"stoneWeight",
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

	// 초기 데이터 로드
	useEffect(() => {
		const loadStockData = async () => {
			if (!flowCode) {
				setError("재고 코드가 없습니다.");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);

				// flowCode를 쉼표로 분리하여 배열로 변환
				const codes = flowCode.split(",").map((code) => code.trim());
				setFlowCodes(codes);

				// 드롭다운 데이터 로드
				const [materialRes, colorRes, assistantStoneRes, goldHarryRes] =
					await Promise.all([
						materialApi.getMaterials(),
						colorApi.getColors(),
						assistantStoneApi.getAssistantStones(),
						goldHarryApi.getGoldHarry(),
					]);

				// 드롭다운 데이터 설정
				let materialsData: MaterialDto[] = [];
				let colorsData: ColorDto[] = [];
				let loadedGoldHarries: GoldHarryDto[] = [];

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

				if (assistantStoneRes.success) {
					const assistantStonesData = (assistantStoneRes.data || []).map(
						(a) => ({
							assistantStoneId: a.assistantStoneId,
							assistantStoneName: a.assistantStoneName,
						})
					);
					setAssistantStones(assistantStonesData);
				}

				if (goldHarryRes.success) {
					loadedGoldHarries = (goldHarryRes.data || []).map((g) => ({
						goldHarryId: g.goldHarryId.toString(),
						goldHarry: g.goldHarry,
					}));
					setGoldHarries(loadedGoldHarries);
				}

				// 복수의 재고 데이터를 병렬로 로드
				const stockResponses = await Promise.all(
					codes.map((code) => stockApi.getStock([code]))
				);

				// 모든 재고 데이터를 StockOrderRows 형태로 변환
				const allStockRows: StockOrderRows[] = [];

				for (let i = 0; i < stockResponses.length; i++) {
					const stockRes = stockResponses[i];
					if (stockRes.success && stockRes.data && stockRes.data.length > 0) {
						const detail = stockRes.data[0]; // 배열의 첫 번째 요소 가져오기

						// 첫 번째 재고만 setStockDetail에 저장 (기존 로직 유지)
						if (i === 0) {
							setStockDetail(detail);
						}

						// stoneInfos를 사용하여 스톤 가격 및 개수 계산
						const calculatedStoneData = calculateStoneDetails(
							detail.stoneInfos || []
						);

						// materialId, colorId, goldHarryId 찾기
						const foundMaterial = materialsData.find(
							(m) => m.materialName === detail.materialName
						);
						const foundColor = colorsData.find(
							(c) => c.colorName === detail.colorName
						);

						// StockResponseDetail을 StockOrderRows 형태로 변환
						const stockRowData: StockOrderRows = {
							id: detail.flowCode,
							createAt: formatToLocalDate(detail.createAt),
							shippingAt: "",
							storeId: detail.storeId || "",
							storeName: detail.storeName,
							storeHarry: detail.storeHarry || "",
							grade: detail.storeGrade || "",
							productId: detail.productId || "",
							productName: detail.productName,
							productFactoryName: "",
							materialId: foundMaterial?.materialId || "",
							materialName: detail.materialName,
							colorId: foundColor?.colorId || "",
							colorName: detail.colorName,
							factoryId: detail.factoryId || "",
							factoryName: detail.factoryName,
							productSize: detail.productSize,
							productPurchaseCost: detail.productPurchaseCost,
							goldWeight: detail.goldWeight,
							stoneWeight: detail.stoneWeight,
							isProductWeightSale: detail.isProductWeightSale || false,
							mainStoneNote: detail.mainStoneNote,
							assistanceStoneNote: detail.assistanceStoneNote,
							orderNote: detail.note,
							stoneInfos: detail.stoneInfos || [],
							productLaborCost: detail.productLaborCost || 0,
							productAddLaborCost: detail.productAddLaborCost,
							mainStonePrice: calculatedStoneData.mainStonePrice,
							assistanceStonePrice: calculatedStoneData.assistanceStonePrice,
							mainStoneCount: calculatedStoneData.mainStoneCount,
							assistanceStoneCount: calculatedStoneData.assistanceStoneCount,
							stoneAddLaborCost: detail.stoneAddLaborCost,
							assistantStoneId: detail.assistantStoneId || "1",
							assistantStone: detail.assistantStone || false,
							assistantStoneName: detail.assistantStoneName || "",
							assistantStoneCreateAt: detail.assistantStoneCreateAt || "",
							totalWeight:
								parseFloat(detail.goldWeight) + parseFloat(detail.stoneWeight),
							stoneWeightTotal: calculatedStoneData.stoneWeight,
							classificationId: "",
							classificationName: "",
							setTypeId: "",
							setTypeName: "",
							currentStatus: "SHIPPED",
						};

						allStockRows.push(stockRowData);
					}
				}

				setStockRows(allStockRows);
			} catch (err) {
				handleError(err);
			} finally {
				setLoading(false);
			}
		};

		loadStockData();
	}, [flowCode]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleClose = () => {
		// 부모 창에 메시지 전송
		if (window.opener) {
			window.opener.postMessage(
				{
					type: "STOCK_UPDATE_CLOSED",
					flowCode: flowCode,
				},
				window.location.origin
			);
		}
		window.close();
	};

	const handleSave = async () => {
		try {
			setLoading(true);

			// 모든 재고 행에 대해 업데이트 요청 생성
			const updatePromises = stockRows.map((currentRow) => {
				const updateData: StockUpdateRequest = {
					productSize: currentRow.productSize,
					isProductWeightSale: currentRow.isProductWeightSale,
					stockNote: currentRow.orderNote,
					productPurchaseCost: Number(currentRow.productPurchaseCost) || 0,
					productLaborCost: Number(currentRow.productLaborCost) || 0,
					productAddLaborCost: Number(currentRow.productAddLaborCost) || 0,
					stoneWeight: currentRow.stoneWeight,
					goldWeight: currentRow.goldWeight,
					mainStoneNote: currentRow.mainStoneNote,
					assistanceStoneNote: currentRow.assistanceStoneNote,
					assistantStone: currentRow.assistantStone,
					assistantStoneId: currentRow.assistantStoneId,
					assistantStoneName: currentRow.assistantStoneName,
					assistantStoneCreateAt: currentRow.assistantStoneCreateAt,
					stoneInfos: currentRow.stoneInfos,
					stoneAddLaborCost: Number(currentRow.stoneAddLaborCost) || 0,
					totalStonePurchaseCost:
						Number(currentRow.mainStonePrice) +
						Number(currentRow.assistanceStonePrice),
				};

				return stockApi.updateStock(currentRow.id, updateData);
			});

			// 모든 업데이트 요청을 병렬로 실행
			await handleApiSubmit({
				promises: updatePromises,
				successMessage: "재고 정보가 성공적으로 업데이트되었습니다.",
				failureMessage: "일부 재고 정보 업데이트에 실패했습니다.",
				parentMessageType: "STOCK_UPDATE_SUCCESS",
				parentMessageData: { flowCodes },
				logMessage: "재고 수정",
				autoClose: false, // handleClose()로 직접 닫음
			});

			handleClose();
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="loading-container">
				<div className="spinner"></div>
				<p>재고 정보를 불러오는 중...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="error-container">
				<div className="error-message">
					<span>⚠️</span>
					<p>{error}</p>
				</div>
				<button onClick={handleClose}>닫기</button>
			</div>
		);
	}

	if (!stockDetail || stockRows.length === 0) {
		return (
			<div className="error-container">
				<p>재고 정보를 찾을 수 없습니다.</p>
				<button onClick={handleClose}>닫기</button>
			</div>
		);
	}

	return (
		<div className="stock-update-page">
			<div className="page-header">
				<h2>
					재고 상세 정보 {flowCodes.length > 1 ? `(${flowCodes.length}개)` : ""}
				</h2>
				{flowCodes.length === 1 && (
					<div className="detail-grid-stock">
						<div className="detail-item-stock">
							<label>재고코드:</label>
							<span>{stockDetail.flowCode}</span>
						</div>
						<div className="detail-item-stock">
							<label>등록일:</label>
							<span>{formatToLocalDate(stockDetail.createAt)}</span>
						</div>
						<div className="detail-item-stock">
							<label>최초 상태:</label>
							<span>{stockDetail.originalProductStatus}</span>
						</div>
					</div>
				)}
			</div>

			{/* StockTable 사용 */}
			<StockTable
				mode="detail"
				stockRows={stockRows}
				loading={loading}
				materials={materials}
				colors={colors}
				assistantStones={assistantStones}
				goldHarries={goldHarries}
				onRowUpdate={handleRowUpdate}
				onStoneInfoOpen={openStoneInfoManager}
				onAssistanceStoneArrivalChange={handleAssistanceStoneArrivalChange}
			/>

			{/* 저장/취소 버튼 */}
			<div className="form-actions">
				<button className="btn-cancel" onClick={handleClose}>
					닫기
				</button>
				<button className="btn-submit" onClick={handleSave}>
					저장
				</button>
			</div>
		</div>
	);
};

export default StockUpdatePage;
