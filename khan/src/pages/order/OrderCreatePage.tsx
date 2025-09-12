import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { factoryApi } from "../../../libs/api/factory";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { useErrorHandler } from "../../utils/errorHandler";
import type { OrderRowData, OrderCreateRequest } from "../../types/order";
import type { FactorySearchDto } from "../../types/factory";
import type { StoreSearchDto } from "../../types/store";
import StoreSearch from "../../components/common/product/StoreSearch";
import FactorySearch from "../../components/common/product/FactorySearch";
import "../../styles/pages/OrderCreatePage.css";

const OrderCreatePage = () => {
    const navigate = useNavigate();
    const { handleError } = useErrorHandler();

    // 주문 행 데이터
    const [orderRows, setOrderRows] = useState<OrderRowData[]>([]);

    // 검색 모달 상태
    const [isStoreSearchOpen, setIsStoreSearchOpen] = useState(false);
    const [isFactorySearchOpen, setIsFactorySearchOpen] = useState(false);
    const [selectedRowForStore, setSelectedRowForStore] = useState<string>("");
    const [selectedRowForFactory, setSelectedRowForFactory] =
        useState<string>("");

    // 드롭다운 데이터
    const [factories, setFactories] = useState<{ factoryId: string; factoryName: string }[]>([]);
    const [products] = useState([
        { productId: "1", productName: "반지", imagePath: "/images/ring.jpg" },
        {
        productId: "2",
        productName: "목걸이",
        imagePath: "/images/necklace.jpg",
        },
    ]);
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
        deliveryDate: new Date().toISOString().split("T")[0],
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
        setOrderRows(
        orderRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
        );
    };

    // 거래처 검색 모달 열기
    const openStoreSearch = (rowId: string) => {
        setSelectedRowForStore(rowId);
        setIsStoreSearchOpen(true);
    };

    // 거래처 선택 처리
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

    // 제조사 검색 모달 열기
    const openFactorySearch = (rowId: string) => {
        setSelectedRowForFactory(rowId);
        setIsFactorySearchOpen(true);
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
        setIsFactorySearchOpen(false);
        setSelectedRowForFactory("");
    };

    // 초기 데이터 로드
    useEffect(() => {
        const loadInitialData = async () => {
        try {
            setLoading(true);

            // 기본 드롭다운 데이터만 로드
            const [factoryRes, materialRes, colorRes] = await Promise.all([
            factoryApi.getFactories("", 1),
            materialApi.getMaterials(),
            colorApi.getColors(),
            ]);

            if (factoryRes.success) {
            const factories = (factoryRes.data?.content || []).map((f) => ({
                factoryId: f.factoryId?.toString() || "",
                factoryName: f.factoryName,
            }));
            setFactories(factories);
            }
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
                // 새로운 필드들
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
    }, []);

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
        {/* 헤더 */}
        <div className="page-header">
            <h1>주문 등록</h1>
            <div className="header-actions">
            <button
                className="btn-add-row"
                onClick={addOrderRow}
                disabled={loading}
            >
                + 주문 추가
            </button>
            </div>
        </div>

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
                <th>거래처</th>
                <th>모델번호</th>
                <th>제조사</th>
                <th>재질</th>
                <th>색상</th>
                <th>기본단가</th>
                <th>추가단가</th>
                <th>중심단가</th>
                <th>보조단가</th>
                <th>메인알수</th>
                <th>보조알수</th>
                <th>알중량</th>
                <th>메인메모</th>
                <th>보조메모</th>
                <th>사이즈</th>
                <th>우선순위</th>
                <th>메모</th>
                <th>출고일</th>
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
                    <select
                        value={row.productId}
                        onChange={(e) => {
                        const selectedProduct = products.find(
                            (p) => p.productId === e.target.value
                        );
                        updateOrderRow(row.id, "productId", e.target.value);
                        updateOrderRow(
                            row.id,
                            "productName",
                            selectedProduct?.productName || ""
                        );
                        updateOrderRow(
                            row.id,
                            "productImage",
                            selectedProduct?.imagePath || ""
                        );
                        }}
                        disabled={loading}
                    >
                        <option value="">선택</option>
                        {products.map((product) => (
                        <option key={product.productId} value={product.productId}>
                            {product.productName}
                        </option>
                        ))}
                    </select>
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
                        onChange={(e) =>
                        updateOrderRow(
                            row.id,
                            "basicPrice",
                            parseInt(e.target.value) || 0
                        )
                        }
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
            isOpen={isFactorySearchOpen}
            onClose={() => {
            setIsFactorySearchOpen(false);
            setSelectedRowForFactory("");
            }}
            onSelectFactory={handleFactorySelect}
        />
        </div>
    );
};

export default OrderCreatePage;
