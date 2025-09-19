import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { priorityApi } from "../../../libs/api/priority";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { useErrorHandler } from "../../utils/errorHandler";
import type { OrderRowData, OrderResponseDetail } from "../../types/order";
import OrderTable from "../../components/common/order/OrderTable";
import StoreSearch from "../../components/common/product/StoreSearch";
import FactorySearch from "../../components/common/product/FactorySearch";
import ProductSearch from "../../components/common/product/ProductSearch";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto } from "../../types/store";
import type { ProductDto } from "../../types/product";
import "../../styles/pages/OrderCreatePage.css";

const OrderUpdatePage: React.FC = () => {
	const { flowCode } = useParams<{ flowCode: string }>();
	const navigate = useNavigate();
	const { handleError } = useErrorHandler();

	const [orderDetail, setOrderDetail] = useState<OrderResponseDetail | null>(
		null
	);
	const [initialImagePath, setInitialImagePath] = useState<string | null>(null);
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
	const convertToOrderRowData = (detail: OrderResponseDetail): OrderRowData => {
		return {
			id: detail.flowCode,
			storeId: "", // API에서 제공하지 않음
			storeName: detail.storeName,
			grade: "",
			productId: "", // API에서 제공하지 않음
			productName: detail.productName,
			materialId: "", // 재질명으로 찾아야 함
			materialName: detail.materialName,
			colorId: "", // 색상명으로 찾아야 함
			colorName: detail.colorName,
			classificationName: detail.classification,
			setTypeName: "",
			factoryId: "",
			factoryName: detail.factoryName,
			productSize: detail.productSize,
			stoneWeight: 0,
			isProductWeightSale: false,
			priorityName: detail.priority,
			mainStoneNote: "",
			assistanceStoneNote: "",
			orderNote: detail.orderNote,
			stoneInfos: detail.stoneInfos,
			createAt: detail.createAt,
			mainPrice: 0,
			additionalPrice: 0,
			mainStonePrice: 0,
			assistanceStonePrice: 0,
			mainStoneCount: 0,
			assistanceStoneCount: 0,
			additionalStonePrice: 0,
			stoneWeightTotal: 0,
			// 보조석 관련 필드
			assistantStone: false,
			assistantStoneId: 0,
			assistantStoneName: "",
			assistantStoneCreateAt: "",
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

	// 초기 데이터 로드
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				const tempImagePath = sessionStorage.getItem('tempImagePath');
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

				// 주문 상세 정보 설정
				if (orderRes.success && orderRes.data) {
					const detail = orderRes.data as OrderResponseDetail;
					setOrderDetail(detail);

					// OrderRowData로 변환하여 설정
					const rowData = convertToOrderRowData(detail);
					setOrderRows([rowData]);
				}

				// 드롭다운 데이터 설정
				if (materialRes.success) {
					const materials = (materialRes.data || []).map((m) => ({
						materialId: m.materialId?.toString() || "",
						materialName: m.materialName,
					}));
					setMaterials(materials);
				}

				if (colorRes.success) {
					const colors = (colorRes.data || []).map((c) => ({
						colorId: c.colorId?.toString() || "",
						colorName: c.colorName,
					}));
					setColors(colors);
				}

				if (priorityRes.success) {
					const priorities = (priorityRes.data || []).map((p) => ({
						priorityName: p.priorityName,
						priorityDate: p.priorityDate,
					}));
					setPriorities(priorities);
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
		try {
			setLoading(true);
			alert("주문이 성공적으로 업데이트되었습니다.");
			navigate("/orders");
		} catch (err) {
			handleError(err, setError);
			alert("주문 업데이트에 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// 취소 핸들러
	const handleCancel = () => {
		if (window.confirm("수정을 취소하시겠습니까?")) {
			navigate("/orders");
		}
	};

	if (loading && !orderDetail) {
		return (
			<div className="order-create-page">
				<div className="loading-container">
					<div className="spinner"></div>
					<p>주문 정보를 불러오는 중...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="order-create-page">
			{/* 에러 메시지 */}
			{error && (
				<div className="error-message">
					<span>⚠️</span>
					<p>{error}</p>
				</div>
			)}

			{/* 주문 상세 정보 카드 */}
			<div className="order-detail-card">
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
								? new Date(orderDetail.createAt).toLocaleDateString()
								: "-"}
						</span>
					</div>
					<div className="detail-item">
						<label>출고일:</label>
						<span>
							{orderDetail?.shippingAt
								? new Date(orderDetail.shippingAt).toLocaleDateString()
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
			/>

			{/* 저장/취소 버튼 */}
			<div className="button-group">
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

			{/* 검색 모달들 */}
			<StoreSearch
				isOpen={isStoreSearchOpen}
				onClose={() => {
					setIsStoreSearchOpen(false);
					setSelectedRowForStore("");
				}}
				onSelectStore={handleStoreSelect}
			/>

			<FactorySearch
				isOpen={isFactoryModalOpen}
				onClose={() => setIsFactoryModalOpen(false)}
				onSelectFactory={handleFactorySelect}
			/>

			<ProductSearch
				isOpen={isProductSearchOpen}
				onClose={() => setIsProductSearchOpen(false)}
				onSelectProduct={handleProductSelect}
			/>
		</div>
	);
};

export default OrderUpdatePage;
