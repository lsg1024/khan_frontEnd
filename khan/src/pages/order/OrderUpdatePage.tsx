import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { storeApi } from "../../../libs/api/store";
import { priorityApi } from "../../../libs/api/priority";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { isApiSuccess } from "../../../libs/api/config";
import { productApi } from "../../../libs/api/product";
import { useErrorHandler } from "../../utils/errorHandler";
import { useSearchModal } from "../../hooks/useSearchModal";
import { useStoneInfoManager } from "../../hooks/useStoneInfoManager";
import {
	addBusinessDays,
	formatDateToString,
	getLocalDate,
	formatToLocalDate,
} from "../../utils/dateUtils";
import type { MaterialDto } from "../../types/material";
import type { ColorDto } from "../../types/color";
import type { AssistantStoneDto } from "../../types/AssistantStoneDto";
import type { Product } from "../../types/product";
import type {
	OrderRowData,
	OrderResponseDetail,
	OrderRequestDetail,
} from "../../types/order";
import { calculateStoneDetails } from "../../utils/calculateStone";
import OrderTable from "../../components/common/order/OrderTable";
import StoreSearch from "../../components/common/store/StoreSearch";
import FactorySearch from "../../components/common/factory/FactorySearch";
import ProductSearch from "../../components/common/product/ProductSearch";
import ProductInfoSection from "../../components/common/ProductInfoSection";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto, AccountInfoDto } from "../../types/store";
import type { ProductDto } from "../../types/product";
import "../../styles/pages/OrderCreatePage.css";

type UpdateMode = "order" | "fix" | "expact";

const MODE_TO_STATUS = {
	order: "ORDER",
	fix: "FIX",
	expact: "EXPACT",
} as const satisfies Record<UpdateMode, "ORDER" | "FIX" | "EXPACT">;

const OrderUpdatePage: React.FC = () => {
	const { mode, flowCode } = useParams<{
		mode: UpdateMode;
		flowCode: string;
	}>();
	const [searchParams] = useSearchParams();
	const stockMode = searchParams.get("mode") === "stock";

	const { handleError } = useErrorHandler();

	// 검색 모달 상태 - 커스텀 훅 사용
	const storeModal = useSearchModal();
	const factoryModal = useSearchModal();
	const productModal = useSearchModal();

	const [orderDetail, setOrderDetail] = useState<OrderResponseDetail | null>(
		null
	);
	const [currentProductDetail, setCurrentProductDetail] =
		useState<Product | null>(null);

	const [orderRows, setOrderRows] = useState<OrderRowData[]>([]);
	const [loading, setLoading] = useState(false);
	const [storeGrade, setStoreGrade] = useState<string>("");

	// 드롭다운 데이터
	const [materials, setMaterials] = useState<MaterialDto[]>([]);
	const [colors, setColors] = useState<ColorDto[]>([]);
	const [priorities, setPriorities] = useState<
		{ priorityName: string; priorityDate: number }[]
	>([]);
	const [assistantStones, setAssistantStones] = useState<AssistantStoneDto[]>(
		[]
	);

	const orderStatus = MODE_TO_STATUS[mode as UpdateMode];
	const currentDate = getLocalDate();

	const convertToOrderRowData = (
		detail: OrderResponseDetail,
		storeGrade: string,

		priorities: { priorityName: string; priorityDate: number }[],
		assistantStonesParam: AssistantStoneDto[]
	): OrderRowData => {
		const calculatedStoneData = calculateStoneDetails(detail.stoneInfos);

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

		const foundAssistantStone = assistantStonesParam.find(
			(a) =>
				a.assistantStoneId.toString() ===
				(detail.assistantStoneId?.toString() ?? "")
		);

		const baseRowData: OrderRowData = {
			id: detail.flowCode,
			storeId: detail.storeId,
			storeName: detail.storeName,
			storeGrade: storeGrade,
			storeHarry: detail.storeHarry,
			productId: detail.productId,
			productName: detail.productName,
			productFactoryName: detail.productFactoryName,
			classificationId: detail.classificationId,
			classificationName: detail.classificationName,
			materialId: detail.materialId,
			materialName: detail.materialName,
			colorId: detail.colorId,
			colorName: detail.colorName,
			setTypeId: detail.setTypeId,
			setTypeName: detail.setTypeName,
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
			assistantStoneId: detail.assistantStoneId?.toString() ?? "",
			assistantStoneName:
				foundAssistantStone?.assistantStoneName ||
				detail.assistantStoneName ||
				"",
			assistantStoneCreateAt: detail.assistantStoneCreateAt || "",
			stoneWeight: Number(detail.stoneWeight) || 0,
			isProductWeightSale: false,
			productLaborCost: detail.productLaborCost || 0,
			productAddLaborCost: detail.productAddLaborCost || 0,
			mainStonePrice: 0,
			assistanceStonePrice: 0,
			stoneAddLaborCost: 0,
			mainStoneCount: 0,
			assistanceStoneCount: 0,
			stoneWeightTotal: 0,
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
		setOrderRows((prevRows) => {
			const updatedRows = prevRows.map((row) => {
				if (row.id === id) {
					const updatedRow = { ...row, [field]: value };
					return updatedRow;
				}
				return row;
			});
			return updatedRows;
		});
	};

	const handleAssistanceStoneArrivalChange = (id: string, value: string) => {
		if (value === "Y") {
			// Y로 변경 시 현재 날짜를 자동 설정
			updateOrderRow(id, "assistantStone", true);
			updateOrderRow(id, "assistantStoneCreateAt", currentDate);
		} else {
			// N으로 변경 시 날짜 초기화
			updateOrderRow(id, "assistantStone", false);
			updateOrderRow(id, "assistantStoneCreateAt", "");
		}
	};

	// 거래처 검색 모달 열기
	const handleStoreSearchOpen = (rowId: string) => {
		storeModal.openModal(rowId);
	};

	// 상품 검색 모달 열기
	const handleProductSearchOpen = (rowId: string) => {
		const row = orderRows.find((r) => r.id === rowId);
		const grade = row?.storeGrade || "1";
		productModal.openModal(rowId, { grade: grade });
	};

	// 제조사 검색 모달 열기
	const handleFactorySearchOpen = (rowId: string) => {
		factoryModal.openModal(rowId);
	};

	// 스톤 정보 관리 - 커스텀 훅 사용
	const { openStoneInfoManager } = useStoneInfoManager({
		orderRows,
		updateOrderRow,
	});

	const isInitialMount = useRef(true);

	useEffect(() => {
		if (
			isInitialMount.current &&
			orderDetail &&
			materials.length > 0 &&
			colors.length > 0 &&
			priorities.length > 0
		) {
			const rowData = convertToOrderRowData(
				orderDetail,
				storeGrade,
				priorities,
				assistantStones
			);
			setOrderRows([rowData]);
			isInitialMount.current = false;
		}
	}, [orderDetail, materials, colors, priorities, assistantStones, storeGrade]); // eslint-disable-line react-hooks/exhaustive-deps

	// 거래처 선택 처리
	const handleStoreSelect = async (store: StoreSearchDto | AccountInfoDto) => {
		if (storeModal.selectedRowId) {
			if (store.accountId === undefined || store.accountId === null) {
				alert("거래처 ID가 누락되었습니다. 다른 거래처를 선택해주세요.");
				return;
			}

			updateOrderRow(
				storeModal.selectedRowId,
				"storeId",
				store.accountId.toString()
			);
			updateOrderRow(
				storeModal.selectedRowId,
				"storeName",
				store.accountName || ""
			);

			// 거래처 변경 시 storeGrade 재조회
			try {
				const storeGradeRes = await storeApi.getStoreGrade(
					store.accountId.toString()
				);
				if (storeGradeRes.success && storeGradeRes.data) {
					setStoreGrade(storeGradeRes.data);
					updateOrderRow(
						storeModal.selectedRowId,
						"storeGrade",
						storeGradeRes.data
					);
				}
			} catch (err) {
				handleError(err);
			}
		}
		storeModal.handleSelect();
	};

	// 상품 선택 처리
	const handleProductSelect = (product: ProductDto) => {
		if (productModal.selectedRowId) {
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
			updateOrderRow(productModal.selectedRowId, "productId", productIdValue);
			updateOrderRow(
				productModal.selectedRowId,
				"productName",
				product.productName || ""
			);
			updateOrderRow(
				productModal.selectedRowId,
				"productFactoryName",
				product.productFactoryName || ""
			);
			updateOrderRow(
				productModal.selectedRowId,
				"classificationName",
				currentProductDetail?.classificationDto.classificationName || ""
			);
			updateOrderRow(
				productModal.selectedRowId,
				"setTypeId",
				currentProductDetail?.setTypeDto.setTypeId || ""
			);
			updateOrderRow(
				productModal.selectedRowId,
				"setTypeName",
				currentProductDetail?.setTypeDto.setTypeName || ""
			);
			updateOrderRow(productModal.selectedRowId, "factoryId", factoryIdValue);
			updateOrderRow(
				productModal.selectedRowId,
				"factoryName",
				product.factoryName || ""
			);
			updateOrderRow(
				productModal.selectedRowId,
				"productLaborCost",
				product.productLaborCost || 0
			);

			const mainStone = product.productStones.find((stone) => stone.mainStone);

			const mainStonePrice = mainStone
				? (mainStone.laborCost || 0) * (mainStone.stoneQuantity || 0)
				: 0;
			const mainStoneCount = mainStone?.stoneQuantity || 0;

			updateOrderRow(
				productModal.selectedRowId,
				"mainStonePrice",
				mainStonePrice
			);
			updateOrderRow(
				productModal.selectedRowId,
				"mainStoneCount",
				mainStoneCount
			);

			const assistanceStone = product.productStones.find(
				(stone) => !stone.mainStone
			);

			const assistanceStonePrice = assistanceStone
				? (assistanceStone.laborCost || 0) *
				  (assistanceStone.stoneQuantity || 0)
				: 0;
			const assistanceStoneCount = assistanceStone?.stoneQuantity || 0;

			updateOrderRow(
				productModal.selectedRowId,
				"assistanceStonePrice",
				assistanceStonePrice
			);
			updateOrderRow(
				productModal.selectedRowId,
				"assistanceStoneCount",
				assistanceStoneCount
			);

			updateOrderRow(
				productModal.selectedRowId,
				"mainStoneCount",
				product.productStones.find((stone) => stone.mainStone)?.stoneQuantity ||
					0
			);
			updateOrderRow(
				productModal.selectedRowId,
				"assistanceStoneCount",
				product.productStones.find((stone) => !stone.mainStone)
					?.stoneQuantity || 0
			);

			// productMaterial 값이 있으면 자동으로 드롭다운에서 선택
			if (product.productMaterial) {
				const foundMaterial = materials.find(
					(m) => m.materialName === product.productMaterial
				);
				if (foundMaterial) {
					updateOrderRow(
						productModal.selectedRowId,
						"materialId",
						foundMaterial.materialId.toString()
					);
					updateOrderRow(
						productModal.selectedRowId,
						"materialName",
						foundMaterial.materialName
					);
				}
			}

			// productColor 값이 있으면 자동으로 드롭다운에서 선택
			if (product.productColor) {
				const foundColor = colors.find(
					(c) => c.colorName === product.productColor
				);
				if (foundColor) {
					updateOrderRow(
						productModal.selectedRowId,
						"colorId",
						foundColor.colorId.toString()
					);
					updateOrderRow(
						productModal.selectedRowId,
						"colorName",
						foundColor.colorName
					);
				}
			}
		}
		productModal.handleSelect();
	};

	// 제조사 선택 처리
	const handleFactorySelect = (factory: FactorySearchDto) => {
		if (factoryModal.selectedRowId) {
			if (factory.factoryId === undefined || factory.factoryId === null) {
				alert("제조사 ID가 누락되었습니다. 다른 제조사를 선택해주세요.");
				return;
			}

			const factoryIdValue = factory.factoryId.toString();
			updateOrderRow(factoryModal.selectedRowId, "factoryId", factoryIdValue);
			updateOrderRow(
				factoryModal.selectedRowId,
				"factoryName",
				factory.factoryName || ""
			);
		}
		factoryModal.handleSelect();
	};

	// 초기 데이터 로드
	useEffect(() => {
		const loadInitialData = async () => {
			try {
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
				let prioritiesData: { priorityName: string; priorityDate: number }[] =
					[];
				let assistantStonesData: AssistantStoneDto[] = [];

				if (materialRes.success) {
					const materialsData = (materialRes.data || []).map((m) => ({
						materialId: m.materialId?.toString() || "",
						materialName: m.materialName,
						materialGoldPurityPercent: m.materialGoldPurityPercent || "",
					}));
					setMaterials(materialsData);
				}

				if (colorRes.success) {
					const colorsData = (colorRes.data || []).map((c) => ({
						colorId: c.colorId?.toString() || "",
						colorName: c.colorName,
						colorNote: c.colorNote || "",
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

				if (assistantStoneRes.success) {
					assistantStonesData = (assistantStoneRes.data || []).map((a) => ({
						assistantStoneId: a.assistantStoneId,
						assistantStoneName: a.assistantStoneName,
					}));
					setAssistantStones(assistantStonesData);
				}

				// 주문 상세 정보를 OrderRowData로 변환
				if (orderRes.success && orderRes.data) {
					const detail = orderRes.data as OrderResponseDetail;
					setOrderDetail(detail);

					let grade = "";
					const storeGradeRes = await storeApi.getStoreGrade(detail.storeId);
					if (storeGradeRes.success && storeGradeRes.data) {
						grade = storeGradeRes.data;
						setStoreGrade(grade);
					}

					// 상품 상세 정보 로드
					if (detail.productId) {
						try {
							const response = await productApi.getProduct(detail.productId);
							if (isApiSuccess(response) && response.data) {
								const transformedData: Product = {
									...response.data,
									productWorkGradePolicyGroupDto:
										response.data.productWorkGradePolicyGroupDto.map(
											(group: {
												productGroupId: string;
												productPurchasePrice: number;
												colorId: string;
												colorName: string;
												note: string;
												gradePolicyDtos?: unknown;
												policyDtos?: unknown;
											}) => ({
												productGroupId: group.productGroupId,
												productPurchasePrice: group.productPurchasePrice,
												colorId: group.colorId,
												colorName: group.colorName,
												note: group.note,
												policyDtos: (group.gradePolicyDtos ||
													group.policyDtos ||
													[]) as {
													workGradePolicyId: string;
													grade: string;
													laborCost: number;
													groupId: number;
												}[],
											})
										),
								};
								setCurrentProductDetail(transformedData);
							}
						} catch (err) {
							handleError(err);
						}
					}
					// OrderRowData로 변환하여 설정 (드롭다운 데이터 포함)
					const rowData = convertToOrderRowData(
						detail,
						grade,
						prioritiesData,
						assistantStonesData
					);
					setOrderRows([rowData]);
				}
			} catch (err) {
				handleError(err);
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

			// OrderCreateRequest 형식으로 데이터 변환
			const orderUpdateData: OrderRequestDetail = {
				storeId: currentRow.storeId,
				orderNote: currentRow.orderNote,
				factoryId: currentRow.factoryId,
				productId: currentRow.productId,
				productSize: currentRow.productSize,
				isProductWeightSale: currentRow.isProductWeightSale,
				productLaborCost: currentRow.productLaborCost,
				productAddLaborCost: currentRow.productAddLaborCost,
				materialId: currentRow.materialId,
				colorId: currentRow.colorId,
				priorityName: currentRow.priorityName,
				stoneWeight: Number(currentRow.stoneWeightTotal),
				mainStoneNote: currentRow.mainStoneNote,
				assistanceStoneNote: currentRow.assistanceStoneNote,
				assistantStone: currentRow.assistantStone,
				assistantStoneId: currentRow.assistantStoneId || "1", // 기본값 설정
				assistantStoneName: currentRow.assistantStoneName,
				assistantStoneCreateAt: currentRow.assistantStoneCreateAt,
				createAt: formatToLocalDate(currentRow.createAt),
				shippingAt: currentRow.shippingAt,
				stoneInfos: currentRow.stoneInfos,
			};
			// 필수 필드 검증
			if (!orderUpdateData.storeId) {
				alert("거래처 정보가 누락되었습니다.");
				return;
			}
			if (!orderUpdateData.factoryId) {
				alert("제조사 정보가 누락되었습니다.");
				return;
			}
			if (!orderUpdateData.productId) {
				alert("상품 정보가 누락되었습니다.");
				return;
			}
			const response = await orderApi.orderUpdate(
				flowCode!,
				orderStatus!,
				orderUpdateData
			);

			if (response.success) {
				alert("주문이 성공적으로 업데이트되었습니다.");

				// 부모 창에 업데이트 완료 메시지 전송
				if (window.opener && !window.opener.closed) {
					window.opener.postMessage(
						{ type: "ORDER_UPDATED" },
						window.location.origin
					);
				}
				window.close();
			} else {
				throw new Error(response.message || "주문 업데이트에 실패했습니다.");
			}
		} catch (err) {
			handleError(err);
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
			<>
				<div className="loading-container">
					<div className="spinner"></div>
					<p>주문정보를 불러오는 중...</p>
				</div>
			</>
		);
	}

	return (
		<div className="order-update-page">
			{/* 상품 정보 섹션 */}
			<ProductInfoSection
				currentProductDetail={currentProductDetail}
				title={stockMode ? "재고 등록 상품 정보" : "주문 상품 정보"}
			/>
			<OrderTable
				mode="update"
				orderRows={orderRows}
				loading={loading}
				materials={materials}
				colors={colors}
				priorities={priorities}
				assistantStones={assistantStones}
				onRowUpdate={updateOrderRow}
				onAssistanceStoneArrivalChange={handleAssistanceStoneArrivalChange}
				onStoreSearchOpen={handleStoreSearchOpen}
				onProductSearchOpen={handleProductSearchOpen}
				onFactorySearchOpen={handleFactorySearchOpen}
				onStoneInfoOpen={openStoneInfoManager}
			/>

			{/* 저장/취소 버튼 */}
			<div className="form-actions">
				<button
					className="btn-cancel"
					onClick={handleCancel}
					disabled={loading}
				>
					{orderDetail?.orderStatus === "재고" ? "닫기" : "취소"}
				</button>
				<button
					className="btn-submit"
					onClick={handleSave}
					disabled={loading || orderDetail?.orderStatus === "재고"}
					style={{
						opacity: orderDetail?.orderStatus === "재고" ? 0.5 : 1,
						cursor:
							orderDetail?.orderStatus === "재고" ? "not-allowed" : "pointer",
					}}
				>
					{loading ? "저장 중..." : stockMode ? "등록" : "수정"}
				</button>
			</div>

			{/* 검색 컴포넌트들 - 모달 방식 */}
			{storeModal.isOpen && (
				<StoreSearch
					onSelectStore={handleStoreSelect}
					onClose={storeModal.closeModal}
				/>
			)}

			{factoryModal.isOpen && (
				<FactorySearch
					onSelectFactory={handleFactorySelect}
					onClose={factoryModal.closeModal}
				/>
			)}

			{productModal.isOpen && (
				<ProductSearch
					grade={productModal.additionalParams.grade}
					onSelectProduct={handleProductSelect}
					onClose={productModal.closeModal}
				/>
			)}
		</div>
	);
};

export default OrderUpdatePage;
