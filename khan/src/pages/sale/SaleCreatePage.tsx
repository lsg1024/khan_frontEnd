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
	calculatePureGoldWeightWithHarry,
	calculatePureGoldWeight,
} from "../../utils/goldUtils";
import { handleApiSubmit } from "../../utils/apiSubmitHandler";
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
	const [isMarketPriceLocked, setIsMarketPriceLocked] =
		useState<boolean>(false);

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
			pureGoldConversion: 0,
			marketPriceConversion: 0,
			wgConversion: 0,
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

	// 안전한 숫자 변환 헬퍼 함수 (음수 허용)
	const getSafeNumber = (value: string): number => {
		// 빈 값이거나 단독 '-'인 경우만 0으로 처리
		if (!value || value === "" || value === "-") return 0;
		const num = parseFloat(value);
		return isNaN(num) ? 0 : num;
	};

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
		const isStoreReceivable = (
			s: StoreSearchDto | AccountInfoDto
		): s is AccountInfoDto => {
			return "goldWeight" in s && "moneyAmount" in s;
		};

		const storeIdString = String(store.accountId || "");

		// AccountInfoDto (미수 정보 포함)인 경우
		if (isStoreReceivable(store)) {
			setSaleOptions((prev) => ({
				...prev,
				storeId: storeIdString,
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
		}
		// StoreSearchDto (기본 정보만)인 경우
		else {
			setSaleOptions((prev) => ({
				...prev,
				storeId: storeIdString,
				storeName: store.accountName,
				grade: store.grade || "",
				harry: store.goldHarryLoss || "",
				moneyAmount: 0,
				goldWeight: "",
			}));

			// 미수금 정보를 별도로 조회
			try {
				const storeId = String(store.accountId);
				if (storeId) {
					const receivableRes = await storeApi.getStoreReceivableById(storeId);
					if (receivableRes.success && receivableRes.data) {
						const attemptData = receivableRes.data;
						setSaleOptions((prev) => ({
							...prev,
							moneyAmount: parseFloat(attemptData.moneyAmount) || 0,
							goldWeight: attemptData.goldWeight || "",
						}));
						setAccountBalanceHistory((prev) => ({
							...prev,
							previousMoneyBalance: parseFloat(attemptData.moneyAmount) || 0,
							previousGoldBalance: parseFloat(attemptData.goldWeight) || 0,
						}));
					}
				}
			} catch (err) {
				console.error("거래처 미수 정보 조회 실패:", err);
			}
		}

		// 모든 판매 행의 storeId를 선택한 거래처 ID로 업데이트
		setSaleRows((prev) =>
			prev.map((row) => ({
				...row,
				storeId: storeIdString,
			}))
		);

		setShowStoreSearch(false);

		if (store.accountId) {
			const shouldAppend = await checkAndConfirmExistingSale(
				String(store.accountId)
			);
			setIsAppendSale(shouldAppend);
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
				// marketPrice 초기화
				setSaleOptions((prev) => ({
					...prev,
					marketPrice: 0,
				}));
				setIsMarketPriceLocked(false);
				return false;
			}

			const checkResponse = await saleApi.checkBeforeSale(accountId);

			if (checkResponse.success && checkResponse.data?.saleCode) {
				const existingSaleCode = checkResponse.data.saleCode;
				const existingGoldPrice = checkResponse.data.accountGoldPrice;

				if (existingSaleCode) {
					const shouldAdd = window.confirm(
						`오늘 등록된 판매장이 있습니다.\n해당 판매장에 추가하시겠습니까?`
					);

					if (shouldAdd) {
						// 기존 판매장에 추가하는 경우
						if (existingGoldPrice !== null && existingGoldPrice !== undefined) {
							// accountGoldPrice가 존재하면 marketPrice에 자동 주입
							setSaleOptions((prev) => ({
								...prev,
								marketPrice: existingGoldPrice,
							}));
							setIsMarketPriceLocked(true);
						} else {
							// accountGoldPrice가 없으면 marketPrice 초기화
							setSaleOptions((prev) => ({
								...prev,
								marketPrice: 0,
							}));
							setIsMarketPriceLocked(false);
						}
						return false; // 기존 판매장에 추가
					} else {
						// 새로 판매장 생성 - marketPrice 초기화
						setSaleOptions((prev) => ({
							...prev,
							marketPrice: 0,
						}));
						setIsMarketPriceLocked(false);
						return true;
					}
				}
			}

			// checkResponse에 saleCode가 없는 경우 (첫 거래) - marketPrice 초기화
			setSaleOptions((prev) => ({
				...prev,
				marketPrice: 0,
			}));
			setIsMarketPriceLocked(false);
		} catch (err) {
			console.error("판매장 확인 실패:", err);
			// 에러 발생 시에도 marketPrice 초기화
			setSaleOptions((prev) => ({
				...prev,
				marketPrice: 0,
			}));
			setIsMarketPriceLocked(false);
		}
		return false;
	};

	// 시리얼(재고) 검색 모달 열기
	const handleFlowCodeSearch = (rowId: string) => {
		// 거래처가 선택되지 않았으면 경고
		if (!saleOptions.storeId || !saleOptions.storeName) {
			alert("거래처를 먼저 선택해주세요.");
			return;
		}

		const url = `/sales/stock-search?storeName=${encodeURIComponent(
			saleOptions.storeName
		)}&rowId=${rowId}&origin=${window.location.origin}`;
		const NAME = `stockSearch_${rowId}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1400,height=700";

		window.open(url, NAME, FEATURES);
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
					// status 변경 시 순금 중량 재계산 (모든 경우에 해리 적용)
					updatedRow.pureGoldWeight = calculatePureGoldWeightWithHarry(
						row.goldWeight,
						row.materialName,
						saleOptions.harry
					);
				}

				// totalWeight가 변경되면 goldWeight 계산 (총중량 - 알중량)
				if (field === "totalWeight") {
					const totalWeight = getSafeNumber(String(value));
					const stoneWeight = getSafeNumber(String(row.stoneWeight));
					const goldWeight = totalWeight - stoneWeight;

					// 소수점 3자리에서 올림 처리
					updatedRow.goldWeight = Math.ceil(goldWeight * 1000) / 1000;
					// 판매일 때만 해리 적용
					if (row.status === "판매") {
						updatedRow.pureGoldWeight = calculatePureGoldWeightWithHarry(
							updatedRow.goldWeight,
							row.materialName,
							saleOptions.harry
						);
					} else {
						updatedRow.pureGoldWeight = calculatePureGoldWeight(
							updatedRow.goldWeight,
							row.materialName
						);
					}
				} // stoneWeight가 변경되면 goldWeight 재계산
				if (field === "stoneWeight") {
					const stoneWeight = getSafeNumber(String(value));
					const totalWeight = getSafeNumber(String(row.totalWeight));
					const goldWeight = totalWeight - stoneWeight;

					// 소수점 3자리에서 올림 처리
					updatedRow.goldWeight = Math.ceil(goldWeight * 1000) / 1000;
					// 판매일 때만 해리 적용
					if (row.status === "판매") {
						updatedRow.pureGoldWeight = calculatePureGoldWeightWithHarry(
							updatedRow.goldWeight,
							row.materialName,
							saleOptions.harry
						);
					} else {
						updatedRow.pureGoldWeight = calculatePureGoldWeight(
							updatedRow.goldWeight,
							row.materialName
						);
					}
				}

				// goldWeight 또는 materialName이 변경되면 순금 중량 재계산
				if (field === "goldWeight" || field === "materialName") {
					const goldWeight =
						field === "goldWeight"
							? Math.ceil((parseFloat(String(value)) || 0) * 1000) / 1000 // 음수 허용, 소수점 3자리 올림
							: row.goldWeight;
					const materialName =
						field === "materialName" ? String(value) : row.materialName;

					// goldWeight 직접 변경 시 updatedRow에 반영
					if (field === "goldWeight") {
						updatedRow.goldWeight = goldWeight;
					}

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
							assistantStone: value === "Y",
							assistantStoneCreateAt: value === "Y" ? getLocalDate() : "",
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
			pureGoldConversion: 0,
			marketPriceConversion: 0,
			wgConversion: 0,
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

			// 유효한 행 필터링: 재질과 (금중량 또는 금액)이 있어야 함
			const validRows = saleRows.filter((row) => {
				// "판매" 상태는 flowCode 필수
				if (row.status === "판매") {
					return row.flowCode && row.materialName;
				}

				return (row.materialName && row.goldWeight > 0) || row.productPrice > 0;
			});


			if (validRows.length === 0) {
				setError("처리할 유효한 판매 항목이 없습니다.");
				return;
			}

			// 각 행을 status에 따라 개별 API 호출
			const results = await Promise.all(
				validRows.map(async (row) => {
					try {
						let response;

						// 1. "판매" 상태: flowCode 기반 판매 등록
						if (row.status === "판매") {
							if (source === "order") {
								// 주문에서 판매 등록
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
								// 재고에서 판매 등록 (기본값)
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
									assistantStoneName: row.assistantStoneName,
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
						}
						// 2. 결제, DC, WG, 결통 상태: 결제 처리
						else if (["결제", "DC", "WG", "결통"].includes(row.status)) {
							const paymentData: SalePaymentRequest = {
                                accountGoldPrice: saleOptions.marketPrice,
								id: row.flowCode
									? parseInt(row.flowCode) || 0
									: parseInt(saleOptions.storeId) || 0,
								name: saleOptions.storeName,
								harry: saleOptions.harry,
								grade: saleOptions.grade,
								orderStatus: row.status,
								material: row.materialName,
								note: row.note,
								goldWeight: Math.abs(
									getSafeNumber(String(row.goldWeight))
								).toString(),
								payAmount: Math.abs(getSafeNumber(String(row.productPrice))),
							};

							response = await saleApi.createPaymentSale(
								paymentData,
								isAppendSale
							);
						}
						// 3. 반품 등 기타 상태
						else {
							const paymentData: SalePaymentRequest = {
                                accountGoldPrice: saleOptions.marketPrice,
								id: parseInt(saleOptions.storeId) || 0,
								name: saleOptions.storeName,
								harry: saleOptions.harry,
								grade: saleOptions.grade,
								orderStatus: row.status,
								material: row.materialName,
								note: row.note,
								goldWeight: Math.abs(
									getSafeNumber(String(row.goldWeight))
								).toString(),
								payAmount: Math.abs(getSafeNumber(String(row.productPrice))),
							};

							response = await saleApi.createPaymentSale(
								paymentData,
								isAppendSale
							);
						}

						return {
							success: response.success,
							identifier: row.flowCode || row.productName || `행 ${row.id}`,
						};
					} catch (error) {
						console.error(`판매 등록 실패 (${row.flowCode || row.id}):`, error);
						return {
							success: false,
							identifier: row.flowCode || row.productName || `행 ${row.id}`,
						};
					}
				})
			);

			// API 응답을 ApiResponse 형식으로 변환
			const apiResponses = results.map((r) => ({
				success: r.success,
				message: r.success ? "OK" : "Failed",
				data: r.identifier,
			}));

			await handleApiSubmit({
				promises: apiResponses.map((r) => Promise.resolve(r)),
				successMessage: `${validRows.length}개의 판매가 성공적으로 등록되었습니다.`,
				failureMessage: "일부 항목의 판매 등록에 실패했습니다.",
				parentMessageType: "SALES_REGISTERED",
				parentMessageData: { success: true },
				logMessage: "판매 등록",
			});

			// 초기화
			resetForm();
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

		// 재고 선택 메시지 리스너 추가
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			// 재고 검색 팝업에서 재고 선택 시
			if (event.data.type === "STOCK_SELECTED") {
				const { rowId, stockData } = event.data;

				// 현재 saleRows 상태를 직접 참조하여 중복 체크
				setSaleRows((currentRows) => {
					const isDuplicate = currentRows.some(
						(row) => row.id !== rowId && row.flowCode === stockData.flowCode
					);

					if (isDuplicate) {
						alert("이미 선택된 재고 상품입니다.");
						// 중복이어도 팝업은 닫기
						if (event.source && "postMessage" in event.source) {
							(event.source as Window).postMessage(
								{ type: "CLOSE_POPUP" },
								window.location.origin
							);
						}
						return currentRows; // 데이터 반영하지 않음
					}

					// 재고 데이터를 판매 행에 직접 채우기
					const updatedRows = currentRows.map((row) => {
						if (row.id !== rowId) return row;

						// 금중량, 알중량 계산
						const goldWeight = parseFloat(stockData.goldWeight || "0");
						const stoneWeight = parseFloat(stockData.stoneWeight || "0");
						const totalWeight = goldWeight + stoneWeight;

						// 순금 중량 계산 (판매이므로 해리 적용)
						const pureGoldWeight = calculatePureGoldWeightWithHarry(
							goldWeight,
							stockData.materialName || "",
							saleOptions.harry
						);

						return {
							...row,
							flowCode: stockData.flowCode,
							storeId: saleOptions.storeId,
							productId: stockData.productId?.toString() || "",
							productName: stockData.productName || "",
							materialId: stockData.materialId?.toString() || "",
							materialName: stockData.materialName || "",
							colorId: stockData.colorId?.toString() || "",
							colorName: stockData.colorName || "",
							productSize: stockData.productSize || "",
							goldWeight: goldWeight,
							stoneWeight: stoneWeight,
							totalWeight: totalWeight,
							pureGoldWeight: pureGoldWeight,
							mainStoneNote: stockData.mainStoneNote || "",
							assistanceStoneNote: stockData.assistanceStoneNote || "",
							assistantStoneId: stockData.assistantStoneId?.toString() || "",
							assistantStoneName: stockData.assistantStoneName || "",
							assistantStone: stockData.assistantStone || false,
							assistantStoneCreateAt: stockData.assistantStoneCreateAt || "",
							productPrice: stockData.productLaborCost || 0,
							additionalProductPrice: stockData.productAddLaborCost || 0,
							mainStonePrice: stockData.mainStoneLaborCost || 0,
							assistanceStonePrice: stockData.assistanceStoneLaborCost || 0,
							stoneAddLaborCost: stockData.stoneAddLaborCost || 0,
							stoneWeightTotal: stoneWeight,
							stoneInfos: stockData.stoneInfos || [],
							mainStoneCount: stockData.mainStoneQuantity || 0,
							assistanceStoneCount: stockData.assistanceStoneQuantity || 0,
						};
					});

					// 성공 시 팝업 닫기
					if (event.source && "postMessage" in event.source) {
						(event.source as Window).postMessage(
							{ type: "CLOSE_POPUP" },
							window.location.origin
						);
					}

					return updatedRows;
				});
			}
		};

		window.addEventListener("message", handleMessage);
		return () => {
			window.removeEventListener("message", handleMessage);
		};
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

						const shouldAppend = await checkAndConfirmExistingSale(
							String(firstItem.storeId)
						);
						setIsAppendSale(shouldAppend);

						try {
							const storeAttemptRes = await storeApi.getStoreReceivableById(
								firstItem.storeId
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
							const storeAttemptRes = await storeApi.getStoreReceivableById(
								firstItem.storeId
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
		// [수정] 모든 계산에 getSafeNumber 적용

		// 구분에 따라 판매, 반품, DC, 결제 값 계산
		const salesTotalMoney = saleRows
			.filter((row) => row.status === "판매")
			.reduce(
				(acc, row) =>
					acc +
					getSafeNumber(String(row.productPrice)) +
					getSafeNumber(String(row.additionalProductPrice)) +
					getSafeNumber(String(row.mainStonePrice)) +
					getSafeNumber(String(row.assistanceStonePrice)) +
					getSafeNumber(String(row.stoneAddLaborCost)),
				0
			);

		const salesTotalGold = saleRows
			.filter((row) => row.status === "판매")
			.reduce((acc, row) => acc + getSafeNumber(String(row.pureGoldWeight)), 0);

		const returnsTotalMoney = saleRows
			.filter((row) => row.status === "반품")
			.reduce(
				(acc, row) =>
					acc +
					getSafeNumber(String(row.productPrice)) +
					getSafeNumber(String(row.stonePurchasePrice)),
				0
			);

		const returnsTotalGold = saleRows
			.filter((row) => row.status === "반품")
			.reduce((acc, row) => acc + getSafeNumber(String(row.pureGoldWeight)), 0);

		const dcTotalMoney = saleRows
			.filter((row) => row.status === "DC")
			.reduce(
				(acc, row) =>
					acc +
					getSafeNumber(String(row.productPrice)) +
					getSafeNumber(String(row.stonePurchasePrice)),
				0
			);

		const dcTotalGold = saleRows
			.filter((row) => row.status === "DC")
			.reduce((acc, row) => acc + getSafeNumber(String(row.pureGoldWeight)), 0);

		const paymentTotalMoney = saleRows
			.filter((row) => row.status === "결제" || row.status === "결통")
			.reduce(
				(acc, row) =>
					acc +
					getSafeNumber(String(row.productPrice)) +
					getSafeNumber(String(row.stonePurchasePrice)),
				0
			);

		const paymentTotalGold = saleRows
			.filter((row) => row.status === "결제" || row.status === "결통")
			.reduce((acc, row) => acc + getSafeNumber(String(row.pureGoldWeight)), 0);

		// WG: 입력된 금액을 시세로 나눠서 중량 계산
		const wgTotalMoney = saleRows
			.filter((row) => row.status === "WG")
			.reduce((acc, row) => acc + getSafeNumber(String(row.productPrice)), 0);

		// WG 순금 환산: 입력된 금액 / 시세 (순금 g)
		const rawConversion =
			saleOptions.marketPrice > 0 ? wgTotalMoney / saleOptions.marketPrice : 0;
		const wgPureGoldConversion = Math.round(rawConversion * 1000) / 1000;

		// WG 시세 환산과 WG 환산: 순금 환산 * 시세
		const wgMarketPriceConversion =
			wgPureGoldConversion * saleOptions.marketPrice;
		const wgConversionValue = wgPureGoldConversion * saleOptions.marketPrice;

		// 금 거래 내역 상태 업데이트
		setAccountBalanceHistory((prev) => ({
			...prev,
			salesGoldBalance: salesTotalGold,
			salesMoneyBalance: salesTotalMoney,
			returnsGoldBalance: returnsTotalGold,
			returnsMoneyBalance: returnsTotalMoney,
			dcGoldBalance: dcTotalGold,
			dcMoneyBalance: dcTotalMoney,
			paymentGoldBalance: paymentTotalGold + wgPureGoldConversion,
			paymentMoneyBalance: paymentTotalMoney,
			previousGoldBalance: prev.previousGoldBalance,
			previousMoneyBalance: prev.previousMoneyBalance,
			pureGoldConversion: wgPureGoldConversion,
			marketPriceConversion: wgMarketPriceConversion,
			wgConversion: wgConversionValue,
			afterGoldBalance:
				prev.previousGoldBalance +
				salesTotalGold -
				returnsTotalGold -
				dcTotalGold -
				paymentTotalGold -
				wgPureGoldConversion,
			afterMoneyBalance:
				prev.previousMoneyBalance +
				salesTotalMoney -
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
						isMarketPriceLocked={isMarketPriceLocked}
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
					useReceivableApi={false}
				/>
			)}
		</div>
	);
};

export default SaleCreatePage;
