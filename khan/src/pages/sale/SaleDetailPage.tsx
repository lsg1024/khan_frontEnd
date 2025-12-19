import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getLocalDate } from "../../utils/dateUtils";
import { saleApi } from "../../../libs/api/sale";
import { materialApi } from "../../../libs/api/material";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { storeApi } from "../../../libs/api/store";
import type { SaleStatusType } from "../../types/sale";
import { useErrorHandler } from "../../utils/errorHandler";
import type {
	SaleCreateRow,
	SaleOptionData,
	GoldHistoryData,
} from "../../types/sale";
import type { MaterialDto } from "../../types/material";
import type { AssistantStoneDto } from "../../types/AssistantStoneDto";
import SaleTable from "../../components/common/sale/SaleTable";
import SaleOption from "../../components/common/sale/SaleOption";
import AccountPaymentHistory from "../../components/common/sale/AccountPaymentHistory";
import { calculateStoneDetails } from "../../utils/calculateStone";
import {
	calculatePureGoldWeight,
	calculatePureGoldWeightWithHarry,
} from "../../utils/goldUtils";

const SaleDetailPage: React.FC = () => {
	const { flowCode, orderStatus } = useParams<{
		flowCode: string;
		orderStatus: string;
	}>();
	const [searchParams] = useSearchParams();
	const { handleError } = useErrorHandler();

	const [saleRows, setSaleRows] = useState<SaleCreateRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const [materials, setMaterials] = useState<MaterialDto[]>([]);
	const [assistantStones, setAssistantStones] = useState<AssistantStoneDto[]>(
		[]
	);

	const [accountBalanceHistoryData, setAccountBalanceHistory] =
		useState<GoldHistoryData>({
			previousGoldBalance: 0,
			previousMoneyBalance: 0,
			salesGoldBalance: 0,
			returnsGoldBalance: 0,
			salesMoneyBalance: 0,
			returnsMoneyBalance: 0,
			dcGoldBalance: 0,
			dcMoneyBalance: 0,
			paymentGoldBalance: 0,
			paymentMoneyBalance: 0,
			afterGoldBalance: 0,
			afterMoneyBalance: 0,
		});

	// 판매 옵션 상태 (읽기 전용)
	const [saleOptions, setSaleOptions] = useState<SaleOptionData>({
		storeName: "",
		storeId: "",
		tradeDate: "",
		marketPrice: 0,
		saleCode: "",
		tradeType: "중량",
		grade: "",
		harry: "",
		moneyAmount: 0,
		goldWeight: "",
	});

	// bulk 모드 체크 
	const isBulkMode = searchParams.has("flowCode");

	useEffect(() => {
		const loadData = async () => {
			// bulk 모드인 경우
			if (isBulkMode) {
				const flowCodes = searchParams.getAll("flowCode");
				const orderStatuses = searchParams.getAll("orderStatus");
				const storeId = searchParams.get("storeId") || "";

				if (flowCodes.length === 0) {
					setError("판매 코드가 전달되지 않았습니다.");
					setLoading(false);
					return;
				}

				if (
					orderStatuses.length === 0 ||
					flowCodes.length !== orderStatuses.length
				) {
					setError("주문 상태가 올바르지 않습니다.");
					setLoading(false);
					return;
				}

				try {
					const [materialRes, assistantStoneRes] = await Promise.all([
						materialApi.getMaterials(),
						assistantStoneApi.getAssistantStones(),
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

					// 여러 항목 로드
					const salePromises = flowCodes.map((code, index) =>
						saleApi.getSale(code, orderStatuses[index])
					);

					const saleResults = await Promise.all(salePromises);
					const loadedRows: SaleCreateRow[] = [];

					saleResults.forEach((saleRes, index) => {
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

							const rawGoldWeight =
								parseFloat(String(response.goldWeight)) || 0;
							const goldWeight = rawGoldWeight;
							const stoneWeight = parseFloat(String(response.stoneWeight)) || 0;
							const totalWeight = goldWeight + stoneWeight;

							// bulk 모드는 status가 반품이므로 해리 미적용
							const pureGoldWeight = calculatePureGoldWeight(
								goldWeight,
								response.materialName || ""
							);
							const saleData: SaleCreateRow = {
								id: `bulk_${index}`,
								status: "반품", // 벌크 모드는 항상 반품
								saleType: response.saleType || "",
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
							loadedRows.push(saleData); // 첫 번째 항목의 정보로 옵션 설정
							if (index === 0) {
								setSaleOptions({
									storeName: response.name || "",
									storeId: storeId,
									tradeDate: response.createAt
										? response.createAt.split("T")[0]
										: "",
									marketPrice: 0,
									saleCode: "",
									tradeType: "중량",
									grade: response.grade || "",
									harry: response.harry?.toString() || "",
									moneyAmount: 0,
									goldWeight: "",
								});
							}
						}
					});

					setSaleRows(loadedRows);

					console.log("Loaded Rows in Bulk Mode:", storeId);

					// 거래처 미수 데이터 조회 
					if (storeId) {
						try {
							const storeIdNum = parseInt(storeId);
							if (!isNaN(storeIdNum)) {
								const storeAttemptRes = await storeApi.getStoreAttemptById(
									storeIdNum
								);
								if (
									storeAttemptRes.success &&
									storeAttemptRes.data &&
									storeAttemptRes.data !== null
								) {
									const previousMoney =
										parseFloat(storeAttemptRes.data!.moneyAmount) || 0;
									const previousGold =
										parseFloat(storeAttemptRes.data!.goldWeight) || 0;

									// 전미수 값을 먼저 설정한 후, loadedRows를 이용해 후미수까지 계산
									const salesTotalMoney = loadedRows
										.filter((row) => row.status === "판매")
										.reduce(
											(acc, row) =>
												acc +
												row.productPrice +
												row.additionalProductPrice +
												row.mainStonePrice +
												row.assistanceStonePrice +
												row.stoneAddLaborCost,
											0
										);

									const salesTotalGold = loadedRows
										.filter((row) => row.status === "판매")
										.reduce((acc, row) => acc + row.pureGoldWeight, 0);

									const returnsTotalMoney = loadedRows
										.filter((row) => row.status === "반품")
										.reduce(
											(acc, row) =>
												acc +
												row.productPrice +
												row.additionalProductPrice +
												row.mainStonePrice +
												row.assistanceStonePrice +
												row.stoneAddLaborCost,
											0
										);

									const returnsTotalGold = loadedRows
										.filter((row) => row.status === "반품")
										.reduce((acc, row) => acc + row.pureGoldWeight, 0);

									const dcTotalMoney = loadedRows
										.filter((row) => row.status === "DC")
										.reduce((acc, row) => acc + row.productPrice, 0);

									const dcTotalGold = loadedRows
										.filter((row) => row.status === "DC")
										.reduce((acc, row) => acc + row.pureGoldWeight, 0);

									const paymentTotalMoney = loadedRows
										.filter(
											(row) => row.status === "결제" || row.status === "결통"
										)
										.reduce((acc, row) => acc + row.productPrice, 0);

									const paymentTotalGold = loadedRows
										.filter(
											(row) => row.status === "결제" || row.status === "결통"
										)
										.reduce((acc, row) => acc + row.pureGoldWeight, 0);

									setAccountBalanceHistory({
										previousMoneyBalance: previousMoney,
										previousGoldBalance: previousGold,
										salesGoldBalance: salesTotalGold,
										salesMoneyBalance: salesTotalMoney,
										returnsGoldBalance: returnsTotalGold,
										returnsMoneyBalance: returnsTotalMoney,
										dcGoldBalance: dcTotalGold,
										dcMoneyBalance: dcTotalMoney,
										paymentGoldBalance: paymentTotalGold,
										paymentMoneyBalance: paymentTotalMoney,
										afterGoldBalance:
											previousGold +
											salesTotalGold -
											returnsTotalGold -
											dcTotalGold -
											paymentTotalGold,
										afterMoneyBalance:
											previousMoney +
											salesTotalMoney -
											returnsTotalMoney -
											dcTotalMoney -
											paymentTotalMoney,
									});
								}
							}
						} catch (err) {
							console.error("거래처 미수 정보 로드 실패:", err);
						}
					}
				} catch (err) {
					handleError(err);
				} finally {
					setLoading(false);
				}

				return;
			}

			// 단일 항목 모드 (기존 로직)
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
					const rawGoldWeight = parseFloat(String(response.goldWeight)) || 0;
					const goldWeight = rawGoldWeight;
					const stoneWeight = parseFloat(String(response.stoneWeight)) || 0;
					const totalWeight = goldWeight + stoneWeight;

					const getSaleStatusFromType = (saleType: string): SaleStatusType => {
						const mapping: Record<string, SaleStatusType> = {
							SALES: "판매",
							PAYMENT: "결제",
							DISCOUNT: "DC",
							WG: "WG",
							PAYMENT_COMPLETED: "결통",
							RETURN: "반품",
						};
						return mapping[saleType] || "판매";
					};

					// status 확인 후 해리 적용 여부 결정
					const finalStatus =
						orderStatus === "RETURN"
							? "반품"
							: getSaleStatusFromType(response.saleType);

					// 순금 중량 계산 (판매일 때만 해리 적용)
					const pureGoldWeight =
						finalStatus === "판매"
							? calculatePureGoldWeightWithHarry(
									goldWeight,
									response.materialName || "",
									response.harry
							  )
							: calculatePureGoldWeight(
									goldWeight,
									response.materialName || ""
							  );

					const saleData: SaleCreateRow = {
						id: "1",
						status: finalStatus,
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
					setSaleRows([saleData]);

					// 판매 옵션 설정
					setSaleOptions({
						storeName: response.name || "",
						storeId: saleData.storeId,
						tradeDate: response.createAt ? response.createAt.split("T")[0] : "",
						marketPrice: 0,
						saleCode: "",
						tradeType: "중량",
						grade: response.grade || "",
						harry: response.harry?.toString() || "",
						moneyAmount: 0,
						goldWeight: "",
					});

					// 거래처 미수 정보 조회
					if (saleData.storeId) {
						try {
							const storeAttemptRes = await storeApi.getStoreAttemptById(
								parseInt(String(saleData.storeId))
							);
							if (storeAttemptRes.success && storeAttemptRes.data) {
								const attemptData = storeAttemptRes.data;
								setAccountBalanceHistory((prev) => ({
									...prev,
									previousMoneyBalance:
										parseFloat(attemptData.moneyAmount) || 0,
									previousGoldBalance: parseFloat(attemptData.goldWeight) || 0,
								}));
							}
						} catch (err) {
							console.error("거래처 미수 정보 로드 실패:", err);
						}
					}
				}
			} catch (err) {
				handleError(err);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [flowCode, orderStatus, isBulkMode, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

	// 행 업데이트 핸들러
	const onRowUpdate = (
		id: string,
		field: keyof SaleCreateRow,
		value: unknown
	) => {
		setSaleRows((rows) => {
			return rows.map((row) => {
				if (row.id !== id) return row;

				const updatedRow = { ...row, [field]: value };

				// bulk 모드에서는 status 변경 불가
				if (field === "status" && isBulkMode) {
					return row; // 변경하지 않고 원래 행 반환
				}

				// status가 변경되면 판매가 아닌 경우 재질을 24K로 설정
				if (field === "status") {
					const newStatus = String(value);
					if (
						newStatus !== "판매" &&
						newStatus !== "WG" &&
						newStatus !== "결통"
					) {
						const material24K = materials.find((m) => m.materialName === "24K");
						if (material24K) {
							updatedRow.materialId = material24K.materialId;
							updatedRow.materialName = material24K.materialName;
						}
					}
					// status 변경 시 순금 중량 재계산 (판매일 때만 해리 적용)
					if (newStatus === "판매") {
						updatedRow.pureGoldWeight = calculatePureGoldWeightWithHarry(
							row.goldWeight,
							row.materialName,
							saleOptions.harry
						);
					} else {
						updatedRow.pureGoldWeight = calculatePureGoldWeight(
							row.goldWeight,
							row.materialName
						);
					}
				}

				if (field === "totalWeight") {
					const totalWeight = parseFloat(String(value)) || 0;
					const stoneWeight = row.stoneWeight || 0;
					const goldWeight = totalWeight - stoneWeight;

					updatedRow.goldWeight = parseFloat(goldWeight.toFixed(3));
					// 판매일 때만 해리 적용
					if (row.status === "판매") {
						updatedRow.pureGoldWeight = calculatePureGoldWeightWithHarry(
							goldWeight,
							row.materialName,
							saleOptions.harry
						);
					} else {
						updatedRow.pureGoldWeight = calculatePureGoldWeight(
							goldWeight,
							row.materialName
						);
					}
				}

				// stoneWeight가 변경되면 goldWeight 재계산
				if (field === "stoneWeight") {
					const stoneWeight = parseFloat(String(value)) || 0;
					const totalWeight = row.totalWeight || 0;
					const goldWeight = totalWeight - stoneWeight;

					updatedRow.goldWeight = parseFloat(goldWeight.toFixed(3));
					// 판매일 때만 해리 적용
					if (row.status === "판매") {
						updatedRow.pureGoldWeight = calculatePureGoldWeightWithHarry(
							goldWeight,
							row.materialName,
							saleOptions.harry
						);
					} else {
						updatedRow.pureGoldWeight = calculatePureGoldWeight(
							goldWeight,
							row.materialName
						);
					}
				}

				// goldWeight 또는 materialName이 변경되면 순금 중량 재계산
				if (field === "goldWeight" || field === "materialName") {
					const goldWeight =
						field === "goldWeight"
							? parseFloat(String(value)) || 0
							: row.goldWeight;
					const materialName =
						field === "materialName" ? String(value) : row.materialName;

					// 판매일 때만 해리 적용
					if (row.status === "판매") {
						updatedRow.pureGoldWeight = calculatePureGoldWeightWithHarry(
							goldWeight,
							materialName,
							saleOptions.harry
						);
					} else {
						updatedRow.pureGoldWeight = calculatePureGoldWeight(
							goldWeight,
							materialName
						);
					}
				}
				return {
					...updatedRow,
				};
			});
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
		const targetRow = saleRows.find((r) => r.id === rowId);
		if (!targetRow) return;

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
							stoneInfos: targetRow?.stoneInfos || [],
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

	const handleAssistanceStoneArrivalChange = (id: string, value: string) => {
		setSaleRows((rows) =>
			rows.map((row) => {
				if (row.id !== id) return row;
				return {
					...row,
					assistantStone: value === "Y",
					assistantStoneCreateAt: value === "Y" ? getLocalDate() : "",
				};
			})
		);
	};

	const handleOptionChange = () => {
		// 읽기 전용 - 아무 동작 안 함
	};

	const handleCustomerSearchOpen = () => {
		// 읽기 전용 - 아무 동작 안 함
	};

	// 판매 행 변경 시 금 거래 내역 자동 계산
	useEffect(() => {
		// 구분에 따라 판매, 반품, DC, 결제 값 계산
		const salesTotalMoney = saleRows
			.filter((row) => row.status === "판매")
			.reduce(
				(acc, row) =>
					acc +
					row.productPrice +
					row.additionalProductPrice +
					row.mainStonePrice +
					row.assistanceStonePrice +
					row.stoneAddLaborCost,
				0
			);

		const salesTotalGold = saleRows
			.filter((row) => row.status === "판매")
			.reduce((acc, row) => acc + row.pureGoldWeight, 0);

		const returnsTotalMoney = saleRows
			.filter((row) => row.status === "반품")
			.reduce(
				(acc, row) =>
					acc +
					row.productPrice +
					row.additionalProductPrice +
					row.mainStonePrice +
					row.assistanceStonePrice +
					row.stoneAddLaborCost,
				0
			);

		const returnsTotalGold = saleRows
			.filter((row) => row.status === "반품")
			.reduce((acc, row) => acc + row.pureGoldWeight, 0);

		const dcTotalMoney = saleRows
			.filter((row) => row.status === "DC")
			.reduce((acc, row) => acc + row.productPrice, 0);

		const dcTotalGold = saleRows
			.filter((row) => row.status === "DC")
			.reduce((acc, row) => acc + row.pureGoldWeight, 0);

		const paymentTotalMoney = saleRows
			.filter((row) => row.status === "결제" || row.status === "결통")
			.reduce((acc, row) => acc + row.productPrice, 0);

		const paymentTotalGold = saleRows
			.filter((row) => row.status === "결제" || row.status === "결통")
			.reduce((acc, row) => acc + row.pureGoldWeight, 0);

		const wgTotalMoney = saleRows
			.filter((row) => row.status === "WG")
			.reduce(
				(acc, row) => acc + row.pureGoldWeight * saleOptions.marketPrice,
				0
			);

		setAccountBalanceHistory((prev) => {
			// 전미수 값은 API에서 로드된 값을 유지
			const previousGold = prev.previousGoldBalance;
			const previousMoney = prev.previousMoneyBalance;

			return {
				...prev,
				salesGoldBalance: salesTotalGold,
				salesMoneyBalance: salesTotalMoney,
				returnsGoldBalance: returnsTotalGold,
				returnsMoneyBalance: returnsTotalMoney,
				dcGoldBalance: dcTotalGold,
				dcMoneyBalance: dcTotalMoney,
				paymentGoldBalance: paymentTotalGold,
				paymentMoneyBalance: paymentTotalMoney,
				afterGoldBalance:
					previousGold +
					salesTotalGold -
					returnsTotalGold -
					dcTotalGold -
					paymentTotalGold,
				afterMoneyBalance:
					previousMoney +
					salesTotalMoney -
					wgTotalMoney -
					returnsTotalMoney -
					dcTotalMoney -
					paymentTotalMoney,
			};

			console.log("금 거래 내역 자동 계산 완료", previousGold, previousMoney);
		});
	}, [saleRows, saleOptions.marketPrice]);

	// 저장 핸들러
	const handleSave = async () => {
		if (saleRows.length === 0) {
			alert("저장할 데이터가 없습니다.");
			return;
		}

		try {
			setIsSaving(true);
			setError("");

			if (isBulkMode) {
				const deletePromises = saleRows.map((row) => {
					const flowCodeNum = row.flowCode;
					const type = row.saleType || "RETURN"; // 저장된 saleType 사용

					return saleApi.deleteSale(type, flowCodeNum);
				});

				const responses = await Promise.all(deletePromises);
				const allSuccess = responses.every((response) => response.success);

				if (allSuccess) {
					alert("반품 처리되었습니다.");

					if (window.opener) {
						window.opener.postMessage(
							{ type: "SALE_SAVED" },
							window.location.origin
						);
					}
					window.close();
				} else {
					const failedResponses = responses.filter((r) => !r.success);
					alert(
						`반품 처리 실패: ${
							failedResponses.map((r) => r.message).join(", ") ||
							"알 수 없는 오류"
						}`
					);
				}
			} else {
				const updatePromises = saleRows.map((row) => {
					const updateDto = {
						productSize: row.productSize,
						isProductWeightSale: saleOptions.tradeType === "중량",
						productPurchaseCost: row.stonePurchasePrice,
						productLaborCost: row.productPrice,
						productAddLaborCost: row.additionalProductPrice,
						stockNote: row.note,
						storeHarry: saleOptions.harry,
						goldWeight: row.goldWeight.toString(),
						stoneWeight: row.stoneWeight.toString(),
						mainStoneNote: row.mainStoneNote,
						assistanceStoneNote: row.assistanceStoneNote,
						assistantStone: row.assistantStone,
						assistantStoneId: row.assistantStoneId,
						assistantStoneName: row.assistantStoneName,
						assistantStoneCreateAt: row.assistantStoneCreateAt,
						stoneInfos: row.stoneInfos,
						stoneAddLaborCost: row.stoneAddLaborCost,
					};
					return saleApi.updateSale(row.flowCode, updateDto);
				});

				const responses = await Promise.all(updatePromises);
				const allSuccess = responses.every((response) => response.success);

				if (allSuccess) {
					alert("저장되었습니다.");

					// 저장 완료 메시지 전송 (부모 창에서 새로고침하도록)
					if (window.opener) {
						window.opener.postMessage(
							{ type: "SALE_SAVED" },
							window.location.origin
						);
					}
					window.close();
				} else {
					const failedResponses = responses.filter((r) => !r.success);
					alert(
						`저장 실패: ${
							failedResponses.map((r) => r.message).join(", ") ||
							"알 수 없는 오류"
						}`
					);
				}
			}
		} catch (err) {
			handleError(err);
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

	if (error || saleRows.length === 0) {
		return (
			<div className="error-container">
				<p>{error || "판매 정보를 찾을 수 없습니다."}</p>
				<button onClick={() => window.close()}>닫기</button>
			</div>
		);
	}

	return (
		<div className="order-update-page">
			<div className="page-header">
				<h3>판매 상세보기</h3>
			</div>

			{/* 판매 옵션 및 계정 내역 */}
			<div className="sale-create-content">
				{/* 판매 옵션 */}
				<div className="sale-create-top-row">
					{/* 상품 이미지 */}
					<div className="product-image-section">
						<div className="product-image-placeholder">
							<p>상품 이미지</p>
						</div>
					</div>

					<SaleOption
						options={saleOptions}
						onOptionChange={handleOptionChange}
						onCustomerSearchOpen={handleCustomerSearchOpen}
						disabled={loading}
						hasWGStatus={false}
						isStoreLoadedFromApi={true}
					/>

					{/* 계정 결제 내역 */}
					<AccountPaymentHistory
						history={accountBalanceHistoryData}
						disabled={loading}
					/>
				</div>
			</div>

			{/* 판매 테이블 */}
			<SaleTable
				rows={saleRows}
				loading={loading}
				onRowUpdate={onRowUpdate}
				onRowDelete={onRowDelete}
				onFlowCodeSearch={onFlowCodeSearch}
				onRowFocus={onRowFocus}
				disabled={loading}
				materials={materials}
				assistantStones={assistantStones}
				onStoneInfoOpen={openStoneInfoManager}
				onAssistanceStoneArrivalChange={handleAssistanceStoneArrivalChange}
				storeId={saleOptions.storeId}
				storeName={saleOptions.storeName}
				isBulkReturnMode={isBulkMode}
			/>

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
