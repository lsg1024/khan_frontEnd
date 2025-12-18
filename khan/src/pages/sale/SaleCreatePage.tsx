import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getLocalDate } from "../../utils/dateUtils";
import { useErrorHandler } from "../../utils/errorHandler";
import type {
	SaleOptionData,
	GoldHistoryData,
	SaleCreateRow,
	SalePaymentRequest,
} from "../../types/sale";
import type { AccountInfoDto, StoreSearchDto } from "../../types/store";
import type { PastOrderDto } from "../../types/order";
import type { AssistantStoneDto } from "../../types/AssistantStoneDto";
import type { StockSaleRequest, StockRegisterRequest } from "../../types/stock";
import SaleOption from "../../components/common/sale/SaleOption";
import AccountBalanceHistory from "../../components/common/sale/AccountBalanceHistory";
import SaleTable from "../../components/common/sale/SaleTable";
import StoreSearch from "../../components/common/store/StoreSearch";
import PastOrderHistory from "../../components/common/PastOrderHistory";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { orderApi } from "../../../libs/api/order";
import { stockApi } from "../../../libs/api/stock";
import { storeApi } from "../../../libs/api/store";
import { materialApi } from "../../../libs/api/material";
import { calculateStoneDetails } from "../../utils/calculateStone";
import {
	calculatePureGoldWeight,
	calculatePureGoldWeightWithHarry,
} from "../../utils/goldUtils";
import "../../styles/pages/sale/SaleCreatePage.css";
import { saleApi } from "../../../libs/api/sale";

export const SaleCreatePage = () => {
	const [searchParams] = useSearchParams();
	const { handleError } = useErrorHandler();
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const [showStoreSearch, setShowStoreSearch] = useState<boolean>(false);
	const [assistantStones, setAssistantStones] = useState<AssistantStoneDto[]>(
		[]
	);
	const [materials, setMaterials] = useState<
		{ materialId: string; materialName: string }[]
	>([]);
	const [pendingRequests, setPendingRequests] = useState<Set<string>>(
		new Set()
	);
	const [pastOrdersCache, setPastOrdersCache] = useState<
		Map<string, PastOrderDto[]>
	>(new Map());
	const [currentDisplayedPastOrders, setCurrentDisplayedPastOrders] = useState<
		PastOrderDto[]
	>([]);
	const [isAppendSale, setIsAppendSale] = useState<boolean>(false);

	// 판매 옵션 상태
	const [saleOptions, setSaleOptions] = useState<SaleOptionData>({
		storeName: "",
		storeId: "",
		tradeDate: getLocalDate(),
		marketPrice: 0,
		saleCode: "", // 자동 생성
		tradeType: "중량",
		grade: "",
		harry: "",
		moneyAmount: 0,
		goldWeight: "",
	});

	// 거래처가 API로부터 로드되었는지 여부
	const [isStoreLoadedFromApi, setIsStoreLoadedFromApi] =
		useState<boolean>(false);

	// 거래 내역 상태
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

	// 판매 행 상태
	const [saleRows, setSaleRows] = useState<SaleCreateRow[]>(
		Array.from({ length: 10 }, (_, i) => ({
			id: String(i + 1),
			status: "판매",
			flowCode: "",
			storeId: "",
			productId: "",
			productName: "",
			materialId: "",
			materialName: "",
			colorId: "",
			colorName: "",
			assistantStoneId: "",
			assistantStoneName: "",
			assistantStone: false,
			assistantStoneCreateAt: "",
			mainStoneNote: "",
			assistanceStoneNote: "",
			productSize: "",
			note: "",
			productPrice: 0,
			additionalProductPrice: 0,
			stonePurchasePrice: 0,
			mainStonePrice: 0,
			assistanceStonePrice: 0,
			stoneAddLaborCost: 0,
			stoneWeightTotal: 0,
			totalWeight: 0,
			stoneWeight: 0,
			goldWeight: 0,
			pureGoldWeight: 0,
			pricePerGram: 0,
			mainStoneCount: 0,
			assistanceStoneCount: 0,
			stoneInfos: [],
		}))
	);

	// 판매 옵션 변경 핸들러
	const handleOptionChange = <K extends keyof SaleOptionData>(
		field: K,
		value: SaleOptionData[K]
	) => {
		setSaleOptions((prev) => ({ ...prev, [field]: value }));
	};

	// 거래처 검색 모달 열기
	const handleCustomerSearchOpen = () => {
		setShowStoreSearch(true);
	};

	// 거래처 선택 핸들러
	const handleStoreSelect = async (store: StoreSearchDto | AccountInfoDto) => {
		// StoreAttemptDto 타입 가드
		const isStoreAttempt = (
			s: StoreSearchDto | AccountInfoDto
		): s is AccountInfoDto => {
			return "goldWeight" in s && "moneyAmount" in s;
		};

		// StoreAttemptDto가 아니면 경고 (SaleCreatePage에서는 항상 StoreAttemptDto를 받아야 함)
		if (!isStoreAttempt(store)) {
			console.warn("⚠️ SaleCreatePage에서는 StoreAttemptDto가 필요합니다.");
			return;
		}

		setSaleOptions((prev) => ({
			...prev,
			storeId: String(store.accountId || ""),
			storeName: store.accountName,
			grade: store.grade || "",
			harry: store.goldHarryLoss || "",
			moneyAmount: parseFloat(store.moneyAmount) || 0,
			goldWeight: store.goldWeight || "",
		}));

		// 미수금과 금 중량을 AccountBalanceHistory의 전미수에 반영
		setAccountBalanceHistory((prev) => ({
			...prev,
			previousMoneyBalance: parseFloat(store.moneyAmount) || 0,
			previousGoldBalance: parseFloat(store.goldWeight) || 0,
		}));

		setShowStoreSearch(false);

		if (store.accountId) {
			// 기존 함수 재사용
			const shouldAppend = await checkAndConfirmExistingSale(
				String(store.accountId)
			);
			setIsAppendSale(shouldAppend);

			// UX: 이어쓰기 선택 시 알림 메시지 (선택 사항)
			if (shouldAppend) {
				console.log("기존 판매장에 이어쓰기로 설정되었습니다.");
			}
		}
	};

	// 거래처 검색 모달 닫기
	const handleStoreSearchClose = () => {
		setShowStoreSearch(false);
	};

	// 기존 판매장 확인 및 사용자 선택 처리
	const checkAndConfirmExistingSale = async (
		storeId: string
	): Promise<boolean> => {
		try {
			const accountId = parseInt(storeId);
			if (!accountId) {
				return false;
			}

			const checkResponse = await saleApi.checkBeforeSale(accountId);

			if (checkResponse.success && checkResponse.data) {
				const existingSaleCode = checkResponse.data;

				if (existingSaleCode) {
					const shouldAdd = window.confirm(
						`오늘 등록된 판매장이 있습니다.\n해당 판매장에 추가하시겠습니까?`
					);
					return shouldAdd;
				}
			}
		} catch (err) {
			console.error("판매장 확인 실패:", err);
		}
		return false;
	};

	// 시리얼(재고) 검색 모달 열기
	const handleFlowCodeSearch = (rowId: string) => {
		console.log("시리얼 검색 모달 열기", rowId);
	};

	// 스톤 정보 관리 모달 열기
	const openStoneInfoManager = (rowId: string) => {
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
					const row = saleRows.find((r) => r.id === rowId);
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
						"stoneAddLaborCost",
						calculatedStoneData.stoneAddLaborCost
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

	// 판매 행 업데이트 핸들러
	const handleRowUpdate = (
		id: string,
		field: keyof SaleCreateRow,
		value: unknown
	) => {
		setSaleRows((prev) =>
			prev.map((row) => {
				if (row.id !== id) return row;

				const updatedRow = { ...row, [field]: value };

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

				// totalWeight가 변경되면 goldWeight 계산 (총중량 - 알중량)
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
				} // stoneWeight가 변경되면 goldWeight 재계산
				if (field === "stoneWeight") {
					const stoneWeight = parseFloat(String(value)) || 0;
					const totalWeight = row.totalWeight || 0;
					const goldWeight = totalWeight - stoneWeight;

					updatedRow.goldWeight = parseFloat(goldWeight.toFixed(3));
					updatedRow.pureGoldWeight = calculatePureGoldWeightWithHarry(
						goldWeight,
						row.materialName,
						saleOptions.harry
					);
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
				} // storeId, productId, materialName 중 하나가 변경되면 과거 거래내역 조회
				if (
					field === "storeId" ||
					field === "productId" ||
					field === "materialName"
				) {
					if (
						updatedRow.storeId &&
						updatedRow.productId &&
						updatedRow.materialName
					) {
						const cacheKey = `${updatedRow.storeId}-${updatedRow.productId}-${updatedRow.materialName}`;

						// 캐시에 없으면 데이터 로드
						if (!pastOrdersCache.has(cacheKey)) {
							updatePastOrders(
								updatedRow.storeId,
								updatedRow.productId,
								updatedRow.materialName
							);
						} else {
							// 캐시에 있으면 바로 표시
							setCurrentDisplayedPastOrders(
								pastOrdersCache.get(cacheKey) || []
							);
						}
					}
				}

				return updatedRow;
			})
		);
	};

	// 행에 포커스가 활성화될 때 과거 매출 데이터 표시
	const handleRowFocus = async (rowId: string) => {
		const row = saleRows.find((r) => r.id === rowId);
		if (!row) {
			setCurrentDisplayedPastOrders([]);
			return;
		}

		// storeId, productId, materialName이 모두 있으면 과거 매출 데이터 처리
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
	};

	// 판매 행 삭제 핸들러
	const handleRowDelete = (id: string) => {
		setSaleRows((prev) => prev.filter((row) => row.id !== id));
	};

	// 보조석 입고여부 변경 핸들러
	const handleAssistanceStoneArrivalChange = (id: string, value: string) => {
		setSaleRows((prev) =>
			prev.map((row) =>
				row.id === id
					? {
							...row,
							hasAssistantStone: value === "Y",
							assistantStoneArrivalDate: value === "Y" ? getLocalDate() : "",
					  }
					: row
			)
		);
	};

	// 폼 초기화 함수
	const resetForm = () => {
		// 판매 옵션 초기화
		setSaleOptions({
			storeName: "",
			storeId: "",
			tradeDate: getLocalDate(),
			marketPrice: 0,
			saleCode: "",
			tradeType: "중량",
			grade: "",
			harry: "",
			moneyAmount: 0,
			goldWeight: "",
		});

		// 거래처 로드 상태 초기화
		setIsStoreLoadedFromApi(false);

		// 금 거래 내역 초기화
		setAccountBalanceHistory({
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

		// 판매 행 초기화
		setSaleRows(
			Array.from({ length: 10 }, (_, i) => ({
				id: String(i + 1),
				status: "판매",
				flowCode: "",
				storeId: "",
				productId: "",
				productName: "",
				materialId: "",
				materialName: "",
				colorId: "",
				colorName: "",
				assistantStoneId: "",
				assistantStoneName: "",
				assistantStone: false,
				assistantStoneCreateAt: "",
				mainStoneNote: "",
				assistanceStoneNote: "",
				productSize: "",
				note: "",
				productPrice: 0,
				additionalProductPrice: 0,
				stonePurchasePrice: 0,
				mainStonePrice: 0,
				assistanceStonePrice: 0,
				stoneAddLaborCost: 0,
				stoneWeightTotal: 0,
				totalWeight: 0,
				stoneWeight: 0,
				goldWeight: 0,
				pureGoldWeight: 0,
				pricePerGram: 0,
				mainStoneCount: 0,
				assistanceStoneCount: 0,
				stoneInfos: [],
			}))
		);

		// 과거 주문 내역 초기화
		setCurrentDisplayedPastOrders([]);
		setPastOrdersCache(new Map());
		setPendingRequests(new Set());

		// 에러 메시지 초기화
		setError("");
	};

	// 등록 핸들러
	const handleSubmit = async () => {
		try {
			setLoading(true);
			setError("");

			if (!saleOptions.storeId) {
				setError("거래처를 선택해주세요.");
				return;
			}

			const source = searchParams.get("source");
			console.log("source:", source);

			// 재고/주문에서 판매 처리하는 경우 - flowCode 필수
			if (source === "order" || source === "stock") {
				const validRows = saleRows.filter((row) => row.flowCode);
				console.log("flowCode가 있는 유효한 행:", validRows);

				if (validRows.length === 0) {
					setError("시리얼이 입력된 판매 항목이 없습니다.");
					return;
				}

				// 각 행을 개별적으로 API 호출
				const results = await Promise.all(
					validRows.map(async (row) => {
						try {
							let response;

							console.log(
								"판매 등록 데이터 준비:",
								row,
								row.status,
								saleOptions,
								source
							);

							// 결제, DC, WG, 결통 상태인 경우 결제 처리
							if (["결제", "DC", "WG", "결통"].includes(row.status)) {
								const paymentData = {
									id: parseInt(row.flowCode) || 0,
									name: saleOptions.storeName,
									harry: saleOptions.harry,
									grade: saleOptions.grade,
									orderStatus: row.status,
									material: row.materialName,
									note: row.note,
									goldWeight: row.goldWeight.toString(),
									payAmount: row.productPrice || 0,
								};

								response = await saleApi.createPaymentSale(
									paymentData,
									isAppendSale
								);
							} else if (source === "order") {
								// 주문에서 판매 등록 - StockRegisterRequest 타입 사용
								const orderSaleData: StockRegisterRequest = {
									createAt: saleOptions.tradeDate,
									flowCode: row.flowCode,
									materialId: row.materialId,
									materialName: row.materialName,
									colorId: row.colorId,
									colorName: row.colorName,
									productSize: row.productSize,
									isProductWeightSale: false,
									productPurchaseCost: 0,
									productLaborCost: row.productPrice,
									productAddLaborCost: row.additionalProductPrice,
									storeHarry: saleOptions.harry,
									goldWeight: row.goldWeight.toString(),
									stoneWeight: row.stoneWeight.toString(),
									orderNote: row.note,
									mainStoneNote: row.mainStoneNote,
									assistanceStoneNote: row.assistanceStoneNote,
									assistantStoneId: row.assistantStoneId || "1",
									assistantStone: row.assistantStone,
									assistantStoneName: row.assistantStoneName,
									assistantStoneCreateAt: row.assistantStoneCreateAt || "",
									stoneInfos: row.stoneInfos || [],
									stoneAddLaborCost: row.stoneAddLaborCost || 0,
								};

								response = await saleApi.updateOrderToSale(
									row.flowCode,
									"SALES",
									orderSaleData,
									isAppendSale
								);
							} else {
								// 재고에서 판매 등록 - StockSaleRequest 타입 사용
								const stockSaleData: StockSaleRequest = {
									productSize: row.productSize,
									isProductWeightSale: false,
									addProductLaborCost: row.additionalProductPrice,
									stoneAddLaborCost: row.stoneAddLaborCost,
									mainStoneNote: row.mainStoneNote,
									assistanceStoneNote: row.assistanceStoneNote,
									stockNote: row.note,
									assistantStone: row.assistantStone,
									assistantStoneId: row.assistantStoneId,
									assistantStoneCreateAt: row.assistantStoneCreateAt || "",
									goldWeight: row.goldWeight.toString(),
									stoneWeight: row.stoneWeight.toString(),
									stoneInfos: row.stoneInfos,
								};

								response = await saleApi.updateStockToSale(
									row.flowCode,
									stockSaleData,
									isAppendSale
								);
							}

							return { success: response.success, flowCode: row.flowCode };
						} catch (error) {
							console.error(`판매 등록 실패 (${row.flowCode}):`, error);
							return { success: false, flowCode: row.flowCode };
						}
					})
				);

				// 결과 확인
				const failedItems = results.filter((r) => !r.success);

				if (failedItems.length === 0) {
					alert("판매 등록이 완료되었습니다.");

					console.log("모든 판매 등록 성공:", results);

					// 초기화
					resetForm();

					// 부모 창으로 판매 등록 완료 메시지 전송
					if (window.opener) {
						window.opener.postMessage(
							{ type: "SALES_REGISTERED", success: true },
							window.location.origin
						);
					}

					window.close();
				} else {
					const failedCodes = failedItems
						.map((item) => item.flowCode)
						.join(", ");
					setError(`일부 항목의 판매 등록에 실패했습니다: ${failedCodes}`);
				}
			} else {
				// 직접 판매 생성하는 경우 - createPaymentSale 사용
				// 유효한 행이 있는지 확인 (재질과 금중량이 입력된 행)
				const validRows = saleRows.filter(
					(row) =>
						row.materialName && // 재질이 있어야 함
						(row.goldWeight > 0 || row.productPrice > 0) // 금중량 또는 금액이 있어야 함
				);
				console.log("직접 판매 생성 유효한 행:", validRows);

				if (validRows.length === 0) {
					setError("재질과 금중량이 입력된 판매 항목이 없습니다.");
					return;
				}

				// 각 행을 개별적으로 API 호출
				const results = await Promise.all(
					validRows.map(async (row) => {
						try {
							const paymentData: SalePaymentRequest = {
								id: parseInt(saleOptions.storeId) || 0,
								name: saleOptions.storeName,
								harry: saleOptions.harry,
								grade: saleOptions.grade,
								orderStatus: row.status,
								material: row.materialName,
								note: row.note,
								goldWeight: Math.abs(row.goldWeight).toString(),
								payAmount: Math.abs(row.productPrice),
							};

							console.log("직접 판매 등록 데이터:", paymentData);
							console.log("row 원본 데이터:", row);

							const response = await saleApi.createPaymentSale(
								paymentData,
								isAppendSale
							);

							return {
								success: response.success,
								productName: row.productName || `행 ${row.id}`,
							};
						} catch (error) {
							console.error(`판매 등록 실패 (행 ${row.id}):`, error);
							return {
								success: false,
								productName: row.productName || `행 ${row.id}`,
							};
						}
					})
				);

				// 결과 확인
				const failedItems = results.filter((r) => !r.success);

				if (failedItems.length === 0) {
					alert("판매 등록이 완료되었습니다.");
					console.log("모든 판매 등록 성공:", results);

					// 초기화
					resetForm();

					// 부모 창으로 판매 등록 완료 메시지 전송
					if (window.opener) {
						window.opener.postMessage(
							{ type: "SALES_REGISTERED", success: true },
							window.location.origin
						);
					}

					window.close();
				} else {
					const failedNames = failedItems
						.map((item) => item.productName)
						.join(", ");
					setError(`일부 항목의 판매 등록에 실패했습니다: ${failedNames}`);
				}
			}
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
		}
	};

	// 취소 핸들러
	const handleCancel = () => {
		if (confirm("작성 중인 내용이 저장되지 않습니다. 창을 닫으시겠습니까?")) {
			window.close();
		}
	};

	// WG 상태 확인 (구분이 WG인 행이 하나라도 있는지)
	const hasWGStatus = saleRows.some((row) => row.status === "WG");

	// 과거 매출 내역 로드 함수
	const updatePastOrders = async (
		storeId: string,
		productId: string,
		materialName: string
	) => {
		const pastOrders = await fetchPastOrders(storeId, productId, materialName);
		setCurrentDisplayedPastOrders(pastOrders);
	};

	const fetchPastOrders = async (
		storeId: string,
		productId: string,
		materialName: string
	): Promise<PastOrderDto[]> => {
		const cacheKey = `${storeId}-${productId}-${materialName}`;

		try {
			// 캐시에 데이터가 있으면 캐시에서 반환
			if (pastOrdersCache.has(cacheKey)) {
				return pastOrdersCache.get(cacheKey) || [];
			}

			// 이미 진행 중인 요청이 있으면 중복 호출 방지
			if (pendingRequests.has(cacheKey)) {
				return [];
			}

			// storeId와 productId를 숫자로 변환
			const storeNum = parseInt(storeId);
			const productNum = parseInt(productId);

			// 유효성 검사
			if (isNaN(storeNum) || isNaN(productNum)) {
				console.warn("⚠️ 유효하지 않은 ID:", { storeId, productId });
				return [];
			}

			// 진행 중인 요청으로 등록
			pendingRequests.add(cacheKey);
			setPendingRequests(new Set(pendingRequests));

			const response = await orderApi.getPastOrders(
				storeNum,
				productNum,
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
		} finally {
			// 진행 중인 요청에서 제거
			pendingRequests.delete(cacheKey);
			setPendingRequests(new Set(pendingRequests));
		}
	};

	// 보조석 목록 로드
	useEffect(() => {
		const loadAssistantStones = async () => {
			try {
				const assistantStoneRes = await assistantStoneApi.getAssistantStones();

				if (assistantStoneRes.success) {
					const loadedAssistantStones = (assistantStoneRes.data || []).map(
						(a) => ({
							assistantStoneId: a.assistantStoneId,
							assistantStoneName: a.assistantStoneName,
						})
					);
					setAssistantStones(loadedAssistantStones);
				}
			} catch (err) {
				console.error("보조석 목록 로드 실패:", err);
			}
		};

		loadAssistantStones();
	}, []);

	// URL 파라미터에서 source와 ids를 가져와서 데이터 로드
	useEffect(() => {
		const source = searchParams.get("source"); // "order" 또는 "stock"
		const ids = searchParams.get("ids"); // 쉼표로 구분된 ID 문자열

		if (source && ids) {
			loadSaleData(source, ids);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	// 주문 또는 재고 데이터를 로드하여 판매 테이블에 채우기
	const loadSaleData = async (source: string, ids: string) => {
		try {
			setLoading(true);
			const idArray = ids.split(",");

			if (source === "order") {
				const response = await stockApi.getStockDetail(idArray);

				if (response.success && response.data) {
					const firstItem = response.data[0];
					if (
						firstItem &&
						firstItem.storeId &&
						firstItem.storeName &&
						firstItem.storeGrade &&
						firstItem.storeHarry
					) {
						setSaleOptions((prev) => ({
							...prev,
							storeId: String(firstItem.storeId),
							storeName: firstItem.storeName,
							grade: firstItem.storeGrade,
							harry: firstItem.storeHarry,
						}));
						setIsStoreLoadedFromApi(true);

						// 거래처가 로드되면 판매장 확인
						const shouldAppend = await checkAndConfirmExistingSale(
							String(firstItem.storeId)
						);
						setIsAppendSale(shouldAppend);

						// 거래처 미수 정보 조회하여 accountBalanceHistoryData에 반영
						try {
							const storeAttemptRes = await storeApi.getStoreAttemptById(
								parseInt(String(firstItem.storeId))
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

					const newRows: SaleCreateRow[] = response.data.map((stock, index) => {
						// 스톤 정보 계산
						const calculatedStoneData = calculateStoneDetails(
							stock.stoneInfos || []
						);

						// 금중량, 알중량
						const rawGoldWeight = parseFloat(stock.goldWeight) || 0;
						const goldWeight = rawGoldWeight;
						const stoneWeight = parseFloat(stock.stoneWeight) || 0;
						const totalWeight = goldWeight + stoneWeight;

						// 초기 status가 판매이므로 해리 적용
						const pureGoldWeight = calculatePureGoldWeightWithHarry(
							goldWeight,
							stock.materialName || "",
							stock.storeHarry
						);
						return {
							id: String(index + 1),
							status: "판매",
							flowCode: stock.flowCode || "",
							storeId: stock.storeId?.toString() || "",
							productId: stock.productId?.toString() || "",
							productName: stock.productName || "",
							materialId: stock.materialId?.toString() || "",
							materialName: stock.materialName || "",
							colorId: stock.colorId?.toString() || "",
							colorName: stock.colorName || "",
							assistantStoneId: stock.assistantStoneId?.toString() || "",
							assistantStoneName: stock.assistantStoneName || "",
							assistantStone: stock.assistantStone || false,
							assistantStoneCreateAt:
								stock.assistantStoneCreateAt &&
								stock.assistantStoneCreateAt !== "null"
									? stock.assistantStoneCreateAt
									: "",
							mainStoneNote: stock.mainStoneNote || "",
							assistanceStoneNote: stock.assistanceStoneNote || "",
							productSize: stock.productSize || "",
							note: stock.note || "",
							productPrice: stock.productLaborCost || 0,
							additionalProductPrice: stock.productAddLaborCost || 0,
							stonePurchasePrice: calculatedStoneData.purchaseStonePrice,
							mainStonePrice: calculatedStoneData.mainStonePrice,
							assistanceStonePrice: calculatedStoneData.assistanceStonePrice,
							stoneAddLaborCost: stock.stoneAddLaborCost || 0,
							stoneWeightTotal: stoneWeight,
							totalWeight: totalWeight,
							stoneWeight: stoneWeight,
							goldWeight: goldWeight,
							pureGoldWeight: pureGoldWeight,
							pricePerGram: 0,
							stoneCountPerUnit: 0,
							mainStoneCount: calculatedStoneData.mainStoneCount,
							assistanceStoneCount: calculatedStoneData.assistanceStoneCount,
							stoneInfos: stock.stoneInfos || [],
						};
					});

					setSaleRows(newRows);
				}
			} else if (source === "stock") {
				const response = await stockApi.getStock(idArray);

				if (response.success && response.data) {
					// 첫 번째 데이터에서 거래처 정보 추출 (모두 같은 거래처여야 함)
					const firstItem = response.data[0];
					if (
						firstItem &&
						firstItem.storeId &&
						firstItem.storeName &&
						firstItem.storeGrade &&
						firstItem.storeHarry
					) {
						setSaleOptions((prev) => ({
							...prev,
							storeId: String(firstItem.storeId),
							storeName: firstItem.storeName,
							grade: firstItem.storeGrade,
							harry: firstItem.storeHarry,
						}));
						setIsStoreLoadedFromApi(true);

						// // 거래처가 로드되면 판매장 확인
						const shouldAppend = await checkAndConfirmExistingSale(
							String(firstItem.storeId)
						);
						setIsAppendSale(shouldAppend);

						// 거래처 미수 정보 조회하여 accountBalanceHistoryData에 반영
						try {
							const storeAttemptRes = await storeApi.getStoreAttemptById(
								parseInt(String(firstItem.storeId))
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

					const newRows: SaleCreateRow[] = response.data.map((stock, index) => {
						// 스톤 정보 계산
						const calculatedStoneData = calculateStoneDetails(
							stock.stoneInfos || []
						);

						// 금중량, 알중량
						const rawGoldWeight = parseFloat(stock.goldWeight) || 0;
						const goldWeight = rawGoldWeight;
						const stoneWeight = parseFloat(stock.stoneWeight) || 0;
						const totalWeight = goldWeight + stoneWeight;

						// 초기 status가 판매이므로 해리 적용
						const pureGoldWeight = calculatePureGoldWeightWithHarry(
							goldWeight,
							stock.materialName || "",
							stock.storeHarry
						);
						return {
							id: String(index + 1),
							status: "판매",
							flowCode: stock.flowCode || "",
							storeId: stock.storeId?.toString() || "",
							productId: stock.productId?.toString() || "",
							productName: stock.productName || "",
							materialId: stock.materialId?.toString() || "",
							materialName: stock.materialName || "",
							colorId: stock.colorId?.toString() || "",
							colorName: stock.colorName || "",
							assistantStoneId: stock.assistantStoneId?.toString() || "",
							assistantStoneName: stock.assistantStoneName || "",
							assistantStone: stock.assistantStone || false,
							assistantStoneCreateAt:
								stock.assistantStoneCreateAt &&
								stock.assistantStoneCreateAt !== "null"
									? stock.assistantStoneCreateAt
									: "",
							mainStoneNote: stock.mainStoneNote || "",
							assistanceStoneNote: stock.assistanceStoneNote || "",
							productSize: stock.productSize || "",
							note: stock.note || "",
							productPrice: stock.productLaborCost,
							additionalProductPrice: stock.productAddLaborCost || 0,
							stonePurchasePrice: calculatedStoneData.purchaseStonePrice,
							mainStonePrice: calculatedStoneData.mainStonePrice,
							assistanceStonePrice: calculatedStoneData.assistanceStonePrice,
							stoneAddLaborCost: stock.stoneAddLaborCost || 0,
							stoneWeightTotal: stoneWeight,
							totalWeight: totalWeight,
							stoneWeight: stoneWeight,
							goldWeight: goldWeight,
							pureGoldWeight: pureGoldWeight,
							pricePerGram: 0,
							mainStoneCount: calculatedStoneData.mainStoneCount,
							assistanceStoneCount: calculatedStoneData.assistanceStoneCount,
							stoneInfos: stock.stoneInfos || [],
						};
					});

					setSaleRows(newRows);
				}
			}
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
		}
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
			.reduce((acc, row) => acc + row.productPrice + row.stonePurchasePrice, 0);

		const returnsTotalGold = saleRows
			.filter((row) => row.status === "반품")
			.reduce((acc, row) => acc + row.pureGoldWeight, 0);

		const dcTotalMoney = saleRows
			.filter((row) => row.status === "DC")
			.reduce((acc, row) => acc + row.productPrice + row.stonePurchasePrice, 0);

		const dcTotalGold = saleRows
			.filter((row) => row.status === "DC")
			.reduce((acc, row) => acc + row.pureGoldWeight, 0);

		const paymentTotalMoney = saleRows
			.filter((row) => row.status === "결제" || row.status === "결통")
			.reduce((acc, row) => acc + row.productPrice + row.stonePurchasePrice, 0);

		const paymentTotalGold = saleRows
			.filter((row) => row.status === "결제" || row.status === "결통")
			.reduce((acc, row) => acc + row.pureGoldWeight, 0);

		const wgTotalMoney = saleRows
			.filter((row) => row.status === "WG")
			.reduce(
				(acc, row) => acc + row.pureGoldWeight * saleOptions.marketPrice,
				0
			);

		setAccountBalanceHistory((prev) => ({
			...prev,
			salesGoldBalance: salesTotalGold,
			salesMoneyBalance: salesTotalMoney,
			returnsGoldBalance: returnsTotalGold,
			returnsMoneyBalance: returnsTotalMoney,
			dcGoldBalance: dcTotalGold,
			dcMoneyBalance: dcTotalMoney,
			paymentGoldBalance: paymentTotalGold,
			paymentMoneyBalance: paymentTotalMoney,
			previousGoldBalance: prev.previousGoldBalance,
			previousMoneyBalance: prev.previousMoneyBalance,
			afterGoldBalance:
				prev.previousGoldBalance +
				salesTotalGold -
				returnsTotalGold -
				dcTotalGold -
				paymentTotalGold,
			afterMoneyBalance:
				prev.previousMoneyBalance +
				salesTotalMoney -
				wgTotalMoney -
				returnsTotalMoney -
				dcTotalMoney -
				paymentTotalMoney,
		}));
	}, [saleRows, saleOptions.marketPrice]);

	// 재질 목록 로드
	useEffect(() => {
		const loadMaterials = async () => {
			try {
				const materialRes = await materialApi.getMaterials();
				let loadedMaterials: { materialId: string; materialName: string }[] =
					[];
				if (materialRes.success) {
					loadedMaterials = (materialRes.data || []).map((m) => ({
						materialId: m.materialId?.toString() || "",
						materialName: m.materialName,
					}));
					setMaterials(loadedMaterials);
				}
			} catch (err) {
				handleError(err);
			}
		};
		loadMaterials();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="sale-create-page">
			{/* 에러 메시지 */}
			{error && (
				<div className="error-message">
					<span>⚠️</span>
					<p>{error}</p>
				</div>
			)}

			<div className="sale-create-content">
				{/* 1. 상품 이미지 & 판매 옵션 & 금 거래 내역 (3분할 병렬 배치) */}
				<div className="sale-create-top-row">
					{/* 상품 이미지 */}
					<div className="product-image-section">
						<div className="product-image-placeholder">
							<p>상품 이미지</p>
						</div>
					</div>

					{/* 판매 옵션 */}
					<SaleOption
						options={saleOptions}
						onOptionChange={handleOptionChange}
						onCustomerSearchOpen={handleCustomerSearchOpen}
						disabled={loading}
						hasWGStatus={hasWGStatus}
						isStoreLoadedFromApi={isStoreLoadedFromApi}
					/>

					{/* 금 거래 내역 */}
					<AccountBalanceHistory
						history={accountBalanceHistoryData}
						disabled={loading}
					/>
				</div>

				{/* 과거 매출 거래 내역 */}
				<PastOrderHistory pastOrders={currentDisplayedPastOrders} maxRows={4} />

				{/* 판매 테이블 */}
				<SaleTable
					rows={saleRows}
					loading={loading}
					onRowUpdate={handleRowUpdate}
					onRowDelete={handleRowDelete}
					onFlowCodeSearch={handleFlowCodeSearch}
					onRowFocus={handleRowFocus}
					disabled={loading}
					materials={materials}
					assistantStones={assistantStones}
					onStoneInfoOpen={openStoneInfoManager}
					onAssistanceStoneArrivalChange={handleAssistanceStoneArrivalChange}
					storeId={saleOptions.storeId}
					storeName={saleOptions.storeName}
				/>

				{/* 버튼 영역 */}
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
						{loading ? "등록 중..." : "등록"}
					</button>
				</div>
			</div>

			{/* 거래처 검색 모달 */}
			{showStoreSearch && (
				<StoreSearch
					onSelectStore={handleStoreSelect}
					onClose={handleStoreSearchClose}
					useAttemptApi={true}
				/>
			)}
		</div>
	);
};

export default SaleCreatePage;
