import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { stockApi } from "../../../libs/api/stock";
import { saleApi } from "../../../libs/api/sale";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { goldHarryApi } from "../../../libs/api/goldHarry";
import { formatToLocalDate, getLocalDate } from "../../utils/dateUtils";
import { calculateStoneDetails } from "../../utils/calculateStone";
import type { MaterialDto } from "../../types/material";
import type { ColorDto } from "../../types/color";
import type { AssistantStoneDto } from "../../types/AssistantStoneDto";
import type { goldHarryResponse as GoldHarryDto } from "../../types/goldHarry";
import type { ResponseDetail, StockOrderRows } from "../../types/stock";
import StockTable from "../../components/common/stock/StockTable";
import "../../styles/pages/stock/StockUpdatePage.css";

type ActionType = "sale" | "rental" | "return";

const StockCommonActionPage: React.FC = () => {
	const { flowCode } = useParams<{ flowCode: string }>();
	const [searchParams] = useSearchParams();
	const action = (searchParams.get("action") as ActionType) || "sale";

	const [stockDetail, setStockDetail] = useState<ResponseDetail | null>(null);
	const [stockRows, setStockRows] = useState<StockOrderRows[]>([]);
	const [loading, setLoading] = useState(true);
	const [flowCodes, setFlowCodes] = useState<string[]>([]);

	// 드롭다운 데이터
	const [materials, setMaterials] = useState<MaterialDto[]>([]);
	const [colors, setColors] = useState<ColorDto[]>([]);
	const [assistantStones, setAssistantStones] = useState<AssistantStoneDto[]>([]);
	const [goldHarries, setGoldHarries] = useState<GoldHarryDto[]>([]);
	// 액션 타입에 따른 타이틀
	const getTitle = () => {
		switch (action) {
			case "sale":
				return "판매 등록";
			case "rental":
				return "대여 등록";
			case "return":
				return "반납 등록";
			default:
				return "재고 등록";
		}
	};

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

	// 초기 데이터 로드
	useEffect(() => {
		const loadStockData = async () => {
			if (!flowCode) {
				alert("재고 코드가 없습니다.");
				setLoading(false);
				handleClose();
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

				if (materialRes.success) {
					const materialsData = (materialRes.data || []).map((m) => ({
						materialId: m.materialId?.toString() || "",
						materialName: m.materialName,
					}));
					setMaterials(materialsData);
				}

				if (colorRes.success) {
					const colorsData = (colorRes.data || []).map((c) => ({
						colorId: c.colorId?.toString() || "",
						colorName: c.colorName,
					}));
					setColors(colorsData);
				}

				if (assistantStoneRes.success) {
					const assistantStonesData = (assistantStoneRes.data || []).map((a) => ({
						assistantStoneId: a.assistantStoneId,
						assistantStoneName: a.assistantStoneName,
					}));
					setAssistantStones(assistantStonesData);
				}

				if (goldHarryRes.success) {
					const loadedGoldHarries = (goldHarryRes.data || []).map((g) => ({
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

						// materialId와 colorId 찾기
						const foundMaterial = materials.find(
							(m) => m.materialName === detail.materialName
						);
						const foundColor = colors.find(
							(c) => c.colorName === detail.colorName
						);

						// assistantStoneName이 비어있으면 ID로 찾기
						let assistantStoneName = detail.assistantStoneName || "";
						if (!assistantStoneName && detail.assistantStoneId) {
							const foundAssistantStone = assistantStones.find(
								(a) => a.assistantStoneId.toString() === detail.assistantStoneId
							);
							assistantStoneName =
								foundAssistantStone?.assistantStoneName || "";
						}

						// StockResponseDetail을 StockOrderRows 형태로 변환
						const stockRowData: StockOrderRows = {
							id: detail.flowCode,
							createAt: formatToLocalDate(detail.createAt),
							shippingAt: "",
							storeId: "",
							storeName: detail.storeName,
							grade: "",
							productId: "",
							productName: detail.productName,
							productFactoryName: "",
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
							orderNote: detail.note,
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
							assistantStoneName: assistantStoneName,
							assistantStoneCreateAt: detail.assistantStoneCreateAt || "",
							totalWeight:
								parseFloat(detail.goldWeight) + parseFloat(detail.stoneWeight),
							stoneWeightTotal: calculatedStoneData.stoneWeight,
							storeHarry: detail.storeHarry || "",
							classificationId: "",
							classificationName: "",
							setTypeId: "",
							setTypeName: "",
							currentStatus: "SHIPPED",
							saleNote: "",
						};

						allStockRows.push(stockRowData);
					}
				}

				setStockRows(allStockRows);
			} catch (err) {
				alert("재고 정보를 불러오는 중 오류가 발생했습니다.");
				console.error(err);
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

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let promises: Promise<any>[] = [];
			let successMessage = "";
			let actionType = "";

			if (action === "sale") {
				// 오늘 등록된 판매장 확인
				let newSale = false;
				if (stockRows.length > 0 && stockRows[0].storeId) {
					try {
						const accountId = parseInt(stockRows[0].storeId);
						if (accountId) {
							const checkResponse = await saleApi.checkBeforeSale(accountId);

							if (checkResponse.success && checkResponse.data) {
								const existingSaleCode = checkResponse.data;

								if (existingSaleCode) {
									const shouldAdd = window.confirm(
										`오늘 등록된 판매장이 있습니다.\n해당 판매장에 추가하시겠습니까?`
									);
									newSale = shouldAdd;
								}
							}
						}
					} catch (err) {
						console.error("판매장 확인 실패:", err);
					}
				}

				// 판매 등록
				promises = stockRows.map((currentRow) => {
					const calculatedStoneData = calculateStoneDetails(
						currentRow.stoneInfos || []
					);

					// assistantStoneName이 비어있으면 ID로 찾기
					let assistantStoneName = currentRow.assistantStoneName;
					if (!assistantStoneName && currentRow.assistantStoneId) {
						const foundStone = assistantStones.find(
							(s) => s.assistantStoneId.toString() === currentRow.assistantStoneId
						);
						assistantStoneName = foundStone?.assistantStoneName || "";
					}

					const saleData = {
						productSize: currentRow.productSize,
						isProductWeightSale: currentRow.isProductWeightSale,
						addProductLaborCost: Number(currentRow.productAddLaborCost) || 0,
						stoneAddLaborCost: Number(currentRow.stoneAddLaborCost) || 0,
						productPurchaseCost: Number(currentRow.productPurchaseCost) || 0,
						stonePurchaseCost:
							calculatedStoneData.mainStonePrice +
							calculatedStoneData.assistanceStonePrice,
						mainStoneNote: currentRow.mainStoneNote || "",
						assistanceStoneNote: currentRow.assistanceStoneNote || "",
						stockNote: currentRow.saleNote || currentRow.orderNote || "",
						assistantStone: currentRow.assistantStone,
						assistantStoneId: currentRow.assistantStoneId || "1",
						assistantStoneName: assistantStoneName,
						assistantStoneCreateAt: currentRow.assistantStoneCreateAt || "",
						goldWeight: currentRow.goldWeight || "0",
						stoneWeight: currentRow.stoneWeight || "0",
						stoneInfos: currentRow.stoneInfos || [],
					};

					return saleApi.updateStockToSale(currentRow.id, saleData, newSale);
				});
				successMessage = "판매 등록";
				actionType = "판매 등록";
			} else if (action === "rental") {
				// 대여 등록
				promises = stockRows.map((currentRow) => {
					// assistantStoneName이 비어있으면 ID로 찾기
					let assistantStoneName = currentRow.assistantStoneName;
					if (!assistantStoneName && currentRow.assistantStoneId) {
						const foundStone = assistantStones.find(
							(s) => s.assistantStoneId.toString() === currentRow.assistantStoneId
						);
						assistantStoneName = foundStone?.assistantStoneName || "";
					}

					const rentalData = {
						productSize: currentRow.productSize,
						mainStoneNote: currentRow.mainStoneNote || "",
						assistanceStoneNote: currentRow.assistanceStoneNote || "",
						stockNote: currentRow.saleNote || currentRow.orderNote || "",
						isProductWeightSale: currentRow.isProductWeightSale,
						goldWeight: currentRow.goldWeight || "0",
						stoneWeight: currentRow.stoneWeight || "0",
						productAddLaborCost: Number(currentRow.productAddLaborCost) || 0,
						stoneAddLaborCost: Number(currentRow.stoneAddLaborCost) || 0,
						stoneInfos: currentRow.stoneInfos || [],
					};

					return stockApi.updateStockToRental(currentRow.id, rentalData);
				});
				successMessage = "대여 등록";
				actionType = "대여 등록";
			} else if (action === "return") {
				// 반납 등록
				promises = stockRows.map((currentRow) => {
					return stockApi.updateRentalToReturn(currentRow.id, "RETURN");
				});
				successMessage = "반납 등록";
				actionType = "반납 등록";
			}

			// 모든 등록 요청을 병렬로 실행
			const responses = await Promise.all(promises);

			// 성공/실패 개수 확인
			const successCount = responses.filter((res) => res.success).length;
			const failCount = responses.length - successCount;

			if (failCount === 0) {
				alert(
					`${successCount}개의 재고가 성공적으로 ${successMessage}되었습니다.`
				);
			} else {
				alert(
					`${successCount}개 성공, ${failCount}개 실패\n일부 재고 ${actionType}에 실패했습니다.`
				);
			}

			if (window.opener) {
				window.opener.postMessage(
					{
						type: "STOCK_UPDATE_SUCCESS",
						flowCodes: flowCodes,
					},
					window.location.origin
				);
			}

			handleClose();
		} catch (err) {
			console.error(err);
			alert(`${getTitle()} 중 오류가 발생했습니다.`);
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
					{getTitle()} {flowCodes.length > 1 ? `(${flowCodes.length}개)` : ""}
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
				mode="sales"
				stockRows={stockRows}
				loading={loading}
				materials={materials}
				colors={colors}
				assistantStones={assistantStones}
				goldHarries={goldHarries}
				onRowUpdate={handleRowUpdate}
				onAssistanceStoneArrivalChange={handleAssistanceStoneArrivalChange}
				onStoneInfoOpen={openStoneInfoManager}
			/>

			{/* 저장/취소 버튼 */}
			<div className="form-actions">
				<button className="btn-cancel" onClick={handleClose}>
					닫기
				</button>
				<button className="btn-submit" onClick={handleSave}>
					{"등록"}
				</button>
			</div>
		</div>
	);
};

export default StockCommonActionPage;
