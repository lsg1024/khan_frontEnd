import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, isApiSuccess } from "../../libs/api";
import { useErrorHandler } from "../utils/errorHandler";
import ProductInfo from "../components/common/catalog/BasicInfo";
import PriceTable from "../components/common/catalog/PriceTable";
import StoneTable from "../components/common/catalog/StoneTable";
import type { ProductData } from "../types/product";
import type { ProductWorkGradePolicyGroupDto } from "../types/price";
import type { ProductStoneDto } from "../types/stone";
import "../styles/pages/ProductDetailPage.css";
import "../styles/components/common.css";

interface ProductCreate extends ProductData {
  productWorkGradePolicyGroupDto: ProductWorkGradePolicyGroupDto[];
  productStoneDtos: ProductStoneDto[];
  productImageDtos: { imagePath: string }[]; // 생성 시 비워둠
}

function buildCreatePayload(p: ProductCreate) {
  return {
    factoryId: p.factoryId || undefined,
    productFactoryName: p.factoryName ?? "",
    productName: p.productName ?? "",
    setType: p.setTypeDto?.setTypeId ?? "",
    classification: p.classificationDto?.classificationId ?? "",
    material: p.materialDto?.materialId ?? "",
    standardWeight: p.standardWeight ?? "0",
    productNote: p.productNote ?? "",
    productWorkGradePolicyGroupDto: (
      p.productWorkGradePolicyGroupDto || []
    ).map((g) => ({
      productPurchasePrice: g.productPurchasePrice ?? 0,
      colorId: g.colorId || "",
      policyDtos: (g.gradePolicyDtos || []).map((pol) => ({
        grade: pol.grade || "",
        laborCost: pol.laborCost ?? 0,
      })),
      note: g.note ?? "",
    })),
    productStoneDtos: (p.productStoneDtos || []).map((s) => ({
      stoneId: s.stoneId || "",
      isMainStone: !!s.isMainStone,
      isIncludeStone: !!s.isIncludeStone,
      stoneQuantity: s.stoneQuantity ?? 0,
      productStoneNote: s.productStoneNote ?? "",
    })),
  };
}

/** 생성 시 기본(빈) 상품 */
const EMPTY_PRODUCT: ProductCreate = {
  productId: "", // 생성 전이므로 빈 값
  productName: "",
  productFactoryName: "",
  standardWeight: "0",
  productNote: "",
  factoryId: 0,
  factoryName: "",
  setTypeDto: { setTypeId: "1", setTypeName: "", setTypeNote: "" },
  classificationDto: {
    classificationId: "1",
    classificationName: "",
    classificationNote: "",
  },
  materialDto: {
    materialId: "1",
    materialName: "",
    materialGoldPurityPercent: "0.00",
  },
  productWorkGradePolicyGroupDto: [],
  productStoneDtos: [], // 필요 시 UI에서 추가
  productImageDtos: [],
};

function ProductCreatePage() {
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductCreate>(EMPTY_PRODUCT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const { handleError } = useErrorHandler();

  // 유효성 검사 함수
  const validateProduct = (): boolean => {
    const errors: Record<string, string> = {};

    // 필수 입력값 검사
    if (!product.productName.trim()) {
      errors.productName = "상품명은 필수 입력값입니다.";
    }

    if (!product.factoryId || product.factoryId === 0) {
      errors.factoryId = "제조사는 필수 선택값입니다.";
    }

    const groups = product.productWorkGradePolicyGroupDto || [];

    if (groups.length === 0) {
      errors["productWorkGradePolicyGroupDto[0]"] =
        "기본 공임 행을 1개 이상 등록하세요.";
    } else {
      const base = groups[0];

      // 색상
      if (!base.colorId || base.colorId === "0") {
        errors[`productWorkGradePolicyGroupDto[0].colorId`] =
          "색상은 필수 선택값입니다.";
      }

      // 구매 공임(> 0 권장)
      if (base.productPurchasePrice == null || base.productPurchasePrice <= 0) {
        errors[`productWorkGradePolicyGroupDto[0].productPurchasePrice`] =
          "구매 공임을 입력하세요.";
      }

      // 1~4등급 공임(> 0 권장)
      const policies = base.gradePolicyDtos || [];
      // 등급이 배열에 없는 경우도 대비
      const ensurePolicy = (
        grade: "GRADE_1" | "GRADE_2" | "GRADE_3" | "GRADE_4"
      ) => {
        const idx = policies.findIndex((p) => p.grade === grade);
        return { idx, item: idx >= 0 ? policies[idx] : undefined };
      };

      (["GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4"] as const).forEach(
        (g, order) => {
          const { idx, item } = ensurePolicy(g);
          if (!item || item.laborCost == null || item.laborCost <= 0) {
            // 각각의 칸에 바인딩할 수 있도록 구체 키를 만듭니다.
            const key =
              idx >= 0
                ? `productWorkGradePolicyGroupDto[0].gradePolicyDtos[${idx}].laborCost`
                : `productWorkGradePolicyGroupDto[0].gradePolicyDtos[${order}].laborCost`;
            errors[key] = `${g.replace("GRADE_", "")}등급 공임을 입력하세요.`;
          }
        }
      );
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 서버 에러를 유효성 에러로 변환
  const handleServerValidationError = (
    serverErrors: Record<string, string>
  ) => {
    setValidationErrors(serverErrors);
  };

  // 공장 선택 → factoryId/factoryName 반영
  const handleFactorySelect = (factoryId: number, factoryName: string) => {
    setProduct((prev) => ({ ...prev, factoryId, factoryName }));
  };

  // 기본 정보 변경
  const handleProductChange = (updated: Partial<ProductData>) => {
    setProduct((prev) => ({ ...prev, ...updated }));
  };

  // 가격 변경
  const handlePriceGroupChange = (
    updated: ProductWorkGradePolicyGroupDto[]
  ) => {
    setProduct((prev) => ({
      ...prev,
      productWorkGradePolicyGroupDto: updated,
    }));
  };
  // 스톤 변경
  const handleStoneChange = (
    rowId: string,
    field: string,
    value: string | number | boolean
  ) => {
    setProduct((prev) => {
      const updated = prev.productStoneDtos.map((stone) => {
        if (stone.productStoneId !== rowId) return stone;

        if (field.startsWith("grade_")) {
          const num = field.split("_")[1];
          const grade = `GRADE_${num}`;
          const policies = (stone.stoneWorkGradePolicyDtos || []).map((p) =>
            p.grade === grade ? { ...p, laborCost: Number(value) } : p
          );
          return { ...stone, stoneWorkGradePolicyDtos: policies };
        }

        switch (field) {
          case "stoneId":
            return { ...stone, stoneId: String(value) };
          case "stoneName":
            return { ...stone, stoneName: String(value) };
          case "stoneWeight":
            return { ...stone, stoneWeight: String(value) };
          case "stonePurchase":
            return { ...stone, stonePurchase: Number(value) };
          case "stoneQuantity":
            return { ...stone, stoneQuantity: Number(value) };
          case "mainStone":
            return { ...stone, mainStone: Boolean(value) };
          case "includeStone":
            return { ...stone, includeStone: Boolean(value) };
          case "note":
            return { ...stone, productStoneNote: String(value) };
          default:
            return stone;
        }
      });

      return { ...prev, productStoneDtos: updated };
    });
  };

  // 스톤 추가 (임시 키로 식별)
  const handleAddStone = () => {
    setProduct((prev) => {
      const seq = prev.productStoneDtos.length + 1;
      const newStone: ProductStoneDto = {
        productStoneId: `new_${Date.now()}_${seq}`,
        stoneId: "",
        stoneName: "",
        stoneWeight: "0",
        isMainStone: false,
        isIncludeStone: true,
        stonePurchase: 0,
        stoneQuantity: 1,
        productStoneNote: "",
        stoneWorkGradePolicyDtos: [
          { workGradePolicyId: "", grade: "GRADE_1", laborCost: 0 },
          { workGradePolicyId: "", grade: "GRADE_2", laborCost: 0 },
          { workGradePolicyId: "", grade: "GRADE_3", laborCost: 0 },
          { workGradePolicyId: "", grade: "GRADE_4", laborCost: 0 },
        ],
      };
      return {
        ...prev,
        productStoneDtos: [...prev.productStoneDtos, newStone],
      };
    });
  };

  const handleDeleteStone = (rowId: string) => {
    setProduct((prev) => ({
      ...prev,
      productStoneDtos: prev.productStoneDtos.filter(
        (s) => s.productStoneId !== rowId
      ),
    }));
  };

  // 저장(생성)
  const handleCreateProduct = async () => {
    try {
      setLoading(true);
      setError("");
      setValidationErrors({});

      // 프론트엔드 유효성 검사
      if (!validateProduct()) {
        setLoading(false);
        return;
      }

      const payload = buildCreatePayload(product);
      const res = await apiRequest.post<{ productId?: string }>(
        "product/products",
        payload
      );

      if (isApiSuccess(res)) {
        const { factoryId, factoryName } = product;
        const again = window.confirm(
          "상품이 생성되었습니다.\n추가 등록 하시겠습니까?"
        );

        if (again) {
          // factoryId, factoryName 유지한 채 폼만 초기화
          setProduct({
            ...EMPTY_PRODUCT,
            factoryId,
            factoryName,
          });
          setValidationErrors({});
          setError("");
        } else {
          navigate("/catalog");
        }
      } else {
        // 서버 유효성 검사 에러 처리
        if (
          res.data &&
          typeof res.data === "object" &&
          !Array.isArray(res.data)
        ) {
          handleServerValidationError(res.data as Record<string, string>);
        } else {
          setError(
            typeof res.data === "string" ? res.data : "생성에 실패했습니다."
          );
        }
      }
    } catch (err: unknown) {
      handleError(err, setError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => navigate("/catalog");

  useEffect(() => {
    // 생성 페이지는 서버 로드 없음
  }, []);

  return (
    <div className="product-detail-page">
      <div className="detail-content">
        {/* 상단 섹션: 기본정보 + 이미지(생성시 placeholder) */}
        <div className="top-section">
          <ProductInfo
            product={product}
            showTitle={true}
            editable={true}
            onProductChange={handleProductChange}
            onFactorySelect={handleFactorySelect}
            validationErrors={validationErrors}
          />

          <div className="image-section">
            <div className="no-image">
              <img src="/images/not_ready.png" alt="이미지 없음" />
            </div>
          </div>
        </div>

        {/* 가격 정보 섹션 */}
        <PriceTable
          priceGroups={product.productWorkGradePolicyGroupDto}
          showTitle={true}
          editable={true}
          onPriceGroupChange={handlePriceGroupChange}
          validationErrors={validationErrors}
        />

        {/* 스톤 정보 섹션 */}
        <StoneTable
          stones={product.productStoneDtos}
          showTitle={true}
          showTotalRow={true}
          showManualTotalRow={true}
          editable={true}
          showAddButton={true}
          fieldPermissions={{
            stoneName: false,
            stoneWeight: false,
            stonePurchase: false,
            grades: false,
            mainStone: true,
            includeStone: true,
            stoneQuantity: true,
            note: true,
          }}
          onStoneChange={handleStoneChange}
          onAddStone={handleAddStone}
          onDeleteStone={handleDeleteStone}
        />

        {/* 버튼 섹션 */}
        <div className="action-buttons">
          <button onClick={handleGoBack} className="back-button">
            뒤로
          </button>
          <button
            onClick={handleCreateProduct}
            className="save-button"
            disabled={loading}
          >
            {loading ? "생성 중..." : "생성"}
          </button>
        </div>

        {error && (
          <div className="error-container" style={{ marginTop: 12 }}>
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCreatePage;
