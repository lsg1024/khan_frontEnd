import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getLocalDate } from "../../utils/dateUtils";
import { saleApi } from "../../../libs/api/sale";
import { materialApi } from "../../../libs/api/material";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import type { SaleStatusType } from "../../types/sale";
import { useErrorHandler } from "../../utils/errorHandler";
import type { SaleCreateRow, SaleOptionData } from "../../types/sale";
import type { MaterialDto } from "../../types/material";
import type { AssistantStoneDto } from "../../types/AssistantStoneDto";
import SaleTable from "../../components/common/sale/SaleTable";
import SaleOption from "../../components/common/sale/SaleOption";
import { calculateStoneDetails } from "../../utils/calculateStone";
import { calculatePureGoldWeight } from "../../utils/goldUtils";
import { v4 as uuidv4 } from "uuid";

const SaleDetailPage: React.FC = () => {
	const { flowCode, orderStatus } = useParams<{
		flowCode: string;
		orderStatus: string;
	}>();
	const { handleError } = useErrorHandler();

	const [saleRow, setSaleRow] = useState<SaleCreateRow>();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const [materials, setMaterials] = useState<MaterialDto[]>([]);
	const [assistantStones, setAssistantStones] = useState<AssistantStoneDto[]>(
		[]
	);

	// 판매 옵션 상태 (읽기 전용)
	const [saleOptions, setSaleOptions] = useState<SaleOptionData>({
		storeName: "",
		storeId: "",
		tradeDate: "",
		marketPrice: 0,
		saleCode: "",
		tradeType: "중량",
		grade: "",
		appliedHarry: "",
	});

	useEffect(() => {
		const loadData = async () => {
			if (!flowCode) {
				setError("판매 코드가 전달되지 않았습니다.");
				setLoading(false);
				return;
			}

			if (!orderStatus) {
				setError("주문 상태가 전달되지 않았습니다.");
				setLoading(false);
				return;
			}

			try {
				const [materialRes, assistantStoneRes, saleRes] = await Promise.all([
					materialApi.getMaterials(),
					assistantStoneApi.getAssistantStones(),
					saleApi.getSale(flowCode, orderStatus),
				]);

				const loadedMaterials = materialRes.success
					? (materialRes.data || []).map((m) => ({
							materialId: m.materialId?.toString(),
							materialName: m.materialName,
							materialGoldPurityPercent: m.materialGoldPurityPercent || "",
					  }))
					: [];
				const loadedAssistantStones = assistantStoneRes.success
					? (assistantStoneRes.data || []).map((a) => ({
							assistantStoneId: a.assistantStoneId,
							assistantStoneName: a.assistantStoneName,
					  }))
					: [];

				setMaterials(loadedMaterials);
				setAssistantStones(loadedAssistantStones);

				if (saleRes.success && saleRes.data) {
					const response = saleRes.data;
					const calculatedStoneData = calculateStoneDetails(
						response.stoneInfos || []
					);

					const foundMaterial = loadedMaterials.find(
						(m) => m.materialName === response.materialName
					);
					const foundAssistantStone = loadedAssistantStones.find(
						(a) => a.assistantStoneName === response.assistantStoneName
					);

					// 금중량, 알중량
					const goldWeight = parseFloat(String(response.goldWeight)) || 0;
					const stoneWeight = parseFloat(String(response.stoneWeight)) || 0;
					const totalWeight = response.goldWeight + stoneWeight || 0;

					// 순금 중량 계산 (금중량이 0보다 클 때만)
					const pureGoldWeight =
						goldWeight > 0
							? calculatePureGoldWeight(
									goldWeight,
									response.materialName || ""
							  )
							: 0;

					const saleData: SaleCreateRow = {
						id: "1",
						status: response.saleType as SaleStatusType,
						flowCode: response.flowCode || "",
						storeId: "",
						productId: "",
						productName: response.productName || "",
						materialId: foundMaterial?.materialId || "",
						materialName: response.materialName || "",
						colorId: "",
						colorName: response.colorName || "",
						assistantStoneId:
							response.assistantStoneId ||
							foundAssistantStone?.assistantStoneId?.toString() ||
							"",
						assistantStoneName: response.assistantStoneName || "",
						assistantStone: response.assistantStone || false,
						assistantStoneCreateAt: response.assistantStoneCreateAt || "",
						mainStoneNote: response.mainStoneNote || "",
						assistanceStoneNote: response.assistanceStoneNote || "",
						productSize: response.productSize || "",
						note: response.note || "",
						productPrice: response.productLaborCost || 0,
						additionalProductPrice: response.productAddLaborCost || 0,
						stonePurchasePrice: calculatedStoneData.purchaseStonePrice,
						mainStonePrice: calculatedStoneData.mainStonePrice,
						assistanceStonePrice: calculatedStoneData.assistanceStonePrice,
						stoneAddLaborCost: response.addStoneLaborCost || 0,
						stoneWeightTotal: calculatedStoneData.stoneWeight,
						totalWeight: totalWeight,
						stoneWeight: stoneWeight,
						goldWeight: goldWeight,
						pureGoldWeight: pureGoldWeight,
						pricePerGram: 0,
						mainStoneCount: calculatedStoneData.mainStoneCount,
						assistanceStoneCount: calculatedStoneData.assistanceStoneCount,
						stoneInfos: response.stoneInfos || [],
					};
					setSaleRow(saleData);

					// 판매 옵션 설정
					setSaleOptions({
						storeName: response.name || "",
						storeId: "", // SaleDetailResponse에 storeId 필드 없음
						tradeDate: response.createAt ? response.createAt.split("T")[0] : "",
						marketPrice: 0, // SaleDetailResponse에 marketPrice 필드 없음
						saleCode: "", // SaleDetailResponse에 saleCode 필드 없음
						tradeType: "중량",
						grade: response.grade || "",
						appliedHarry: response.harry?.toString() || "",
					});
				}
			} catch (err) {
				handleError(err, setError);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [flowCode, orderStatus]); // eslint-disable-line react-hooks/exhaustive-deps

	// 행 업데이트 핸들러
	const onRowUpdate = (
		_id: string,
		field: keyof SaleCreateRow,
		value: unknown
	) => {
		setSaleRow((row) => {
			if (!row) return row;

			const updatedRow = { ...row, [field]: value };

			if (field === "totalWeight") {
				const totalWeight = parseFloat(String(value)) || 0;
				const stoneWeight = row.stoneWeight || 0;
				const goldWeight = totalWeight - stoneWeight;

				updatedRow.goldWeight = parseFloat(goldWeight.toFixed(3));
				// 금중량이 0보다 클 때만 순금 중량 계산
				updatedRow.pureGoldWeight =
					goldWeight > 0
						? calculatePureGoldWeight(goldWeight, row.materialName)
						: 0;
			}

			return {
				...updatedRow,
			};
		});
	};

	const onRowDelete = () => {
		// 삭제 기능 비활성화
	};

	const onFlowCodeSearch = () => {
		// 시리얼 검색 비활성화 (읽기 전용)
	};

	const onRowFocus = () => {
		// 포커스 처리
	};

	const openStoneInfoManager = (rowId: string) => {
		if (!saleRow) return;

		const url = `/stock/stone-info?rowId=${rowId}&origin=${window.location.origin}`;
		const NAME = `stoneInfo_${rowId}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1200,height=500";

		const popup = window.open(url, NAME, FEATURES);
		if (popup) {
			popup.focus();
			const handleMessage = (event: MessageEvent) => {
				if (
					event.data.type === "REQUEST_STONE_INFO" &&
					event.data.rowId === rowId
				) {
					popup.postMessage(
						{
							type: "STONE_INFO_DATA",
							stoneInfos: saleRow?.stoneInfos || [],
						},
						window.location.origin
					);
				} else if (
					event.data.type === "STONE_INFO_SAVE" &&
					event.data.rowId === rowId
				) {
					onRowUpdate(rowId, "stoneInfos", event.data.stoneInfos);

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
					onRowUpdate(
						rowId,
						"stoneWeightTotal",
						calculatedStoneData.stoneWeight
					);
					onRowUpdate(
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

	const handleAssistanceStoneArrivalChange = (_id: string, value: string) => {
		if (!saleRow) return;
		setSaleRow((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				assistantStone: value === "Y",
				assistantStoneCreateAt: value === "Y" ? getLocalDate() : "",
			};
		});
	};

	const handleOptionChange = () => {
		// 읽기 전용 - 아무 동작 안 함
	};

	const handleCustomerSearchOpen = () => {
		// 읽기 전용 - 아무 동작 안 함
	};

	// 저장 핸들러
	const handleSave = async () => {
		if (!saleRow || !flowCode || !orderStatus) {
			alert("저장할 데이터가 없습니다.");
			return;
		}

		try {
			setIsSaving(true);
			setError("");

			const eventId = uuidv4();

			// SaleUpdateRequest DTO 형식으로 변환
			const updateDto = {
				productSize: saleRow.productSize,
				isProductWeightSale: saleOptions.tradeType === "중량",
				productPurchaseCost: saleRow.stonePurchasePrice,
				productLaborCost: saleRow.productPrice,
				productAddLaborCost: saleRow.additionalProductPrice,
				stockNote: saleRow.note,
				storeHarry: saleOptions.appliedHarry,
				goldWeight: saleRow.goldWeight.toString(),
				stoneWeight: saleRow.stoneWeight.toString(),
				mainStoneNote: saleRow.mainStoneNote,
				assistanceStoneNote: saleRow.assistanceStoneNote,
				assistantStone: saleRow.assistantStone,
				assistantStoneId: saleRow.assistantStoneId,
				assistantStoneName: saleRow.assistantStoneName,
				assistantStoneCreateAt: saleRow.assistantStoneCreateAt,
				stoneInfos: saleRow.stoneInfos,
				stoneAddLaborCost: saleRow.stoneAddLaborCost,
			};

			const response = await saleApi.updateSale(flowCode, updateDto, eventId);

			if (response.success) {
				alert("저장되었습니다.");

				// 팝업 닫기 메시지 전송
				if (window.opener) {
					window.opener.postMessage(
						{ type: "SALE_DETAIL_CLOSED" },
						window.location.origin
					);
				}
				window.close();
			} else {
				alert(`저장 실패: ${response.message || "알 수 없는 오류"}`);
			}
		} catch (err) {
			handleError(err, setError);
		} finally {
			setIsSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="loading-container">
				<div className="spinner"></div>
				<p>판매 정보를 불러오는 중...</p>
			</div>
		);
	}

	if (error || !saleRow) {
		return (
			<div className="error-container">
				<p>{error || "판매 정보를 찾을 수 없습니다."}</p>
				<button onClick={() => window.close()}>닫기</button>
			</div>
		);
	}

	return (
		<div className="sale-detail-page">
			<div className="page-header">
				<h3>판매 상세보기</h3>
				<p style={{ marginLeft: "10px" }}>판매 코드: {saleRow.flowCode}</p>
			</div>

			{/* 판매 옵션 (읽기 전용) */}
			<div className="sale-detail-option">
				<SaleOption
					options={saleOptions}
					onOptionChange={handleOptionChange}
					onCustomerSearchOpen={handleCustomerSearchOpen}
					disabled={true}
					hasWGStatus={false}
					isStoreLoadedFromApi={true}
				/>
			</div>

			{/* 판매 테이블 */}
			<div className="bulk-order-item">
				<SaleTable
					rows={[saleRow]}
					loading={loading}
					onRowUpdate={onRowUpdate}
					onRowDelete={onRowDelete}
					onFlowCodeSearch={onFlowCodeSearch}
					onRowFocus={onRowFocus}
					disabled={false}
					materials={materials}
					assistantStones={assistantStones}
					onStoneInfoOpen={openStoneInfoManager}
					onAssistanceStoneArrivalChange={handleAssistanceStoneArrivalChange}
				/>
			</div>

			{/* 저장/닫기 버튼 */}
			<div className="detail-button-group">
				<button className="btn-cancel" onClick={() => window.close()}>
					닫기
				</button>
				<button className="btn-submit" onClick={handleSave} disabled={isSaving}>
					{isSaving ? "저장 중..." : "저장"}
				</button>
			</div>
		</div>
	);
};

export default SaleDetailPage;
