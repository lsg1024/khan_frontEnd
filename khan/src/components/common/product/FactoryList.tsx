import React from "react";
import "../../../styles/components/factoryList.css";
import type { FactorySearchDto } from "../../../types/factory";

interface FactoryListProps {
  factories: FactorySearchDto[];
  onSelectFactory: (factory: FactorySearchDto) => void;
}

const FactoryList: React.FC<FactoryListProps> = ({
  factories,
  onSelectFactory,
}) => {
  const handleFactorySelect = (factory: FactorySearchDto) => {
    onSelectFactory(factory);
  };

  return (
    <div className="factories-list">
      {factories.length > 0 ? (
        <>
          <div className="factories-table">
            {/* 테이블 헤더 */}
            <div className="table-header">
              <span className="col-name">제조사명</span>
              <span className="col-owner">대표자</span>
              <span className="col-phone">연락처</span>
              <span className="col-level">등급</span>
              <span className="col-harry">해리</span>
              <span className="col-trade">거래방식</span>
              <span className="col-action">선택</span>
            </div>

            {/* 제조사 목록 */}
            {factories.map((factory, index) => (
              <div
                key={factory.factoryId || `factory-${index}`}
                className="table-row"
              >
                <span className="col-name" title={factory.factoryName}>
                  {factory.factoryName}
                </span>
                <span className="col-owner">{factory.factoryOwnerName}</span>
                <span className="col-phone">{factory.factoryPhoneNumber}</span>
                <span className="col-level">
                  <span
                    className={`level-badge level-${factory.level.toLowerCase()}`}
                  >
                    {factory.level === "ONE"
                      ? "1급"
                      : factory.level === "TWO"
                      ? "2급"
                      : "3급"}
                  </span>
                </span>
                <span className="col-harry">{factory.goldHarryLoss}%</span>
                <span className="col-trade">
                  {factory.tradeType === "WEIGHT" ? "무게" : "개수"}
                </span>
                <span className="col-action">
                  <button
                    className="select-button"
                    onClick={() => handleFactorySelect(factory)}
                  >
                    선택
                  </button>
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="no-results">검색된 제조사가 없습니다.</div>
      )}
    </div>
  );
};

export default FactoryList;
