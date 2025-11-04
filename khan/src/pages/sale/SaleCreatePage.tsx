import { useState, useEffect } from "react";
import { getLocalDate } from "../../utils/dateUtils";
import { useErrorHandler } from "../../utils/errorHandler";
import type {
	SaleOptionData,
	GoldHistoryData,
	SaleCreateRow,
} from "../../types/sale";
import type { StoreSearchDto } from "../../types/store";
import type { PastOrderDto } from "../../types/order";
import SaleOption from "../../components/common/sale/SaleOption";
import GoldHistory from "../../components/common/sale/GoldHistory";
import SaleTable from "../../components/common/sale/SaleTable";
import StoreSearch from "../../components/common/store/StoreSearch";
import PastOrderHistory from "../../components/common/PastOrderHistory";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { orderApi } from "../../../libs/api/order";
import { materialApi } from "../../../libs/api/material";
import "../../styles/pages/sale/SaleCreatePage.css";

export const SaleCreatePage = () => {
	const { handleError } = useErrorHandler();
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const [showStoreSearch, setShowStoreSearch] = useState<boolean>(false);
	const [assistantStones, setAssistantStones] = useState<
		{ assistantStoneId: string; assistantStoneName: string }[]
	>([]);
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

	// 판매 옵션 상태
	const [saleOptions, setSaleOptions] = useState<SaleOptionData>({
		storeName: "",
		storeId: "",
		tradeDate: getLocalDate(),
		marketPrice: 0,
		customerName: "",
		customerId: "",
		saleCode: "", // 자동 생성
		tradeType: "중량",
		grade: "",
		appliedHarry: "",
	});

	// 금 거래 내역 상태
	const [goldHistory, setGoldHistory] = useState<GoldHistoryData>({
		pureGold: 0,
		goldAmount: 0,
		totalPreviousBalance: 0,
		previousBalance: 0,
		sales: 0,
		returns: 0,
		dc: 0,
		payment: 0,
		afterBalance: 0,
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
			colorName: "",
			hasStone: false,
			assistantStoneId: "",
			assistantStoneName: "",
			hasAssistantStone: false,
			assistantStoneArrivalDate: "",
			mainStoneNote: "",
			assistantStoneNote: "",
			productSize: "",
			note: "",
			quantity: 1,
			unitPrice: 0,
			productPrice: 0,
			additionalProductPrice: 0,
			assistantStonePrice: 0,
			additionalStonePrice: 0,
			stoneWeightPerUnit: 0,
			totalWeight: 0,
			stoneWeight: 0,
			goldWeight: 0,
			pureGoldWeight: 0,
			pricePerGram: 0,
			stoneCountPerUnit: 0,
			mainStoneCount: 0,
			assistantStoneCount: 0,
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
	const handleStoreSelect = (store: StoreSearchDto) => {
		setSaleOptions((prev) => ({
			...prev,
			customerId: String(store.storeId || ""),
			customerName: store.storeName,
			grade: store.level || "",
			appliedHarry: store.goldHarryLoss || "",
		}));
		setShowStoreSearch(false);
	};

	// 거래처 검색 모달 닫기
	const handleStoreSearchClose = () => {
		setShowStoreSearch(false);
	};

	// 시리얼(재고) 검색 모달 열기
	const handleFlowCodeSearch = (rowId: string) => {
		// TODO: 재고 검색 모달 구현
		console.log("시리얼 검색 모달 열기", rowId);
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

				// storeId, productId, materialName 중 하나가 변경되면 과거 거래내역 조회
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

	// 등록 핸들러
	const handleSubmit = async () => {
		try {
			setLoading(true);
			setError("");

			if (!saleOptions.storeId) {
				setError("매장을 선택해주세요.");
				return;
			}

			if (!saleOptions.customerId) {
				setError("거래처를 선택해주세요.");
				return;
			}

			if (saleRows.length === 0) {
				setError("최소 1개 이상의 판매 항목을 추가해주세요.");
				return;
			}

			// TODO: API 호출
			console.log("판매 등록:", {
				options: saleOptions,
				history: goldHistory,
				rows: saleRows,
			});

			alert("판매 등록이 완료되었습니다.");
			window.close();
		} catch (err) {
			console.error("판매 등록 실패:", err);
			setError("판매 등록에 실패했습니다.");
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

	// 거래처 선택 시 해리와 등급은 자동으로 설정됨 (handleStoreSelect에서 처리)

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
				let loadedAssistantStones: {
					assistantStoneId: string;
					assistantStoneName: string;
				}[] = [];

				if (assistantStoneRes.success) {
					loadedAssistantStones = (assistantStoneRes.data || []).map((a) => ({
						assistantStoneId: a.assistantStoneId.toString(),
						assistantStoneName: a.assistantStoneName,
					}));
					setAssistantStones(loadedAssistantStones);
				}
			} catch (err) {
				console.error("보조석 목록 로드 실패:", err);
			}
		};

		loadAssistantStones();
	}, []);

	// 판매 행 변경 시 금 거래 내역 자동 계산
	useEffect(() => {
		// TODO: 구분에 따라 판매, 반품, DC, 결제 값 계산
		const salesTotal = saleRows
			.filter((row) => row.status === "판매")
			.reduce((acc, row) => acc + row.productPrice, 0);

		const returnsTotal = saleRows
			.filter((row) => row.status === "반품")
			.reduce((acc, row) => acc + row.productPrice, 0);

		const dcTotal = saleRows
			.filter((row) => row.status === "DC")
			.reduce((acc, row) => acc + row.productPrice, 0);

		const paymentTotal = saleRows
			.filter((row) => row.status === "결제" || row.status === "결통")
			.reduce((acc, row) => acc + row.productPrice, 0);

		setGoldHistory((prev) => ({
			...prev,
			sales: salesTotal,
			returns: returnsTotal,
			dc: dcTotal,
			payment: paymentTotal,
			afterBalance:
				prev.totalPreviousBalance +
				salesTotal -
				returnsTotal -
				dcTotal -
				paymentTotal,
		}));

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
				handleError(err, setError);
			} finally {
				setLoading(false);
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
					/>

					{/* 금 거래 내역 */}
					<GoldHistory history={goldHistory} disabled={loading} />
				</div>

				{/* 1.5. 과거 매출 거래 내역 */}
				<PastOrderHistory pastOrders={currentDisplayedPastOrders} maxRows={4} />

				{/* 2. 판매 테이블 */}
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
					onAssistanceStoneArrivalChange={handleAssistanceStoneArrivalChange}
				/>

				{/* 3. 버튼 영역 (최하단) */}
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
				/>
			)}
		</div>
	);
};

export default SaleCreatePage;
