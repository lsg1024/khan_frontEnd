import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { storeApi } from "../../../libs/api/store";
import { priorityApi } from "../../../libs/api/priority";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { useErrorHandler } from "../../utils/errorHandler";
import {
	addBusinessDays,
	formatDateToString,
	formatToLocalDate,
} from "../../utils/dateUtils";
import type {
	OrderRowData,
	OrderResponseDetail,
	StoneInfo,
	OrderRequestDetail,
} from "../../types/order";
import OrderTable from "../../components/common/order/OrderTable";
import StoreSearch from "../../components/common/store/StoreSearch";
import FactorySearch from "../../components/common/factory/FactorySearch";
import ProductSearch from "../../components/common/product/ProductSearch";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto } from "../../types/store";
import type { ProductDto } from "../../types/product";
import "../../styles/pages/OrderCreatePage.css";

const POPUP_ORIGIN = window.location.origin;

// 스톤 계산
const calculateStoneDetails = (stoneInfos: StoneInfo[]) => {
	const details = {
		mainStonePrice: 0,
		assistanceStonePrice: 0,
		additionalStonePrice: 0,
		mainStoneCount: 0,
		assistanceStoneCount: 0,
		stoneWeightTotal: 0,
	};

	if (!stoneInfos || stoneInfos.length === 0) {
		return details;
	}

	stoneInfos.forEach((stone) => {
		const quantity = stone.quantity || 0;
		const weight = stone.stoneWeight || 0;
		const laborCost = stone.laborCost || 0;

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

const OrderUpdatePage: React.FC = () => {
	const { flowCode } = useParams<{ flowCode: string }>();
	const { handleError } = useErrorHandler();

	// 팝업 참조를 저장하는 ref
	const popupMapRef = useRef<{ [key: string]: Window }>({});

	const [orderDetail, setOrderDetail] = useState<OrderResponseDetail | null>(
		null
	);
	const [initialImagePath, setInitialImagePath] = useState<
		string | undefined
	>();
	const [orderRows, setOrderRows] = useState<OrderRowData[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// 검색 모달 상태
	const [isStoreSearchOpen, setIsStoreSearchOpen] = useState(false);
	const [selectedRowForStore, setSelectedRowForStore] = useState<string>("");
	const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);
	const [selectedRowForFactory, setSelectedRowForFactory] =
		useState<string>("");
	const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
	const [selectedRowForProduct, setSelectedRowForProduct] =
		useState<string>("");
	const [storeGrade, setStoreGrade] = useState<string>("");

	// 드롭다운 데이터
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

	// 주문 상세 정보를 OrderRowData로 변환
	const convertToOrderRowData = (
		detail: OrderResponseDetail,
		grade: string,
		materials: { materialId: string; materialName: string }[],
		colors: { colorId: string; colorName: string }[],
		priorities: { priorityName: string; priorityDate: number }[]
	): OrderRowData => {
		const calculatedStoneData = calculateStoneDetails(detail.stoneInfos);

		// materialId와 colorId 찾기
		const foundMaterial = materials.find(
			(m) => m.materialName === detail.materialName
		);
		const foundColor = colors.find((c) => c.colorName === detail.colorName);

		const foundPriority = priorities.find(
			(p) => p.priorityName === detail.priority
		);
		let deliveryDate = detail.createAt;

		if (foundPriority && detail.createAt) {
			const calculatedDate = addBusinessDays(
				detail.createAt,
				foundPriority.priorityDate
			);
			deliveryDate = formatDateToString(calculatedDate);
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
			factoryId: detail.factoryId, // 서버에서 제공하는 factoryId 직접 사용
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

		return {
			...baseRowData,
			...calculatedStoneData,
		};
	};

	// 주문 행 업데이트
	const updateOrderRow = (
		id: string,
		field: keyof OrderRowData,
		value: unknown
	) => {
		setOrderRows((prevRows) =>
			prevRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
		);
	};

	// 검색 모달 핸들러들
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

	useEffect(() => {
		const handleMessageFromPopup = (event: MessageEvent) => {
			if (event.origin !== POPUP_ORIGIN) {
				return;
			}

			const { type, rowId, stoneInfos } = event.data;

			switch (type) {
				case "REQUEST_STONE_INFO": {
					setOrderRows((currentRows) => {
						const targetRow = currentRows.find((row) => row.id === rowId);
						const popup = popupMapRef.current[rowId];

						if (targetRow && popup && !popup.closed) {
							popup.postMessage(
								{
									type: "STONE_INFO_DATA",
									stoneInfos: targetRow.stoneInfos,
								},
								POPUP_ORIGIN
							);
						}
						return currentRows;
					});
					break;
				}
				case "REQUEST_STORE_GRADE": {
					const popup = popupMapRef.current[rowId];
					if (popup && !popup.closed) {
						popup.postMessage(
							{
								type: "STORE_GRADE_DATA",
								storeGrade: storeGrade,
							},
							POPUP_ORIGIN
						);
					}
					break;
				}
				case "STONE_INFO_SAVE": {
					// orderDetail의 stoneInfos 업데이트
					setOrderDetail((currentDetail) => {
						if (currentDetail) {
							const updatedOrderDetail = {
								...currentDetail,
								stoneInfos: stoneInfos,
							};
							return updatedOrderDetail;
						}
						return currentDetail;
					});

					// orderRows도 직접 업데이트 (즉시 반영을 위해)
					updateOrderRow(rowId, "stoneInfos", stoneInfos);

					// 스톤 정보 변경 시 알 단가 등 자동 재계산
					const calculated = calculateStoneDetails(stoneInfos);
					updateOrderRow(rowId, "mainStonePrice", calculated.mainStonePrice);
					updateOrderRow(
						rowId,
						"assistanceStonePrice",
						calculated.assistanceStonePrice
					);
					updateOrderRow(
						rowId,
						"additionalStonePrice",
						calculated.additionalStonePrice
					);
					updateOrderRow(rowId, "mainStoneCount", calculated.mainStoneCount);
					updateOrderRow(
						rowId,
						"assistanceStoneCount",
						calculated.assistanceStoneCount
					);
					updateOrderRow(
						rowId,
						"stoneWeightTotal",
						calculated.stoneWeightTotal
					);
					break;
				}
			}
		};

		window.addEventListener("message", handleMessageFromPopup);

		return () => {
			window.removeEventListener("message", handleMessageFromPopup);
		};
	}, [storeGrade]);

	// orderDetail이 변경될 때마다 orderRows 재계산
	useEffect(() => {
		if (
			orderDetail &&
			materials.length > 0 &&
			colors.length > 0 &&
			priorities.length > 0
		) {
			const rowData = convertToOrderRowData(
				orderDetail,
				storeGrade,
				materials,
				colors,
				priorities
			);
			setOrderRows([rowData]);
		}
	}, [orderDetail, materials, colors, priorities, storeGrade]);

	// 검색 결과 선택 핸들러들
	const handleStoreSelect = (store: StoreSearchDto) => {
		if (selectedRowForStore) {
			updateOrderRow(
				selectedRowForStore,
				"storeId",
				store.storeId?.toString() || ""
			);
			updateOrderRow(selectedRowForStore, "storeName", store.storeName);
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
			updateOrderRow(selectedRowForProduct, "productId", product.productId);
			updateOrderRow(selectedRowForProduct, "productName", product.productName);
			updateOrderRow(selectedRowForProduct, "factoryId", product.factoryId);
			updateOrderRow(selectedRowForProduct, "factoryName", product.factoryName);
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
			updateOrderRow(
				selectedRowForFactory,
				"factoryId",
				factory.factoryId?.toString() || ""
			);
			updateOrderRow(selectedRowForFactory, "factoryName", factory.factoryName);
		}
		setIsFactoryModalOpen(false);
		setSelectedRowForFactory("");
	};

	// 제조사 검색 팝업 닫기 핸들러
	const handleFactorySearchClose = useCallback(() => {
		setIsFactoryModalOpen(false);
		setSelectedRowForFactory("");
	}, []);

	// 초기 데이터 로드
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				const tempImagePath = sessionStorage.getItem("tempImagePath");
				if (tempImagePath) {
					setInitialImagePath(tempImagePath);
				}
				setLoading(true);

				// 주문 상세 정보와 드롭다운 데이터를 병렬로 로드
				const [
					orderRes,
					materialRes,
					colorRes,
					priorityRes,
					assistantStoneRes,
				] = await Promise.all([
					flowCode
						? orderApi.getOrder(flowCode)
						: Promise.resolve({ success: false, data: null }),
					materialApi.getMaterials(),
					colorApi.getColors(),
					priorityApi.getPriorities(),
					assistantStoneApi.getAssistantStones(),
				]);

				// 드롭다운 데이터 설정
				let materialsData: { materialId: string; materialName: string }[] = [];
				let colorsData: { colorId: string; colorName: string }[] = [];
				let prioritiesData: { priorityName: string; priorityDate: number }[] =
					[];

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

				if (priorityRes.success) {
					prioritiesData = (priorityRes.data || []).map((p) => ({
						priorityName: p.priorityName,
						priorityDate: p.priorityDate,
					}));
					setPriorities(prioritiesData);
				}

				// 주문 상세 정보를 OrderRowData로 변환 (드롭다운 데이터와 함께)
				if (orderRes.success && orderRes.data) {
					const detail = orderRes.data as OrderResponseDetail;
					setOrderDetail(detail);

					let grade = "";
					const storeGradeRes = await storeApi.getStoreGrade(detail.storeId);
					if (storeGradeRes.success && storeGradeRes.data) {
						grade = storeGradeRes.data;
						setStoreGrade(grade);
					}

					// OrderRowData로 변환하여 설정 (드롭다운 데이터 포함)
					const rowData = convertToOrderRowData(
						detail,
						grade,
						materialsData,
						colorsData,
						prioritiesData
					);
					setOrderRows([rowData]);
				}

				if (assistantStoneRes.success) {
					const assistantStones = (assistantStoneRes.data || []).map((a) => ({
						assistantStoneId: a.assistantStoneId,
						assistantStoneName: a.assistantStoneName,
					}));
					setAssistantStones(assistantStones);
				}
			} catch (err) {
				handleError(err, setError);
			} finally {
				setLoading(false);
			}
		};

		loadInitialData();
	}, [flowCode]); // eslint-disable-line react-hooks/exhaustive-deps

	// 저장 핸들러
	const handleSave = async () => {
		if (!orderDetail || orderRows.length === 0) {
			alert("저장할 주문 정보가 없습니다.");
			return;
		}

		try {
			setLoading(true);

			const currentRow = orderRows[0];

			console.log("업데이트할 주문 데이터:", currentRow.factoryId);

			// OrderCreateRequest 형식으로 데이터 변환
			const orderUpdateData: OrderRequestDetail = {
				storeId: currentRow.storeId,
				orderNote: currentRow.orderNote,
				factoryId: currentRow.factoryId,
				productId: currentRow.productId,
				productSize: currentRow.productSize,
				isProductWeightSale: currentRow.isProductWeightSale,
				productAddLaborCost: currentRow.productAddLaborCost,
				materialId: currentRow.materialId,
				colorId: currentRow.colorId,
				priorityName: currentRow.priorityName,
				stoneWeight: Number(currentRow.stoneWeightTotal),
				mainStoneNote: currentRow.mainStoneNote,
				assistanceStoneNote: currentRow.assistanceStoneNote,
				assistantStone: currentRow.assistantStone,
				assistantStoneId: currentRow.assistantStoneId,
				assistantStoneName: currentRow.assistantStoneName,
				assistantStoneCreateAt: currentRow.assistantStoneCreateAt,
				createAt: formatToLocalDate(currentRow.createAt),
				shippingAt: currentRow.shippingAt,
				productStatus: orderDetail.productStatus,
				stoneInfos: currentRow.stoneInfos,
			};
			const response = await orderApi.orderUpdate(flowCode!, orderUpdateData);

			if (response.success) {
				alert("주문이 성공적으로 업데이트되었습니다.");
				window.close();
			} else {
				throw new Error(response.message || "주문 업데이트에 실패했습니다.");
			}
		} catch (err) {
			handleError(err, setError);
			console.error("주문 업데이트 오류:", err);
			alert("주문 업데이트에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// 취소 핸들러
	const handleCancel = () => {
		if (window.confirm("작성을 취소하시겠습니까?")) {
			window.close();
		}
	};

	if (loading && !orderDetail) {
		return (
			<div className="order-update-page">
				<div className="loading-container">
					<div className="spinner"></div>
					<p>주문 정보를 불러오는 중...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="order-update-page">
			{/* 에러 메시지 */}
			{error && (
				<div className="error-message">
					<span>⚠️</span>
					<p>{error}</p>
				</div>
			)}

			{/* 주문 상세 정보 카드 */}
			<div className="order-detail-card">
				<img src={initialImagePath} alt="Product" />
				<h3>주문 정보</h3>
				<div className="detail-grid">
					<div className="detail-item">
						<label>주문코드:</label>
						<span>{orderDetail?.flowCode}</span>
					</div>
					<div className="detail-item">
						<label>주문일:</label>
						<span>
							{orderDetail?.createAt
								? formatToLocalDate(orderDetail.createAt)
								: "-"}
						</span>
					</div>
					<div className="detail-item">
						<label>상품 상태:</label>
						<span>{orderDetail?.productStatus}</span>
					</div>
					<div className="detail-item">
						<label>주문 상태:</label>
						<span>{orderDetail?.orderStatus}</span>
					</div>
				</div>
			</div>

			{/* 주문 테이블 */}
			<OrderTable
				mode="update"
				orderRows={orderRows}
				loading={loading}
				materials={materials}
				colors={colors}
				priorities={priorities}
				assistantStones={assistantStones}
				onRowUpdate={updateOrderRow}
				onStoreSearchOpen={handleStoreSearchOpen}
				onProductSearchOpen={handleProductSearchOpen}
				onFactorySearchOpen={handleFactorySearchOpen}
				onStoneInfoOpen={openStoneInfoManager}
			/>

			{/* 저장/취소 버튼 */}
			<div className="detail-button-group">
				<button
					className="btn-cancel"
					onClick={handleCancel}
					disabled={loading}
				>
					취소
				</button>
				<button className="btn-submit" onClick={handleSave} disabled={loading}>
					{loading ? "저장 중..." : "저장"}
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

export default OrderUpdatePage;
