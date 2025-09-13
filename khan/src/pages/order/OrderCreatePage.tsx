import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { useErrorHandler } from "../../utils/errorHandler";
import type { OrderRowData, OrderCreateRequest } from "../../types/order";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto } from "../../types/store";
import type { ProductDto } from "../../types/catalog";
import StoreSearch from "../../components/common/product/StoreSearch";
import FactorySearch from "../../components/common/product/FactorySearch";
import ProductSearch from "../../components/common/product/ProductSearch";
import "../../styles/pages/OrderCreatePage.css";

const OrderCreatePage = () => {
    const navigate = useNavigate();
    const { handleError } = useErrorHandler();

    // 주문 행 데이터
    const [orderRows, setOrderRows] = useState<OrderRowData[]>([]);

    // 검색 모달 상태
    const [isStoreSearchOpen, setIsStoreSearchOpen] = useState(false);
    const [selectedRowForStore, setSelectedRowForStore] = useState<string>("");
    const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);
    const [selectedRowForFactory, setSelectedRowForFactory] = useState<string>("");
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [selectedRowForProduct, setSelectedRowForProduct] = useState<string>("");

    // 드롭다운 데이터
    const [materials, setMaterials] = useState<
        { materialId: string; materialName: string }[]
    >([]);
    const [colors, setColors] = useState<
        { colorId: string; colorName: string }[]
    >([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // 새 주문 행 추가
    const addOrderRow = () => {
        const newRow: OrderRowData = {
        id: Date.now().toString(),
        storeId: "",
        storeName: "",
        productId: "",
        productName: "",
        productImage: "",
        materialId: "",
        materialName: "",
        colorId: "",
        colorName: "",
        classificationId: "",
        classificationName: "",
        setType: "",
        factoryId: "",
        factoryName: "",
        productSize: "",
        productWeight: 0,
        stoneWeight: 0,
        productAddLaborCost: 0,
        isProductWeightSale: false,
        priorityName: "일반",
        mainStoneNote: "",
        assistanceStoneNote: "",
        orderNote: "",
        stoneInfos: [],
        basicPrice: 0,
        additionalPrice: 0,
        centerPrice: 0,
        assistancePrice: 0,
        mainStoneCount: 0,
        assistanceStoneCount: 0,
        stoneWeightTotal: 0,
        deliveryDate: new Date()
            .toLocaleDateString()
            .split(".")
            .join("-")
            .slice(0, 11),
        };
        setOrderRows([...orderRows, newRow]);
    };

    // 주문 행 삭제
    const removeOrderRow = (id: string) => {
        setOrderRows(orderRows.filter((row) => row.id !== id));
    };

    // 주문 행 데이터 업데이트
    const updateOrderRow = (
        id: string,
        field: keyof OrderRowData,
        value: string | number | boolean
    ) => {
        console.log("updateOrderRow - id:", id, "field:", field, "value:", value);

        setOrderRows((prevRows) => {
        const updatedRows = prevRows.map((row) => {
            if (row.id === id) {
            const updatedRow = { ...row, [field]: value };
            console.log("updateOrderRow - updated row:", updatedRow);
            return updatedRow;
            }
            return row;
        });
        console.log("updateOrderRow - all updated rows:", updatedRows);
        return updatedRows;
        });
    };

    // 필수 선택 순서 체크 함수들
    const checkStoreSelected = (rowId: string): boolean => {
        const row = orderRows.find((r) => r.id === rowId);
        return !!(row?.storeId && row?.storeName);
    };

    const checkProductSelected = (rowId: string): boolean => {
        const row = orderRows.find((r) => r.id === rowId);
        return !!(row?.productId && row?.productName);
    };

    const checkMaterialSelected = (rowId: string): boolean => {
        const row = orderRows.find((r) => r.id === rowId);
        return !!(row?.materialId && row?.materialName);
    };

    // 필수 선택 순서 체크 및 알림
    const validateSequence = (
        rowId: string,
        currentStep: "product" | "material" | "other"
    ): boolean => {
        const row = orderRows.find((r) => r.id === rowId);
        console.log(
        "validateSequence - rowId:",
        rowId,
        "currentStep:",
        currentStep
        );
        console.log("validateSequence - row data:", {
        storeId: row?.storeId,
        storeName: row?.storeName,
        productId: row?.productId,
        productName: row?.productName,
        materialId: row?.materialId,
        materialName: row?.materialName,
        });

        if (currentStep === "product" && !checkStoreSelected(rowId)) {
        console.log("product step - store not selected");
        alert("거래처를 먼저 선택해주세요.");
        openStoreSearch(rowId);
        return false;
        }

        if (currentStep === "material" && !checkStoreSelected(rowId)) {
        console.log("material step - store not selected");
        alert("거래처를 먼저 선택해주세요.");
        openStoreSearch(rowId);
        return false;
        }

        if (currentStep === "material" && !checkProductSelected(rowId)) {
        console.log("material step - product not selected");
        alert("모델번호를 먼저 선택해주세요.");
        openProductSearch(rowId);
        return false;
        }

        if (currentStep === "other" && !checkStoreSelected(rowId)) {
        console.log("other step - store not selected");
        alert("거래처를 먼저 선택해주세요.");
        openStoreSearch(rowId);
        return false;
        }

        if (currentStep === "other" && !checkProductSelected(rowId)) {
        console.log("other step - product not selected");
        alert("모델번호를 먼저 선택해주세요.");
        openProductSearch(rowId);
        return false;
        }

        if (currentStep === "other" && !checkMaterialSelected(rowId)) {
        console.log("other step - material not selected");
        alert("재질을 먼저 선택해주세요.");
        // 재질 드롭다운에 포커스
        const materialSelect = document.querySelector(
            `[data-row-id="${rowId}"][data-field="material"]`
        ) as HTMLSelectElement;
        if (materialSelect) {
            materialSelect.focus();
        }
        return false;
        }

        console.log("validateSequence - validation passed");
        return true;
    };

    // 거래처 검색 모달 열기
    const openStoreSearch = (rowId: string) => {
        setSelectedRowForStore(rowId);
        setIsStoreSearchOpen(true);
    };

    // 거래처 선택 처리
    const handleStoreSelect = (store: StoreSearchDto) => {
        console.log("handleStoreSelect - received store:", store);
        console.log(
        "handleStoreSelect - storeId type:",
        typeof store.storeId,
        "value:",
        store.storeId
        );
        console.log(
        "handleStoreSelect - selectedRowForStore:",
        selectedRowForStore
        );

        if (selectedRowForStore) {
        const storeIdValue = store.storeId?.toString() || "";
        console.log("handleStoreSelect - converted storeId:", storeIdValue);

        updateOrderRow(selectedRowForStore, "storeId", storeIdValue);
        updateOrderRow(selectedRowForStore, "storeName", store.storeName);
        }
        setIsStoreSearchOpen(false);
        setSelectedRowForStore("");
    };

    // 제조사 검색 모달 열기
    const openFactorySearch = (rowId: string) => {
        setSelectedRowForFactory(rowId);
        setIsFactoryModalOpen(true);
    };

    // 제조사 선택 처리
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

    // 상품 검색 모달 열기
    const openProductSearch = (rowId: string) => {
        if (!validateSequence(rowId, "product")) {
        return;
        }
        setSelectedRowForProduct(rowId);
        setIsProductSearchOpen(true);
    };

    // 상품 선택 처리
    const handleProductSelect = (product: ProductDto) => {
        if (selectedRowForProduct) {
        updateOrderRow(selectedRowForProduct, "productId", product.productId);
        updateOrderRow(selectedRowForProduct, "productName", product.productName);
        updateOrderRow(
            selectedRowForProduct,
            "productImage",
            product.productImagePath || ""
        );
        }
        setIsProductSearchOpen(false);
        setSelectedRowForProduct("");
    };

    // 초기 데이터 로드
    useEffect(() => {
        const loadInitialData = async () => {
        try {
            setLoading(true);

            // 기본 드롭다운 데이터만 로드
            const [materialRes, colorRes] = await Promise.all([
            materialApi.getMaterials(),
            colorApi.getColors(),
            ]);

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

            // 초기 20개 행 생성
            const initialRows: OrderRowData[] = [];
            for (let i = 0; i < 20; i++) {
            const newRow: OrderRowData = {
                id: `${Date.now()}-${i}`,
                storeId: "",
                storeName: "",
                productId: "",
                productName: "",
                productImage: "",
                materialId: "",
                materialName: "",
                colorId: "",
                colorName: "",
                classificationId: "",
                classificationName: "",
                setType: "",
                factoryId: "",
                factoryName: "",
                productSize: "",
                productWeight: 0,
                stoneWeight: 0,
                productAddLaborCost: 0,
                isProductWeightSale: false,
                priorityName: "일반",
                mainStoneNote: "",
                assistanceStoneNote: "",
                orderNote: "",
                stoneInfos: [],
                basicPrice: 0,
                additionalPrice: 0,
                centerPrice: 0,
                assistancePrice: 0,
                mainStoneCount: 0,
                assistanceStoneCount: 0,
                stoneWeightTotal: 0,
                deliveryDate: new Date().toISOString().split("T")[0],
            };
            initialRows.push(newRow);
            }
            setOrderRows(initialRows);
        } catch (err) {
            handleError(err, setError);
        } finally {
            setLoading(false);
        }
        };

        loadInitialData();
    }, []); //

    // 주문 제출
    const handleSubmit = async () => {
        if (orderRows.length === 0) {
        alert("주문할 상품을 추가해주세요.");
        return;
        }

        // 필수 필드 검증
        for (const row of orderRows) {
        if (!row.storeId || !row.productId || !row.factoryId) {
            alert("모든 필수 필드를 입력해주세요. (거래처, 상품, 제조사)");
            return;
        }
        }

        try {
        setLoading(true);

        // 각 주문 행을 개별 API 요청으로 처리
        const promises = orderRows.map((row) => {
            const orderData: OrderCreateRequest = {
            storeId: row.storeId,
            orderNote: row.orderNote,
            factoryId: row.factoryId,
            productId: row.productId,
            productSize: row.productSize,
            productAddLaborCost: row.productAddLaborCost,
            isProductWeightSale: row.isProductWeightSale,
            productWeight: row.productWeight,
            stoneWeight: row.stoneWeight,
            materialId: row.materialId,
            classificationId: row.classificationId,
            colorId: row.colorId,
            setType: row.setType,
            priorityName: row.priorityName,
            mainStoneNote: row.mainStoneNote,
            assistanceStoneNote: row.assistanceStoneNote,
            productStatus: "접수",
            createAt: new Date().toISOString(),
            stoneInfos: row.stoneInfos,
            };
            return orderApi.createOrder(orderData);
        });

        await Promise.all(promises);

        alert("주문이 성공적으로 등록되었습니다.");
        navigate("/orders");
        } catch (err) {
        handleError(err, setError);
        alert("주문 등록에 실패했습니다.");
        } finally {
        setLoading(false);
        }
    };

    // 취소
    const handleCancel = () => {
        if (window.confirm("작성을 취소하시겠습니까?")) {
        navigate("/orders");
        }
    };

    if (loading && orderRows.length === 0) {
        return (
        <div className="order-create-page">
            <div className="loading-container">
            <div className="spinner"></div>
            <p>데이터를 불러오는 중...</p>
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

        {/* 상품 이미지 섹션 */}
        <div className="product-images-section">
            <h2>상품 이미지</h2>
            <div className="product-images-grid">
            {orderRows.length === 0 ? (
                <div className="order-history-placeholder">
                주문을 추가하면 선택된 상품 이미지가 표시됩니다.
                </div>
            ) : (
                orderRows.map((row) =>
                row.productImage ? (
                    <div key={row.id} className="product-image-item">
                    <img src={row.productImage} alt={row.productName} />
                    <div className="product-name">{row.productName}</div>
                    </div>
                ) : row.productName ? (
                    <div key={row.id} className="product-image-item">
                    <div className="no-image">이미지 없음</div>
                    <div className="product-name">{row.productName}</div>
                    </div>
                ) : null
                )
            )}
            </div>
        </div>

        {/* 과거 거래내역 섹션 */}
        <div className="order-history-section">
            <h2>과거 거래내역</h2>
            <div className="order-history-placeholder">
            선택된 거래처의 과거 주문 내역이 표시됩니다. (추후 업데이트 예정)
            </div>
        </div>

        {/* 주문 테이블 */}
        <div className="order-table-container">
            <table className="order-create-table">
            <thead>
                <tr>
                <th>No</th>
                <th>삭제</th>
                <th>
                    <span className="required-field-basic">*</span>거래처
                </th>
                <th>
                    <span className="required-field-basic">*</span>모델번호
                </th>
                <th>제조사</th>
                <th>
                    <span className="required-field-basic">*</span>재질
                </th>
                <th>색상</th>
                <th colSpan={4}>상품 단가</th>
                <th colSpan={2}>알 단가</th>
                <th>알중량</th>
                <th>메인메모</th>
                <th>보조메모</th>
                <th>사이즈</th>
                <th>급</th>
                <th>메모</th>
                <th>출고일</th>
                </tr>
                <tr>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th>기본단가</th>
                <th>추가단가</th>
                <th>중심단가</th>
                <th>보조단가</th>
                <th>메인알수</th>
                <th>보조알수</th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                <th></th>
                </tr>
            </thead>
            <tbody>
                {orderRows.map((row, index) => (
                <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>
                    <button
                        className="btn-delete-row"
                        onClick={() => removeOrderRow(row.id)}
                        disabled={loading || orderRows.length === 1}
                    >
                        삭제
                    </button>
                    </td>
                    <td>
                    <div
                        style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        }}
                    >
                        <input
                        type="text"
                        value={row.storeName}
                        readOnly
                        placeholder="거래처"
                        style={{ flex: 1, cursor: "pointer" }}
                        onClick={() => openStoreSearch(row.id)}
                        />
                    </div>
                    </td>
                    <td>
                    <div
                        style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        }}
                    >
                        <input
                        type="text"
                        value={row.productName}
                        readOnly
                        placeholder="모델번호"
                        style={{ flex: 1, cursor: "pointer" }}
                        onClick={() => openProductSearch(row.id)}
                        />
                    </div>
                    </td>
                    <td>
                    <div
                        style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        }}
                    >
                        <input
                        type="text"
                        value={row.factoryName}
                        readOnly
                        placeholder="제조사"
                        style={{ flex: 1, cursor: "pointer" }}
                        onClick={() => openFactorySearch(row.id)}
                        />
                    </div>
                    </td>
                    <td>
                    <select
                        value={row.materialId}
                        onChange={(e) => {
                        if (!validateSequence(row.id, "material")) {
                            return;
                        }
                        const selectedMaterial = materials.find(
                            (m) => m.materialId === e.target.value
                        );
                        updateOrderRow(row.id, "materialId", e.target.value);
                        updateOrderRow(
                            row.id,
                            "materialName",
                            selectedMaterial?.materialName || ""
                        );
                        }}
                        disabled={loading}
                        data-row-id={row.id}
                        data-field="material"
                    >
                        <option value="">선택</option>
                        {materials.map((material) => (
                        <option
                            key={material.materialId}
                            value={material.materialId}
                        >
                            {material.materialName}
                        </option>
                        ))}
                    </select>
                    </td>
                    <td>
                    <select
                        value={row.colorId}
                        onChange={(e) => {
                        if (!validateSequence(row.id, "other")) {
                            return;
                        }
                        const selectedColor = colors.find(
                            (c) => c.colorId === e.target.value
                        );
                        updateOrderRow(row.id, "colorId", e.target.value);
                        updateOrderRow(
                            row.id,
                            "colorName",
                            selectedColor?.colorName || ""
                        );
                        }}
                        disabled={loading}
                    >
                        <option value="">선택</option>
                        {colors.map((color) => (
                        <option key={color.colorId} value={color.colorId}>
                            {color.colorName}
                        </option>
                        ))}
                    </select>
                    </td>
                    <td>
                    <input
                        type="number"
                        value={row.basicPrice}
                        onChange={(e) => {
                        if (!validateSequence(row.id, "other")) {
                            return;
                        }
                        updateOrderRow(
                            row.id,
                            "basicPrice",
                            parseInt(e.target.value) || 0
                        );
                        }}
                        onFocus={(e) => {
                        if (!validateSequence(row.id, "other")) {
                            e.target.blur();
                            return;
                        }
                        }}
                        disabled={loading}
                    />
                    </td>
                    <td>
                    <input
                        type="number"
                        value={row.additionalPrice}
                        onChange={(e) =>
                        updateOrderRow(
                            row.id,
                            "additionalPrice",
                            parseInt(e.target.value) || 0
                        )
                        }
                        disabled={loading}
                    />
                    </td>
                    <td>
                    <input
                        type="number"
                        value={row.centerPrice}
                        onChange={(e) =>
                        updateOrderRow(
                            row.id,
                            "centerPrice",
                            parseInt(e.target.value) || 0
                        )
                        }
                        disabled={loading}
                    />
                    </td>
                    <td>
                    <input
                        type="number"
                        value={row.assistancePrice}
                        onChange={(e) =>
                        updateOrderRow(
                            row.id,
                            "assistancePrice",
                            parseInt(e.target.value) || 0
                        )
                        }
                        disabled={loading}
                    />
                    </td>
                    <td>
                    <input
                        type="number"
                        value={row.mainStoneCount}
                        onChange={(e) =>
                        updateOrderRow(
                            row.id,
                            "mainStoneCount",
                            parseInt(e.target.value) || 0
                        )
                        }
                        disabled={loading}
                    />
                    </td>
                    <td>
                    <input
                        type="number"
                        value={row.assistanceStoneCount}
                        onChange={(e) =>
                        updateOrderRow(
                            row.id,
                            "assistanceStoneCount",
                            parseInt(e.target.value) || 0
                        )
                        }
                        disabled={loading}
                    />
                    </td>
                    <td>
                    <input
                        type="number"
                        step="0.01"
                        value={row.stoneWeightTotal}
                        onChange={(e) =>
                        updateOrderRow(
                            row.id,
                            "stoneWeightTotal",
                            parseFloat(e.target.value) || 0
                        )
                        }
                        disabled={loading}
                    />
                    </td>
                    <td>
                    <input
                        type="text"
                        value={row.mainStoneNote}
                        onChange={(e) =>
                        updateOrderRow(row.id, "mainStoneNote", e.target.value)
                        }
                        disabled={loading}
                    />
                    </td>
                    <td>
                    <input
                        type="text"
                        value={row.assistanceStoneNote}
                        onChange={(e) =>
                        updateOrderRow(
                            row.id,
                            "assistanceStoneNote",
                            e.target.value
                        )
                        }
                        disabled={loading}
                    />
                    </td>
                    <td>
                    <input
                        type="text"
                        value={row.productSize}
                        onChange={(e) =>
                        updateOrderRow(row.id, "productSize", e.target.value)
                        }
                        disabled={loading}
                        placeholder="호"
                    />
                    </td>
                    <td>
                    <select
                        value={row.priorityName}
                        onChange={(e) =>
                        updateOrderRow(row.id, "priorityName", e.target.value)
                        }
                        disabled={loading}
                    >
                        <option value="일반">일반</option>
                        <option value="급">급</option>
                        <option value="초급">초급</option>
                    </select>
                    </td>
                    <td>
                    <input
                        type="text"
                        value={row.orderNote}
                        onChange={(e) =>
                        updateOrderRow(row.id, "orderNote", e.target.value)
                        }
                        disabled={loading}
                    />
                    </td>
                    <td>
                    <input
                        type="date"
                        value={row.deliveryDate}
                        onChange={(e) =>
                        updateOrderRow(row.id, "deliveryDate", e.target.value)
                        }
                        disabled={loading}
                    />
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        {/* 하단 버튼 */}
        <div className="form-actions">
            <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={loading}
            >
            {loading ? "처리 중..." : "주문 등록"}
            </button>
            <button
            className="btn-cancel"
            onClick={handleCancel}
            disabled={loading}
            >
            취소
            </button>
            <button
            className="btn-add-row"
            onClick={addOrderRow}
            disabled={loading}
            >
            + 주문 추가
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

export default OrderCreatePage;
