import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { priorityApi } from "../../../libs/api/priority";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { storeApi } from "../../../libs/api/store";
import { useErrorHandler } from "../../utils/errorHandler";
import {
	addBusinessDays,
	formatDateToString,
	formatToLocalDate,
	getLocalDate,
} from "../../utils/dateUtils";
import type {
	OrderRowData,
	OrderResponseDetail,
	StoneInfo,
	OrderRequestDetail,
} from "../../types/order";
import StoreSearch from "../../components/common/store/StoreSearch";
import FactorySearch from "../../components/common/factory/FactorySearch";
import ProductSearch from "../../components/common/product/ProductSearch";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto } from "../../types/store";
import type { ProductDto } from "../../types/product";
import OrderTable from "../../components/common/order/OrderTable";
import "../../styles/pages/OrderCreatePage.css";

const POPUP_ORIGIN = window.location.origin;

const calculateStoneDetails = (stoneInfos: StoneInfo[]) => {
	const details = {
		mainStonePrice: 0,
		assistanceStonePrice: 0,
		additionalStonePrice: 0,
		mainStoneCount: 0,
		assistanceStoneCount: 0,
		stoneWeightTotal: 0,
	};
	if (!stoneInfos) return details;
	stoneInfos.forEach((stone) => {
		const quantity = stone.quantity || 0,
			weight = stone.stoneWeight || 0,
			laborCost = stone.laborCost || 0;
		if (stone.includeStone) {
			details.stoneWeightTotal += Number(weight) * Number(quantity);
			if (stone.mainStone) {
				details.mainStoneCount += quantity;
				details.mainStonePrice += laborCost * quantity;
			} else {
				details.assistanceStoneCount += quantity;
				details.assistanceStonePrice += laborCost * quantity;
			}
		}
	});
	return details;
};

const convertToOrderRowData = (
	detail: OrderResponseDetail,
	grade: string,
	materials: { materialId: string; materialName: string }[],
	colors: { colorId: string; colorName: string }[],
	priorities: { priorityName: string; priorityDate: number }[]
): OrderRowData => {
	const calculatedStoneData = calculateStoneDetails(detail.stoneInfos);
	const foundMaterial = materials.find(
		(m) => m.materialName === detail.materialName
	);
	const foundColor = colors.find((c) => c.colorName === detail.colorName);
	const foundPriority = priorities.find(
		(p) => p.priorityName === detail.priority
	);
	let deliveryDate = detail.createAt;
	if (foundPriority && detail.createAt) {
		deliveryDate = formatDateToString(
			addBusinessDays(detail.createAt, foundPriority.priorityDate)
		);
	}
	const baseRowData: Omit<OrderRowData, keyof typeof calculatedStoneData> = {
		id: detail.flowCode,
		storeId: detail.storeId,
		storeName: detail.storeName,
		grade: grade,
		productId: detail.productId,
		productName: detail.productName,
		classificationName: detail.classification,
		materialId: foundMaterial?.materialId || "",
		materialName: detail.materialName,
		colorId: foundColor?.colorId || "",
		colorName: detail.colorName,
		setTypeName: detail.setType,
		factoryId: detail.factoryId,
		factoryName: detail.factoryName,
		productSize: detail.productSize,
		orderNote: detail.orderNote,
		mainStoneNote: detail.mainStoneNote,
		assistanceStoneNote: detail.assistanceStoneNote,
		priorityName: detail.priority,
		stoneInfos: detail.stoneInfos || [],
		createAt: formatToLocalDate(detail.createAt),
		shippingAt: deliveryDate,
		assistantStone: detail.assistantStone || false,
		assistantStoneId: 0,
		assistantStoneName: detail.assistantStoneName || "",
		assistantStoneCreateAt: detail.assistantStoneCreateAt || "",
		mainPrice: 0,
		additionalPrice: 0,
		stoneWeight: 0,
		productAddLaborCost: 0,
		isProductWeightSale: false,
	};
	return { ...baseRowData, ...calculatedStoneData };
};

const StockRegisterPage: React.FC = () => {
	const [searchParams] = useSearchParams();
	const { handleError } = useErrorHandler();

	// 1. 상태: 단일 객체/값에서 배열 또는 Map 형태로 변경
	const [orderRows, setOrderRows] = useState<OrderRowData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	// 드롭다운 데이터 (한 번만 로드하면 됨)
	const [materials, setMaterials] = useState<
		{ materialId: string; materialName: string }[]
	>([]);
	const [colors, setColors] = useState<
		{ colorId: string; colorName: string }[]
	>([]);
	const [priorities, setPriorities] = useState<
		{ priorityName: string; priorityDate: number }[]
	>([]);
	const [assistantStones, setAssistantStones] = useState<
		{ assistantStoneId: number; assistantStoneName: string }[]
	>([]);
	const popupMapRef = useRef<{ [key: string]: Window }>({});

	const [isStoreSearchOpen, setIsStoreSearchOpen] = useState(false);
	const [selectedRowForStore, setSelectedRowForStore] = useState<string>("");
	const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);
	const [selectedRowForFactory, setSelectedRowForFactory] =
		useState<string>("");
	const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
	const [selectedRowForProduct, setSelectedRowForProduct] =
		useState<string>("");
	const [storeGrade, setStoreGrade] = useState<string>("");

	const currentDate = getLocalDate();

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

	// 2. 데이터 로딩: URL에서 ID들을 읽어와 모든 주문 정보를 병렬로 가져옴
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
				// 드롭다운 데이터와 주문 상세 정보들을 모두 병렬로 요청
				const [
					materialRes,
					colorRes,
					priorityRes,
					assistantStoneRes,
					...orderResponses
				] = await Promise.all([
					materialApi.getMaterials(),
					colorApi.getColors(),
					priorityApi.getPriorities(),
					assistantStoneApi.getAssistantStones(),
					...ids.map((id) => orderApi.getOrder(id)),
				]);

				// 드롭다운 데이터 저장
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
				const loadedPriorities = priorityRes.success
					? (priorityRes.data || []).map((p) => ({
							priorityName: p.priorityName,
							priorityDate: p.priorityDate,
					  }))
					: [];
				const loadedAssistantStones = assistantStoneRes.success
					? (assistantStoneRes.data || []).map((a) => ({
							assistantStoneId: a.assistantStoneId,
							assistantStoneName: a.assistantStoneName,
					  }))
					: [];
				setMaterials(loadedMaterials);
				setColors(loadedColors);
				setPriorities(loadedPriorities);
				setAssistantStones(loadedAssistantStones);

				// 주문 상세 정보들을 OrderRowData로 변환
				const fetchedOrderDetails = orderResponses
					.filter((res) => res.success && res.data)
					.map((res) => res.data as OrderResponseDetail);

				// 각 주문의 등급(grade) 정보도 병렬로 가져오기
				const gradePromises = fetchedOrderDetails.map((detail) =>
					storeApi.getStoreGrade(detail.storeId)
				);
				const gradeResults = await Promise.all(gradePromises);
				const grades = gradeResults.map((res) => res.data);

				const allRows = fetchedOrderDetails.map((detail, index) =>
					convertToOrderRowData(
						detail,
						grades[index] ?? "1",
						loadedMaterials,
						loadedColors,
						loadedPriorities
					)
				);

				setOrderRows(allRows);
			} catch (err) {
				handleError(err, setError);
			} finally {
				setLoading(false);
			}
		};

		loadAllData();
	}, [searchParams, handleError]);

	// 3. Row 업데이트: 특정 주문 Row의 특정 필드만 업데이트 (기존 로직과 동일)
	const onRowUpdate = (
		id: string,
		field: keyof OrderRowData,
		value: unknown
	) => {
		setOrderRows((prevRows) =>
			prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
		);
	};

	// 4. 저장 핸들러: 변경된 모든 주문 데이터를 한 번에 서버로 전송
	const handleSave = async () => {
		if (orderRows.length === 0) {
			alert("저장할 정보가 없습니다.");
			return;
		}

		if (
			!window.confirm(
				`총 ${orderRows.length}개의 주문을 일괄 재고 등록하시겠습니까?`
			)
		) {
			return;
		}

		setLoading(true);
		try {
			const savePromises = orderRows.map((row) => {
				const orderUpdateData: Partial<OrderRequestDetail> = {
					/* 재고 등록에 필요한 데이터만 포함 */
				};
				return orderApi.updateStockRegister(row.id, "STOCK", orderUpdateData); // 예시 API 호출
			});

			await Promise.all(savePromises);

			alert(
				`총 ${orderRows.length}개의 주문이 성공적으로 재고 등록되었습니다.`
			);
			// 부모창에 완료 메시지를 보내고 스스로 닫기
			if (window.opener) {
				window.opener.postMessage(
					{ type: "STOCK_REGISTERED" },
					window.location.origin
				);
			}
			window.close();
		} catch (err) {
			handleError(err, setError);
			alert("일괄 재고 등록에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="loading-container">
				<div className="spinner"></div>
				<p>주문 정보를 불러오는 중...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="error-message">
				<span>⚠️</span>
				<p>{error}</p>
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

	const handleStoreSearchOpen = (rowId: string) => {
		setSelectedRowForStore(rowId);
		setIsStoreSearchOpen(true);
	};

	const handleProductSearchOpen = (rowId: string) => {
		setSelectedRowForProduct(rowId);
		setIsProductSearchOpen(true);
	};

	const handleFactorySearchOpen = (rowId: string) => {
		setSelectedRowForFactory(rowId);
		setIsFactoryModalOpen(true);
	};

	// 스톤 정보 관리 모달 열기
	const openStoneInfoManager = (rowId: string) => {
		const url = `/orders/stone-info?rowId=${rowId}&origin=${POPUP_ORIGIN}`;
		const NAME = `stoneInfo_${rowId}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=1200,height=400";

		const popup = window.open(url, NAME, FEATURES);
		if (popup) {
			popupMapRef.current[rowId] = popup; // ref에 팝업 참조 저장
			popup.focus();
		} else {
			alert("팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.");
		}
	};

	return (
		<div className="order-update-page">
			<div className="page-header">
				<h3>일괄 재고 등록</h3>
				<p>총 {orderRows.length}개의 주문을 등록합니다.</p>
			</div>

			{/* 5. UI 렌더링: 가져온 주문 개수만큼 OrderTable을 반복하여 표시 */}
			<div className="bulk-order-item">
				<OrderTable
					mode="update"
					orderRows={orderRows} // 👈 전체 주문 데이터(배열)를 그대로 전달
					loading={loading}
					materials={materials}
					colors={colors}
					priorities={priorities}
					assistantStones={assistantStones}
					onRowUpdate={onRowUpdate}
					onAssistanceStoneArrivalChange={handleAssistanceStoneArrivalChange}
					onStoreSearchOpen={handleStoreSearchOpen}
					onProductSearchOpen={handleProductSearchOpen}
					onFactorySearchOpen={handleFactorySearchOpen}
					onStoneInfoOpen={openStoneInfoManager}
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
					{loading ? "저장 중..." : `전체 ${orderRows.length}개 등록`}
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
