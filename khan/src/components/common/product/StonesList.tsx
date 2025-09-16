import React from "react";
import type { StoneSearchDto } from "../../../types/stone";
import "../../../styles/components/stoneSearch.css";

interface StonesListProps {
	stones: StoneSearchDto[];
	onSelectStone: (stone: StoneSearchDto) => void;
	currentStoneId?: string;
}

const StonesList: React.FC<StonesListProps> = ({
	stones,
	onSelectStone,
	currentStoneId,
}) => {
	const handleStoneSelect = (stone: StoneSearchDto) => {
		onSelectStone(stone);
	};

	return (
		<div className="stones-list">
			{stones.length > 0 ? (
				<>
					<div className="stones-table">
						{/* 테이블 헤더 */}
						<div className="table-header">
							<span className="col-name">스톤명</span>
							<span className="col-weight">무게</span>
							<span className="col-price">구매단가</span>
							<span className="col-grade1">1등급</span>
							<span className="col-grade2">2등급</span>
							<span className="col-grade3">3등급</span>
							<span className="col-grade4">4등급</span>
							<span className="col-action">선택</span>
						</div>

						{/* 스톤 목록 */}
						{stones.map((stone) => {
							const grade1 = stone.stoneWorkGradePolicyDto?.find(
								(p) => p.grade === "GRADE_1"
							);
							const grade2 = stone.stoneWorkGradePolicyDto?.find(
								(p) => p.grade === "GRADE_2"
							);
							const grade3 = stone.stoneWorkGradePolicyDto?.find(
								(p) => p.grade === "GRADE_3"
							);
							const grade4 = stone.stoneWorkGradePolicyDto?.find(
								(p) => p.grade === "GRADE_4"
							);

							return (
								<div
									key={stone.stoneId}
									className={`table-row ${
										stone.stoneId === currentStoneId ? "current" : ""
									}`}
								>
									<span className="col-name" title={stone.stoneName}>
										{stone.stoneName}
									</span>
									<span className="col-weight">{stone.stoneWeight || "0"}</span>
									<span className="col-price">
										₩{stone.stonePurchasePrice?.toLocaleString() || "0"}
									</span>
									<span className="col-grade1">
										{grade1?.laborCost?.toLocaleString() || "0"}
									</span>
									<span className="col-grade2">
										{grade2?.laborCost?.toLocaleString() || "0"}
									</span>
									<span className="col-grade3">
										{grade3?.laborCost?.toLocaleString() || "0"}
									</span>
									<span className="col-grade4">
										{grade4?.laborCost?.toLocaleString() || "0"}
									</span>
									<span className="col-action">
										<button
											className="select-button"
											onClick={() => handleStoneSelect(stone)}
										>
											선택
										</button>
									</span>
								</div>
							);
						})}
					</div>
				</>
			) : (
				<div className="no-results">검색된 스톤이 없습니다.</div>
			)}
		</div>
	);
};

export default StonesList;
