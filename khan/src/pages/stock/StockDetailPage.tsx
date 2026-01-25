import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { stockApi } from "../../../libs/api/stockApi";
import { materialApi } from "../../../libs/api/materialApi";
import { colorApi } from "../../../libs/api/colorApi";
import { assistantStoneApi } from "../../../libs/api/assistantStoneApi";
import { goldHarryApi } from "../../../libs/api/goldHarryApi";
import { useErrorHandler } from "../../utils/errorHandler";
import type { StockOrderRows } from "../../types/stockDto";
import type { MaterialDto } from "../../types/materialDto";
import type { ColorDto } from "../../types/colorDto";
import type { AssistantStoneDto } from "../../types/AssistantStoneDto";
import type { goldHarryResponse as GoldHarryDto } from "../../types/goldHarryDto";
import StockTable from "../../components/common/stock/StockTable";
import { calculateStoneDetails } from "../../utils/calculateStone";

const StockDetailPage: React.FC = () => {
	const { flowCode } = useParams<{ flowCode: string }>();
	const { handleError } = useErrorHandler();

	const [stockRow, setStockRow] = useState<StockOrderRows | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

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

	useEffect(() => {
		const loadData = async () => {
			if (!flowCode) {
				setError("재고 코드가 전달되지 않았습니다.");
				setLoading(false);
				return;
			}

			try {
				const [
					materialRes,
					colorRes,
					assistantStoneRes,
					goldHarryRes,
					stockRes,
				] = await Promise.all([
					materialApi.getMaterials(),
					colorApi.getColors(),
					assistantStoneApi.getAssistantStones(),
					goldHarryApi.getGoldHarry(),
					stockApi.getStock([flowCode]),
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
							assistantStoneId: a.assistantStoneId,
							assistantStoneName: a.assistantStoneName,
					  }))
					: [];
				const loadedGoldHarries = goldHarryRes.success
					? (goldHarryRes.data || []).map((h) => ({
							goldHarryId: h.goldHarryId?.toString() || "",
							goldHarry: h.goldHarry,
					  }))
					: [];

				setMaterials(loadedMaterials);
				setColors(loadedColors);
				setAssistantStones(loadedAssistantStones);
				setGoldHarries(loadedGoldHarries);

				if (stockRes.success && stockRes.data && stockRes.data.length > 0) {
					const response = stockRes.data[0]; // 배열의 첫 번째 요소 가져오기
					const calculatedStoneData = calculateStoneDetails(
						response.stoneInfos
					);

					const foundMaterial = loadedMaterials.find(
						(m) => m.materialName === response.materialName
					);
					const foundColor = loadedColors.find(
						(c) => c.colorName === response.colorName
					);
					const foundAssistantStone = loadedAssistantStones.find(
						(a) => a.assistantStoneName === response.assistantStoneName
					);

					const stockData: StockOrderRows = {
						createAt: response.createAt,
						shippingAt: "",
						id: response.flowCode,
						storeId: "", // API 응답에 없음
						storeName: response.storeName,
						grade: "1",
						productId: "", // API 응답에 없음
						productName: response.productName,
						productFactoryName: "",
						productPurchaseCost: response.productPurchaseCost || 0,
						materialId: foundMaterial?.materialId || "",
						materialName: response.materialName,
						colorId: foundColor?.colorId || "",
						colorName: response.colorName,
						factoryId: "", // API 응답에 없음
						factoryName: response.factoryName,
						productSize: response.productSize,
						goldWeight: response.goldWeight,
						stoneWeight: response.stoneWeight,
						isProductWeightSale: false,
						mainStoneNote: response.mainStoneNote,
						assistanceStoneNote: response.assistanceStoneNote,
						orderNote: response.note,
						stoneInfos: response.stoneInfos || [],
						productLaborCost: response.productLaborCost || 0,
						productAddLaborCost: response.productAddLaborCost || 0,
						mainStonePrice: calculatedStoneData.mainStonePrice,
						assistanceStonePrice: calculatedStoneData.assistanceStonePrice,
						mainStoneCount: calculatedStoneData.mainStoneCount,
						assistanceStoneCount: calculatedStoneData.assistanceStoneCount,
						stoneAddLaborCost: response.stoneAddLaborCost || 0,
						stoneWeightTotal: calculatedStoneData.stoneWeight,
						assistantStone: response.assistantStone || false,
						assistantStoneId:
							response.assistantStoneId.toString() ||
							foundAssistantStone?.assistantStoneId.toString() ||
							"",
						assistantStoneName: response.assistantStoneName || "",
						assistantStoneCreateAt: response.assistantStoneCreateAt || "",
						totalWeight: (
							Number(response.goldWeight) + Number(response.stoneWeight)
						).toFixed(3) as unknown as number,
						storeHarry: response.storeHarry,
						classificationId: "", // API 응답에 없음
						classificationName: "",
						setTypeId: "", // API 응답에 없음
						setTypeName: "",
					};

					setStockRow(stockData);
				}
			} catch (err) {
				handleError(err)
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [flowCode]); // eslint-disable-line react-hooks/exhaustive-deps

	// 읽기 전용이므로 모든 핸들러는 빈 함수
	const onRowUpdate = () => {
		// 읽기 전용 - 아무 동작 안 함
	};

	const openStoneInfoManager = () => {
		// 읽기 전용 - 아무 동작 안 함
	};

	if (loading) {
		return (
			<div className="loading-container">
				<div className="spinner"></div>
				<p>재고 정보를 불러오는 중...</p>
			</div>
		);
	}

	if (error || !stockRow) {
		return (
			<div className="error-container">
				<p>{error || "재고 정보를 찾을 수 없습니다."}</p>
				<button onClick={() => window.close()}>닫기</button>
			</div>
		);
	}

	return (
		<div className="order-update-page">
			<div className="page-header">
				<h3>재고 상세보기</h3>
				<p>재고 코드: {stockRow.id}</p>
			</div>
			<div className="bulk-order-item">
				<StockTable
					mode="readonly" // 읽기 전용 모드
					stockRows={[stockRow]}
					loading={loading}
					materials={materials}
					colors={colors}
					assistantStones={assistantStones}
					goldHarries={goldHarries}
					onRowUpdate={onRowUpdate}
					onStoneInfoOpen={openStoneInfoManager}
				/>
			</div>

			{/* 닫기 버튼만 표시 */}
			<div className="detail-button-group">
				<button className="btn-cancel" onClick={() => window.close()}>
					닫기
				</button>
			</div>
		</div>
	);
};

export default StockDetailPage;
