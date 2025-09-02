import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest, isApiSuccess } from "../../libs/api";
import { useErrorHandler } from "../utils/errorHandler";
import StoneTable from "../components/common/catalog/StoneTable";
import PriceTable from "../components/common/catalog/PriceTable";
import BasicInfo from "../components/common/catalog/BasicInfo";
import type { ProductStoneDto } from "../types/stone";
import type { ProductWorkGradePolicyGroupDto } from "../types/price";
import type {
  SetTypeDto,
  ClassificationDto,
  MaterialDto,
} from "../types/basicInfo";
import "../styles/pages/ProductDetailPage.css";
import "../styles/components/common.css";

// 백엔드 DTO에 맞는 타입 정의
interface ProductImageDto {
  imagePath: string;
}

interface ProductDetail {
  productId: string;
  factoryId: number; // Long -> number
  factoryName: string;
  productFactoryName: string;
  productName: string;
  standardWeight: string;
  productNote: string;
  setTypeDto: SetTypeDto;
  classificationDto: ClassificationDto;
  materialDto: MaterialDto;
  productWorkGradePolicyGroupDto: ProductWorkGradePolicyGroupDto[];
  productStoneDtos: ProductStoneDto[];
  productImageDtos: ProductImageDto[];
}

function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const { handleError } = useErrorHandler();

  // 편집 상태 관리
  const [editedNote, setEditedNote] = useState<string>("");
  const [editedPurchasePrices, setEditedPurchasePrices] = useState<{
    [key: string]: string;
  }>({});
  const [editedLaborCosts, setEditedLaborCosts] = useState<{
    [key: string]: string;
  }>({});
  const [editedColors, setEditedColors] = useState<{ [key: string]: string }>(
    {}
  );
  const [editedNotes, setEditedNotes] = useState<{ [key: string]: string }>({});

  // 기본 정보 편집 상태 관리
  const [editedProductName, setEditedProductName] = useState<string>("");
  const [editedProductFactoryName, setEditedProductFactoryName] =
    useState<string>("");
  const [editedStandardWeight, setEditedStandardWeight] = useState<string>("");
  const [editedMaterialId, setEditedMaterialId] = useState<string>("");
  const [editedClassificationId, setEditedClassificationId] =
    useState<string>("");
  const [editedSetTypeId, setEditedSetTypeId] = useState<string>("");
  const [editedFactoryId, setEditedFactoryId] = useState<number>(0);
  const [editedFactoryName, setEditedFactoryName] = useState<string>("");

  // 이미지 슬라이더 상태 관리
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // 이미지 슬라이더 네비게이션 함수들
  const nextImage = useCallback(() => {
    if (product?.productImageDtos && product.productImageDtos.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === product.productImageDtos.length - 1 ? 0 : prev + 1
      );
    }
  }, [product?.productImageDtos]);

  const prevImage = useCallback(() => {
    if (product?.productImageDtos && product.productImageDtos.length > 1) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.productImageDtos.length - 1 : prev - 1
      );
    }
  }, [product?.productImageDtos]);

  const goToImage = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  // 색상 변경 핸들러 (추후 서버 연동용)
  const handleColorChange = (groupId: string, newColor: string) => {
    setEditedColors((prev) => ({
      ...prev,
      [groupId]: newColor,
    }));
  };

  // 공장 선택 핸들러
  const handleFactorySelect = (factoryId: number, factoryName: string) => {
    setEditedFactoryId(factoryId);
    setEditedFactoryName(factoryName);

    // 상품 정보에도 반영
    if (product) {
      setProduct((prevProduct) => {
        if (!prevProduct) return prevProduct;
        const updatedProduct = {
          ...prevProduct,
          factoryId: factoryId,
          factoryName: factoryName,
        };
        return updatedProduct;
      });
    }


  };

  // 스톤 정보 변경 핸들러
  const handleStoneChange = (
    stoneId: string,
    field: string,
    value: string | number | boolean
  ) => {
    if (!product) return;

    setProduct((prevProduct) => {
      if (!prevProduct) return prevProduct;

      const updatedStones = prevProduct.productStoneDtos.map((stone) => {
        if (stone.productStoneId !== stoneId) return stone;

        // 등급별 가격 처리
        if (field.startsWith("grade_")) {
          const gradeNumber = field.split("_")[1];
          const gradeType = `GRADE_${gradeNumber}`;

          const updatedGradePolicies = stone.stoneWorkGradePolicyDtos.map(
            (policy) => {
              if (policy.grade === gradeType) {
                return { ...policy, laborCost: Number(value) };
              }
              return policy;
            }
          );

          return {
            ...stone,
            stoneWorkGradePolicyDtos: updatedGradePolicies,
          };
        }

        // 일반 필드 처리
        switch (field) {
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

      return {
        ...prevProduct,
        productStoneDtos: updatedStones,
      };
    });
  };

  // 스톤 추가 핸들러
  const handleAddStone = () => {
    if (!product) return;

    // 새로운 스톤 ID 생성 (기존 스톤 ID의 최대값 + 1)
    const existingIds = product.productStoneDtos.map(
      (stone) => parseInt(stone.productStoneId.replace(/[^0-9]/g, "")) || 0
    );
    const newId = Math.max(...existingIds, 0) + 1;

    // 새로운 스톤 객체 생성
    const newStone: ProductStoneDto = {
      productStoneId: `new_stone_${newId}`,
      stoneId: `stone_${newId}`,
      stoneName: "",
      stoneWeight: "0",
      mainStone: false,
      includeStone: true,
      stonePurchase: 0,
      stoneQuantity: 1,
      productStoneNote: "",
      stoneWorkGradePolicyDtos: [
        {
          workGradePolicyId: `policy_${newId}_1`,
          grade: "GRADE_1",
          laborCost: 0,
        },
        {
          workGradePolicyId: `policy_${newId}_2`,
          grade: "GRADE_2",
          laborCost: 0,
        },
        {
          workGradePolicyId: `policy_${newId}_3`,
          grade: "GRADE_3",
          laborCost: 0,
        },
        {
          workGradePolicyId: `policy_${newId}_4`,
          grade: "GRADE_4",
          laborCost: 0,
        },
      ],
    };

    // 상품 상태에 새로운 스톤 추가
    setProduct((prevProduct) => {
      if (!prevProduct) return prevProduct;

      return {
        ...prevProduct,
        productStoneDtos: [...prevProduct.productStoneDtos, newStone],
      };
    });
  };

  // 스톤 삭제 핸들러
  const handleDeleteStone = (stoneId: string) => {
    if (!product) return;

    if (window.confirm("정말로 이 스톤을 삭제하시겠습니까?")) {
      // 상품 상태에서 해당 스톤 제거
      setProduct((prevProduct) => {
        if (!prevProduct) return prevProduct;

        return {
          ...prevProduct,
          productStoneDtos: prevProduct.productStoneDtos.filter(
            (stone) => stone.productStoneId !== stoneId
          ),
        };
      });
    }
  };

  // 상품 상세 정보 로드
  const loadProductDetail = async () => {
    if (!productId) {
      setError("상품 ID가 없습니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await apiRequest.get<ProductDetail>(
        `product/products/${productId}`
      );

      if (isApiSuccess(response) && response.data) {
        setProduct(response.data);
      } else {
        setError("상품 정보를 불러올 수 없습니다.");
      }
    } catch (err: unknown) {
      handleError(err, setError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductDetail();
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 상품이 변경될 때 이미지 인덱스 초기화
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product?.productImageDtos]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (product?.productImageDtos && product.productImageDtos.length > 1) {
        if (event.key === "ArrowLeft") {
          prevImage();
        } else if (event.key === "ArrowRight") {
          nextImage();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [nextImage, prevImage, product?.productImageDtos]);

  // product가 변경될 때마다 편집 상태를 동기화
  useEffect(() => {
    if (product) {
      setEditedNote(product.productNote || "");

      // 기본 정보 편집 상태 초기화
      setEditedProductName(product.productName || "");
      setEditedProductFactoryName(product.productFactoryName || "");
      setEditedStandardWeight(product.standardWeight || "");
      setEditedMaterialId(product.materialDto?.materialId || "");
      setEditedClassificationId(
        product.classificationDto?.classificationId || ""
      );
      setEditedSetTypeId(product.setTypeDto?.setTypeId || "");
      setEditedFactoryId(product.factoryId || 0);
      setEditedFactoryName(product.factoryName || "");

      const purchasePrices: { [key: string]: string } = {};
      const laborCosts: { [key: string]: string } = {};
      const colors: { [key: string]: string } = {};
      const note: { [key: string]: string } = {};

      product.productWorkGradePolicyGroupDto.forEach((group) => {
        purchasePrices[group.productGroupId] =
          group.productPurchasePrice.toString();
        colors[group.productGroupId] = group.colorName;
        note[group.productGroupId] = group.note || "";
        group.gradePolicyDtos.forEach((policy) => {
          laborCosts[policy.workGradePolicyId] = policy.laborCost.toString();
        });
      });

      setEditedPurchasePrices(purchasePrices);
      setEditedLaborCosts(laborCosts);
      setEditedColors(colors);
      setEditedNotes(note);
    }
  }, [product]);

  // 뒤로가기
  const handleGoBack = () => {
    navigate("/catalog");
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>상품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="error-container">
          <span className="error-icon">⚠️</span>
          <h3>오류가 발생했습니다</h3>
          <p>{error || "상품 정보를 찾을 수 없습니다."}</p>
          <button onClick={handleGoBack} className="back-button">
            카탈로그로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      {/* 헤더 */}
      <div className="detail-header">
        <button onClick={handleGoBack} className="back-button">
          ← 뒤로가기
        </button>
      </div>

      <div className="detail-content">
        {/* 상단 섹션: 기본정보와 이미지 */}
        <div className="top-section">
          {/* 기본 정보 섹션 */}
          <BasicInfo
            productId={product.productId}
            factoryId={product.factoryId}
            factoryName={product.factoryName}
            productName={product.productName}
            productFactoryName={product.productFactoryName}
            standardWeight={product.standardWeight}
            productNote={product.productNote}
            setTypeDto={product.setTypeDto}
            classificationDto={product.classificationDto}
            materialDto={product.materialDto}
            showTitle={true}
            editable={true}
            editedNote={editedNote}
            onNoteChange={setEditedNote}
            editedProductName={editedProductName}
            editedProductFactoryName={editedProductFactoryName}
            editedStandardWeight={editedStandardWeight}
            editedMaterialId={editedMaterialId}
            editedClassificationId={editedClassificationId}
            editedSetTypeId={editedSetTypeId}
            editedFactoryId={editedFactoryId}
            editedFactoryName={editedFactoryName}
            onProductNameChange={setEditedProductName}
            onProductFactoryNameChange={setEditedProductFactoryName}
            onStandardWeightChange={setEditedStandardWeight}
            onMaterialChange={setEditedMaterialId}
            onClassificationChange={setEditedClassificationId}
            onSetTypeChange={setEditedSetTypeId}
            onFactorySelect={handleFactorySelect}
          />

          {/* 이미지 섹션 */}
          <div className="image-section">
            {product.productImageDtos && product.productImageDtos.length > 0 ? (
              <div className="image-slider">
                {/* 메인 이미지 */}
                <div className="main-image-container">
                  {product.productImageDtos.length > 1 && (
                    <button className="image-nav prev" onClick={prevImage}>
                      ‹
                    </button>
                  )}
                  <img
                    src={`/@fs/C:/Users/zks14/Desktop/multi_module/product-service/src/main/resources${product.productImageDtos[currentImageIndex].imagePath}`}
                    alt={`${product.productName} ${currentImageIndex + 1}`}
                    onError={(e) => {
                      e.currentTarget.src = "/images/not_ready.png";
                    }}
                  />
                  {product.productImageDtos.length > 1 && (
                    <button className="image-nav next" onClick={nextImage}>
                      ›
                    </button>
                  )}
                </div>

                {/* 이미지 인디케이터 */}
                {product.productImageDtos.length > 1 && (
                  <div className="image-indicators">
                    {product.productImageDtos.map((_, index) => (
                      <button
                        key={index}
                        className={`indicator ${
                          index === currentImageIndex ? "active" : ""
                        }`}
                        onClick={() => goToImage(index)}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-image">
                <img src="/images/not_ready.png" alt="이미지 없음" />
              </div>
            )}
          </div>
        </div>

        {/* 가격 정보 섹션 */}
        <PriceTable
          priceGroups={product.productWorkGradePolicyGroupDto}
          showTitle={true}
          editable={true}
          editedPurchasePrices={editedPurchasePrices}
          editedLaborCosts={editedLaborCosts}
          editedColors={editedColors}
          editedNotes={editedNotes}
          onColorChange={handleColorChange}
          onPurchasePriceChange={(groupId, value) =>
            setEditedPurchasePrices((prev) => ({
              ...prev,
              [groupId]: value,
            }))
          }
          onLaborCostChange={(workGradePolicyId, value) =>
            setEditedLaborCosts((prev) => ({
              ...prev,
              [workGradePolicyId]: value,
            }))
          }
          onNoteChange={(groupId, value) =>
            setEditedNotes((prev) => ({
              ...prev,
              [groupId]: value,
            }))
          }
        />

        {/* 스톤 정보 섹션 */}
        <StoneTable
          stones={product.productStoneDtos || []}
          showTitle={true}
          showTotalRow={true}
          showManualTotalRow={true}
          editable={true}
          showAddButton={true}
          fieldPermissions={{
            stoneName: false, // 스톤명: 수정 불가 (회색)
            stoneWeight: false, // 개당중량: 수정 불가 (회색)
            stonePurchase: false, // 구매단가: 수정 불가 (회색)
            grades: false, // 등급별 판매단가: 수정 불가 (회색)
            mainStone: true, // 메인구분: 수정 가능
            includeStone: true, // 적용: 수정 가능
            stoneQuantity: true, // 알수: 수정 가능
            note: true, // 비고: 수정 가능
          }}
          onStoneChange={handleStoneChange}
          onAddStone={handleAddStone}
          onDeleteStone={handleDeleteStone}
        />
      </div>
    </div>
  );
}

export default ProductDetailPage;
