import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { stockApi } from "../../../libs/api/stock";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { goldHarryApi } from "../../../libs/api/goldHarry";
import { useErrorHandler } from "../../utils/errorHandler";
import { formatToLocalDate } from "../../utils/dateUtils";
import { calculateStoneDetails } from "../../utils/calculateStone";
import type {
	StockResponseDetail,
	StockOrderRows,
	StockUpdateRequest,
} from "../../types/stock";
import StockTable from "../../components/common/stock/StockTable";
import "../../styles/pages/stock/StockUpdatePage.css";

const StockUpdatePage: React.FC = () => {
	const { flowCode } = useParams<{ flowCode: string }>();
	const { handleError } = useErrorHandler();

	const [stockDetail, setStockDetail] = useState<StockResponseDetail | null>(
		null
	);
	const [stockRows, setStockRows] = useState<StockOrderRows[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

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

				// 재고 상세 정보와 드롭다운 데이터를 병렬로 로드
				const [
					stockRes,
					materialRes,
					colorRes,
					assistantStoneRes,
					goldHarryRes,
				] = await Promise.all([
					stockApi.getStock(flowCode),
					materialApi.getMaterials(),
					colorApi.getColors(),
					assistantStoneApi.getAssistantStones(),
					goldHarryApi.getGoldHarry(),
				]);

				// 드롭다운 데이터 설정
				let materialsData: { materialId: string; materialName: string }[] = [];
				let colorsData: { colorId: string; colorName: string }[] = [];

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
							assistantStoneId: a.assistantStoneId.toString(),
							assistantStoneName: a.assistantStoneName,
						})
					);
					setAssistantStones(assistantStonesData);
				}

				if (goldHarryRes.success) {
					const loadedGoldHarries = (goldHarryRes.data || []).map((g) => ({
						goldHarryId: g.goldHarryId.toString(),
						goldHarry: g.goldHarry, // goldHarryName이 아니라 goldHarry
					}));
					setGoldHarries(loadedGoldHarries);
				}

				if (stockRes.success && stockRes.data) {
					const detail = stockRes.data;
					setStockDetail(detail);

					// stoneInfos를 사용하여 스톤 가격 및 개수 계산
					const calculatedStoneData = calculateStoneDetails(
						detail.stoneInfos || []
					);

					// materialId와 colorId 찾기 (조회용이므로 없으면 빈 문자열)
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
						shippingAt: formatToLocalDate(detail.shippingAt),
						storeId: "",
						storeName: detail.storeName,
						grade: "",
						productId: "",
						productName: detail.productName,
						materialId: foundMaterial?.materialId || "",
						materialName: detail.materialName,
						colorId: foundColor?.colorId || "",
						colorName: detail.colorName,
						factoryId: "",
						factoryName: detail.factoryName,
						productSize: detail.productSize,
						productPurchaseCost: detail.productPurchaseCost,
						goldWeight: detail.goldWeight,
						stoneWeight: detail.stoneWeight,
						isProductWeightSale: false,
						mainStoneNote: detail.mainStoneNote,
						assistanceStoneNote: detail.assistanceStoneNote,
						orderNote: detail.stockNote,
						stoneInfos: detail.stoneInfos || [],
						productLaborCost: detail.productLaborCost,
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
						storeHarry: detail.storeHarry || "",
						classificationId: "",
						classificationName: detail.classificationName,
						setTypeId: "",
						setTypeName: detail.setTypeName,
						currentStatus: "SHIPPED",
					};

					setStockRows([stockRowData]);
				}
			} catch (err) {
				handleError(err, setError);
			} finally {
				setLoading(false);
			}
		};

		loadStockData();
	}, [flowCode]);

	// 스톤 정보 관리 모달 열기
	const openStoneInfoManager = (rowId: string) => {
		const url = `/stock/stone-info?rowId=${rowId}&origin=${window.location.origin}`;
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
					const calculatedStoneData = calculateStoneDetails(
						event.data.stoneInfos
					);

					// stoneInfos 업데이트
					handleRowUpdate(rowId, "stoneInfos", event.data.stoneInfos);

					// 계산된 스톤 데이터 업데이트
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
						"stoneWeightTotal",
						calculatedStoneData.stoneWeight
					);
					handleRowUpdate(
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

			const currentRow = stockRows[0];

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

			const response = await stockApi.updateStock(flowCode!, updateData);

			if (response.success) {
				alert("재고 정보가 성공적으로 업데이트되었습니다.");

				// 부모 창(StockPage)에 새로고침 메시지 전송
				if (window.opener) {
					window.opener.postMessage(
						{
							type: "STOCK_UPDATE_SUCCESS",
							flowCode: flowCode,
						},
						window.location.origin
					);
				}

				handleClose();
			} else {
				throw new Error(
					response.message || "재고 정보 업데이트에 실패했습니다."
				);
			}
		} catch (err) {
			handleError(err, setError);
			alert("재고 정보 업데이트 중 오류가 발생했습니다.");
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
				<h2>재고 상세 정보</h2>
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
