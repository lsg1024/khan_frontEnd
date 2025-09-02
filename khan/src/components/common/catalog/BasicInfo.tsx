import React, { useState, useEffect, useCallback } from "react";
import type {
  BasicInfoProps,
  ClassificationDto,
  MaterialDto,
  SetTypeDto,
} from "../../../types/basicInfo";
import { basicInfoApi } from "../../../../libs/api";
import UnifiedSearchModal from "./UnifiedSearchModal";
import "../../../styles/components/BasicInfo.css";

const BasicInfo: React.FC<BasicInfoProps> = ({
  productName,
  productFactoryName,
  factoryName,
  standardWeight,
  productNote,
  setTypeDto,
  classificationDto,
  materialDto,
  showTitle = true,
  editable = true,
  editedNote,
  onNoteChange,
  editedProductName,
  editedProductFactoryName,
  editedStandardWeight,
  editedMaterialId,
  editedClassificationId,
  editedSetTypeId,
  editedFactoryId,
  editedFactoryName,
  onProductNameChange,
  onProductFactoryNameChange,
  onStandardWeightChange,
  onMaterialChange,
  onClassificationChange,
  onSetTypeChange,
  onFactoryChange,
  onFactorySelect,
}) => {
  const [classifications, setClassifications] = useState<ClassificationDto[]>(
    []
  );
  const [materials, setMaterials] = useState<MaterialDto[]>([]);
  const [setTypes, setSetTypes] = useState<SetTypeDto[]>([]);
  const [loading, setLoading] = useState(false);

  // 각 드롭다운의 로딩 상태
  const [materialsLoaded, setMaterialsLoaded] = useState(false);
  const [classificationsLoaded, setClassificationsLoaded] = useState(false);
  const [setTypesLoaded, setSetTypesLoaded] = useState(false);

  // 제조사 검색 모달 상태
  const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);

  // 제조사 선택 핸들러
  const handleFactorySelect = (factory: {
    factoryId?: number;
    factoryName: string;
  }) => {
    console.log("BasicInfo에서 받은 factory 데이터:", factory); // 디버깅용

    // 기존 onFactoryChange 호출 (하위 호환성)
    if (onFactoryChange) {
      onFactoryChange(factory.factoryName);
    }

    // 새로운 onFactorySelect 호출 (factoryId와 factoryName 모두 전달)
    if (onFactorySelect) {
      // factoryId가 없으면 0을 기본값으로 사용
      const idToUse = factory.factoryId || 0;
      console.log(
        `ProductDetailPage로 전달할 값: ID=${idToUse}, Name=${factory.factoryName}`
      ); // 디버깅용
      onFactorySelect(idToUse, factory.factoryName);
    }

    // 모달 닫기
    setIsFactoryModalOpen(false);
  };

  // 제조사 검색 버튼 클릭 핸들러
  const handleFactorySearchClick = () => {
    setIsFactoryModalOpen(true);
  };

  // 재질 데이터 로드 함수
  const loadMaterials = useCallback(async () => {
    if (materialsLoaded) return;

    setLoading(true);
    try {
      const materialsRes = await basicInfoApi.getMaterials();
      if (materialsRes.data?.success && materialsRes.data.data) {
        setMaterials(materialsRes.data.data);
        setMaterialsLoaded(true);
      }
    } catch (error) {
      console.error("재질 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [materialsLoaded]);

  // 분류 데이터 로드 함수
  const loadClassifications = useCallback(async () => {
    if (classificationsLoaded) return;

    setLoading(true);
    try {
      const classificationsRes = await basicInfoApi.getClassifications();
      if (classificationsRes.data?.success && classificationsRes.data.data) {
        setClassifications(classificationsRes.data.data);
        setClassificationsLoaded(true);
      }
    } catch (error) {
      console.error("분류 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [classificationsLoaded]);

  // 세트 타입 데이터 로드 함수
  const loadSetTypes = useCallback(async () => {
    if (setTypesLoaded) return;

    setLoading(true);
    try {
      const setTypesRes = await basicInfoApi.getSetTypes();
      if (setTypesRes.data?.success && setTypesRes.data.data) {
        setSetTypes(setTypesRes.data.data);
        setSetTypesLoaded(true);
      }
    } catch (error) {
      console.error("세트 타입 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [setTypesLoaded]);

  // 컴포넌트 마운트시 모든 드롭다운 데이터 로드
  useEffect(() => {
    const loadAllDropdownData = async () => {
      // 모든 API 호출을 병렬로 실행
      await Promise.all([
        loadMaterials(),
        loadClassifications(),
        loadSetTypes(),
      ]);
    };

    if (editable) {
      loadAllDropdownData();
    }
  }, [editable, loadMaterials, loadClassifications, loadSetTypes]);

  return (
    <div className="basic-info-section">
      {showTitle && <h2>기본 정보</h2>}
      <div className="info-grid">
        {/* 상품명과 공장명을 같은 줄에 */}
        <div className="info-row">
          <div className="info-item half-width">
            <span className="label">모델번호:</span>
            {editable ? (
              <input
                type="text"
                className="editable-input"
                value={editedProductName || productName}
                onChange={(e) =>
                  onProductNameChange && onProductNameChange(e.target.value)
                }
                placeholder="모델번호를 입력하세요"
              />
            ) : (
              <span className="value">{productName}</span>
            )}
          </div>
          <div className="info-item half-width">
            <span className="label">제조번호:</span>
            {editable ? (
              <input
                type="text"
                className="editable-input"
                value={editedProductFactoryName || productFactoryName}
                onChange={(e) =>
                  onProductFactoryNameChange &&
                  onProductFactoryNameChange(e.target.value)
                }
                placeholder="제조번호를 입력하세요"
              />
            ) : (
              <span className="value">{productFactoryName}</span>
            )}
          </div>
          <div className="info-item half-width">
            <span className="label">제조사:</span>
            {editable ? (
              <div className="factory-search-container">
                <span className="factory-display-value">
                  {editedFactoryName || factoryName}
                </span>
                <button
                  type="button"
                  className="factory-search-btn"
                  onClick={handleFactorySearchClick}
                >
                  검색
                </button>
              </div>
            ) : (
              <span className="value">{factoryName}</span>
            )}
          </div>
        </div>

        {/* 기준 무게, 재질, 분류, 세트 타입을 같은 줄에 */}
        <div className="info-row">
          <div className="info-item quarter-width">
            <span className="label">무게:</span>
            {editable ? (
              <div className="input-with-unit">
                <input
                  type="text"
                  className="editable-input weight-input"
                  value={editedStandardWeight || standardWeight}
                  onChange={(e) =>
                    onStandardWeightChange &&
                    onStandardWeightChange(e.target.value)
                  }
                  placeholder="무게"
                />
                <span className="unit"></span>
              </div>
            ) : (
              <span className="value">{standardWeight}</span>
            )}
          </div>
          <div className="info-item quarter-width">
            <span className="label">재질:</span>
            {editable ? (
              <select
                className="editable-select"
                value={editedMaterialId || materialDto.materialId}
                onChange={(e) =>
                  onMaterialChange && onMaterialChange(e.target.value)
                }
                disabled={loading}
              >
                <option value={materialDto.materialId}>
                  {materialDto.materialName}
                </option>
                {materials.map((material) => (
                  <option key={material.materialId} value={material.materialId}>
                    {material.materialName}
                  </option>
                ))}
              </select>
            ) : (
              <span className="value">{materialDto.materialName}</span>
            )}
          </div>
          <div className="info-item quarter-width">
            <span className="label">분류:</span>
            {editable ? (
              <select
                className="editable-select"
                value={
                  editedClassificationId || classificationDto.classificationId
                }
                onChange={(e) =>
                  onClassificationChange &&
                  onClassificationChange(e.target.value)
                }
                disabled={loading}
              >
                <option value={classificationDto.classificationId}>
                  {classificationDto.classificationName}
                </option>
                {classifications.map((classification) => (
                  <option
                    key={classification.classificationId}
                    value={classification.classificationId}
                  >
                    {classification.classificationName}
                  </option>
                ))}
              </select>
            ) : (
              <span className="value">
                {classificationDto.classificationName}
              </span>
            )}
          </div>
          <div className="info-item quarter-width">
            <span className="label">세트:</span>
            {editable ? (
              <select
                className="editable-select"
                value={editedSetTypeId || setTypeDto.setTypeId}
                onChange={(e) =>
                  onSetTypeChange && onSetTypeChange(e.target.value)
                }
                disabled={loading}
              >
                <option value={setTypeDto.setTypeId}>
                  {setTypeDto.setTypeName}
                </option>
                {setTypes.map((setType) => (
                  <option key={setType.setTypeId} value={setType.setTypeId}>
                    {setType.setTypeName}
                  </option>
                ))}
              </select>
            ) : (
              <span className="value">{setTypeDto.setTypeName}</span>
            )}
          </div>
        </div>

        {/* 메모는 전체 너비 */}
        {productNote !== undefined && (
          <div className=".info-item.full-width-memo">
            {editable ? (
              <textarea
                className="editable-textarea"
                value={editedNote || productNote || ""}
                onChange={(e) => onNoteChange && onNoteChange(e.target.value)}
                placeholder="메모를 입력하세요..."
              />
            ) : (
              <span className="value">{productNote}</span>
            )}
          </div>
        )}
      </div>

      {/* 제조사 검색 모달 */}
      <UnifiedSearchModal
        isOpen={isFactoryModalOpen}
        onClose={() => setIsFactoryModalOpen(false)}
        onSelectFactory={handleFactorySelect}
        searchType="factory"
      />
    </div>
  );
};

export default BasicInfo;
