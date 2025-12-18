import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { stoneApi } from "../../../libs/api/stone";
import type { StoneInfo } from "../../types/stone";
import type { StoneSearchDto } from "../../types/stone";
import StoneSearch from "../../components/common/stone/StoneSearch";
import { useErrorHandler } from "../../utils/errorHandler";
import "../../styles/pages/stone/StoneInfoPage.css";

const StoneInfoPage: React.FC = () => {
	const [searchParams] = useSearchParams();
	const rowId = searchParams.get("rowId") || "";
	const parentOrigin = searchParams.get("origin") || "*";
	const { handleError } = useErrorHandler();

	const [stoneInfos, setStoneInfos] = useState<StoneInfo[]>([]);
	const [availableStones, setAvailableStones] = useState<StoneSearchDto[]>([]);
	const [loading, setLoading] = useState(false);
	const [storeGrade, setStoreGrade] = useState<string>(""); // store grade 정보

	// 스톤 검색 모달 상태
	const [isStoneSearchOpen, setIsStoneSearchOpen] = useState(false);
	const [selectedStoneIndex, setSelectedStoneIndex] = useState<number>(-1);

	// 스톤 검색 팝업 관리
	const [stoneSearchPopup, setStoneSearchPopup] = useState<Window | null>(null);

	// grade 표시 함수 (GRADE_1 -> 1등급)
	const getGradeDisplayName = (grade: string): string => {
		const gradeMap: { [key: string]: string } = {
			GRADE_1: "1등급",
			GRADE_2: "2등급",
			GRADE_3: "3등급",
			GRADE_4: "4등급",
		};
		return gradeMap[grade] || grade;
	};

	// store grade에 해당하는 기본 등급 결정
	const getDefaultGradeByStoreGrade = useCallback(
		(storeGrade: string): string => {
			// store grade에 따른 기본 등급 매핑
			console.log("getDefaultGradeByStoreGrade " + storeGrade);
			const storeGradeMap: { [key: string]: string } = {
				"1": "GRADE_1",
				"2": "GRADE_2",
				"3": "GRADE_3",
				"4": "GRADE_4",
			};
			return storeGradeMap[storeGrade] || "GRADE_1";
		},
		[]
	);

	// 초기 데이터 로드
	const loadInitialData = useCallback(async () => {
		try {
			setLoading(true);

			// 부모 창에서 현재 스톤 정보 및 store grade 요청
			if (window.opener) {
				window.opener.postMessage(
					{
						type: "REQUEST_STONE_INFO",
						rowId: rowId,
					},
					parentOrigin
				);

				// store grade 정보도 요청
				window.opener.postMessage(
					{
						type: "REQUEST_STORE_GRADE",
						rowId: rowId,
					},
					parentOrigin
				);
			}

			// 사용 가능한 스톤 목록 로드
			const response = await stoneApi.getStones("", 1, 1000);

			if (response.success) {
				setAvailableStones(response.data?.content || []);
			}
		} catch (error) {
			handleError(error);
		} finally {
			setLoading(false);
		}
	}, [rowId, parentOrigin]);

	// 부모 창으로부터 메시지 수신
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data.type === "STONE_INFO_DATA") {
				setStoneInfos(event.data.stoneInfos || []);
			} else if (event.data.type === "STORE_GRADE_DATA") {
				console.log("Received STORE_GRADE_DATA: " + event.data.storeGrade);
				setStoreGrade(event.data.storeGrade || "");
			} else if (event.data.type === "STONE_SELECTED") {
				// 팝업에서 스톤 선택 시 - 직접 처리
				const { stone, stoneIndex } = event.data;
				if (typeof stoneIndex === "number" && stone) {
					// 직접 처리
					setStoneInfos((currentStoneInfos) => {
						// 중복 스톤명 체크
						const isDuplicate = currentStoneInfos.some(
							(existingStone, index) =>
								index !== stoneIndex &&
								existingStone.stoneName.trim().toLowerCase() ===
									stone.stoneName.trim().toLowerCase()
						);

						if (isDuplicate) {
							alert(`이미 추가된 스톤입니다: ${stone.stoneName}`);
							return currentStoneInfos;
						}

						const currentGrade = currentStoneInfos[stoneIndex]?.grade;
						const gradeToUse =
							currentGrade || getDefaultGradeByStoreGrade(storeGrade);
						const laborCostToUse =
							stone.stoneWorkGradePolicyDto.find(
								(policy: { grade: string; laborCost: number }) =>
									policy.grade === gradeToUse
							)?.laborCost || 0;

						const updateStoneInfos = [...currentStoneInfos];
						updateStoneInfos[stoneIndex] = {
							...updateStoneInfos[stoneIndex],
							stoneId: stone.stoneId,
							stoneName: stone.stoneName,
							stoneWeight: stone.stoneWeight,
							purchaseCost: stone.stonePurchasePrice.toString(),
							grade: gradeToUse,
							laborCost: laborCostToUse,
						};

						// 부모에게 업데이트 전송
						if (window.opener) {
							window.opener.postMessage(
								{
									type: "STONE_INFO_SAVE",
									rowId: rowId,
									stoneInfos: updateStoneInfos,
								},
								parentOrigin
							);
						}

						return updateStoneInfos;
					});

					// 팝업 닫기
					if (stoneSearchPopup && !stoneSearchPopup.closed) {
						stoneSearchPopup.close();
					}
					setStoneSearchPopup(null);
					setSelectedStoneIndex(-1);
				}
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [
		rowId,
		parentOrigin,
		storeGrade,
		stoneSearchPopup,
		getDefaultGradeByStoreGrade,
	]);

	const sendUpdateToParent = useCallback(
		(updatedStoneInfos: StoneInfo[]) => {
			if (window.opener) {
				window.opener.postMessage(
					{
						type: "STONE_INFO_SAVE",
						rowId: rowId,
						stoneInfos: updatedStoneInfos,
					},
					parentOrigin
				);
			}
		},
		[rowId, parentOrigin]
	);

	useEffect(() => {
		loadInitialData();
	}, [loadInitialData]);

	// stoneInfos 상태 변경 감지
	useEffect(() => {}, [stoneInfos]);

	// 스톤 추가
	const addStoneInfo = () => {
		const defaultGrade = getDefaultGradeByStoreGrade(storeGrade);
		const newStoneInfo: StoneInfo = {
			stoneId: "",
			stoneName: "",
			stoneWeight: "0",
			purchaseCost: 0,
			laborCost: 0,
			addLaborCost: 0,
			quantity: 1,
			includeStone: true,
			mainStone: false,
			grade: defaultGrade, // store grade 기반 기본 등급 설정
		};
		const updatedStoneInfos = [...stoneInfos, newStoneInfo];
		setStoneInfos(updatedStoneInfos);
		sendUpdateToParent(updatedStoneInfos);
	};

	// 스톤 삭제
	const removeStoneInfo = (index: number) => {
		const updatedStoneInfos = stoneInfos.filter((_, i) => i !== index);
		setStoneInfos(updatedStoneInfos);
		sendUpdateToParent(updatedStoneInfos);
	};

	// 스톤 정보 업데이트
	const updateStoneInfo = (
		index: number,
		field: keyof StoneInfo,
		value: string | number | boolean
	) => {
		const updatedStoneInfos = [...stoneInfos];
		updatedStoneInfos[index] = { ...updatedStoneInfos[index], [field]: value };

		// 스톤 선택 시 스톤명 자동 설정
		if (field === "stoneId" && value) {
			const selectedStone = availableStones.find(
				(stone) => stone.stoneId === value
			);
			if (selectedStone) {
				updatedStoneInfos[index].stoneName = selectedStone.stoneName;
			}
		}

		// grade 변경 시 해당 스톤의 laborCost 자동 설정
		if (field === "grade" && value && updatedStoneInfos[index].stoneId) {
			const selectedStone = availableStones.find(
				(stone) => stone.stoneId === updatedStoneInfos[index].stoneId
			);
			if (selectedStone) {
				const gradePolicy = selectedStone.stoneWorkGradePolicyDto.find(
					(policy) => policy.grade === value
				);

				console.log(
					"selectedStone.stonePurchasePrice:",
					selectedStone.stonePurchasePrice
				);
				updatedStoneInfos[index].purchaseCost =
					selectedStone.stonePurchasePrice || 0;

				if (gradePolicy) {
					updatedStoneInfos[index].laborCost = gradePolicy.laborCost;
				}
			}
		}

		setStoneInfos(updatedStoneInfos);
		sendUpdateToParent(updatedStoneInfos);
	};

	// 스톤 정보 합계 계산
	const calculateStoneSummary = () => {
		const summary = {
			mainStonePrice: 0,
			assistanceStonePrice: 0,
			additionalStonePrice: 0,
			mainStoneCount: 0,
			assistanceStoneCount: 0,
			totalStoneWeight: 0,
			totalLaborCost: 0,
			totalAddLaborCost: 0,
		};

		stoneInfos.forEach((stone) => {
			const quantity = stone.quantity || 0;
			const weight = parseFloat(stone.stoneWeight) || 0;
			const purchaseCost = stone.purchaseCost || 0;
			const laborCost = stone.laborCost || 0;
			const addLaborCost = stone.addLaborCost || 0;

			if (stone.includeStone) {
				summary.totalStoneWeight += weight * quantity;
				if (stone.mainStone) {
					summary.mainStoneCount += quantity;
					summary.mainStonePrice += purchaseCost * quantity;
					summary.totalAddLaborCost += addLaborCost * quantity;
					summary.totalLaborCost += laborCost * quantity;
				} else {
					summary.assistanceStoneCount += quantity;
					summary.assistanceStonePrice += purchaseCost * quantity;
					summary.totalAddLaborCost += addLaborCost * quantity;
					summary.totalLaborCost += laborCost * quantity;
				}
			}
		});

		return summary;
	};

	// 중복 스톤명 체크
	const isDuplicateStoneName = useCallback(
		(stoneName: string, currentIndex: number): boolean => {
			return stoneInfos.some(
				(stone, index) =>
					index !== currentIndex &&
					stone.stoneName.trim().toLowerCase() ===
						stoneName.trim().toLowerCase()
			);
		},
		[stoneInfos]
	);

	// 스톤 검색 열기 (팝업)
	const openStoneSearch = (index: number) => {
		setSelectedStoneIndex(index);

		// 팝업 창 열기
		const popupUrl = `/stone-search?parentOrigin=${encodeURIComponent(
			window.location.origin
		)}&stoneIndex=${index}`;
		const popup = window.open(
			popupUrl,
			`stoneSearch_${index}`,
			"width=800,height=600,scrollbars=yes,resizable=yes"
		);

		if (popup) {
			setStoneSearchPopup(popup);
		}
	};

	// 스톤 선택 처리
	const handleStoneSelect = (stone: StoneSearchDto) => {
		if (selectedStoneIndex >= 0) {
			// 중복 스톤명 체크
			if (isDuplicateStoneName(stone.stoneName, selectedStoneIndex)) {
				alert(`이미 추가된 스톤입니다: ${stone.stoneName}`);
				setIsStoneSearchOpen(false);
				setSelectedStoneIndex(-1);
				return;
			} else {
				const currentGrade = stoneInfos[selectedStoneIndex].grade;
				const gradeToUse =
					currentGrade || getDefaultGradeByStoreGrade(storeGrade);
				const laborCostToUse =
					stone.stoneWorkGradePolicyDto.find(
						(policy) => policy.grade === gradeToUse
					)?.laborCost || 0;

				const updateStoneInfos = [...stoneInfos];
				updateStoneInfos[selectedStoneIndex] = {
					...updateStoneInfos[selectedStoneIndex],
					stoneId: stone.stoneId,
					stoneName: stone.stoneName,
					stoneWeight: stone.stoneWeight, // 스톤 중량 설정
					purchaseCost: stone.stonePurchasePrice, // 매입단가 설정
					grade: gradeToUse, // 기존 grade 유지 또는 기본 등급 설정
					laborCost: laborCostToUse, // 선택된 등급에 해당하는 공임 설정
				};
				setStoneInfos(updateStoneInfos);
				sendUpdateToParent(updateStoneInfos);
			}
		}
		setIsStoneSearchOpen(false);
		setSelectedStoneIndex(-1);
	};

	// 저장
	const handleSave = () => {
		sendUpdateToParent(stoneInfos);
		window.close();
	};

	// 취소
	const handleCancel = () => {
		window.close();
	};

	if (loading) {
		return (
			<div className="stone-info-manager">
				<div className="stone-info-loading">데이터를 불러오는 중...</div>
			</div>
		);
	}

	return (
		<div className="stone-info-manager">
			<div className="stone-info-manager-content">
				{loading ? (
					<>
						<div className="loading-container">
							<div className="spinner"></div>
							<p>스톤정보를 불러오는 중...</p>
						</div>
					</>
				) : (
					<>
						<div className="stone-info-manager-actions">
							<button className="stone-info-add-btn" onClick={addStoneInfo}>
								+ 스톤 추가
							</button>
						</div>

						<div className="stone-info-table-container">
							<table className="stone-info-table">
								<thead>
									<tr>
										<th>삭제</th>
										<th>메인스톤</th>
										<th>포함여부</th>
										<th>스톤 선택</th>
										<th>스톤명</th>
										<th>등급</th>
										<th>중량</th>
										<th>매입단가</th>
										<th>공임</th>
										<th>추가공임</th>
										<th>수량</th>
									</tr>
								</thead>
								<tbody>
									{stoneInfos.length === 0 ? (
										<tr>
											<td
												colSpan={10}
												style={{ textAlign: "center", padding: "40px" }}
											>
												스톤 정보가 없습니다. '+ 스톤 추가' 버튼을 클릭하여
												스톤을 추가하세요.
											</td>
										</tr>
									) : (
										stoneInfos.map((info, index) => (
											<tr key={index}>
												<td>
													<button
														className="stone-info-delete-btn"
														onClick={() => removeStoneInfo(index)}
													>
														🗑️
													</button>
												</td>
												<td>
													<input
														type="checkbox"
														checked={info.mainStone}
														onChange={(e) =>
															updateStoneInfo(
																index,
																"mainStone",
																e.target.checked
															)
														}
													/>
												</td>
												<td>
													<input
														type="checkbox"
														checked={info.includeStone}
														onChange={(e) =>
															updateStoneInfo(
																index,
																"includeStone",
																e.target.checked
															)
														}
													/>
												</td>
												<td>
													<button
														className="stone-search-btn"
														onClick={() => openStoneSearch(index)}
													>
														{info.stoneName || "스톤 선택"}
													</button>
												</td>
												<td>
													<input
														type="text"
														value={info.stoneName}
														onChange={(e) => {
															const newValue = e.target.value;
															if (
																newValue &&
																isDuplicateStoneName(newValue, index)
															) {
																alert(`이미 추가된 스톤입니다: ${newValue}`);
																return;
															}
															updateStoneInfo(index, "stoneName", newValue);
														}}
														placeholder="스톤명"
													/>
												</td>
												<td>
													<select
														value={info.grade || ""}
														onChange={(e) =>
															updateStoneInfo(index, "grade", e.target.value)
														}
														className="grade-select"
													>
														<option value="">등급 선택</option>
														{/* 기본 등급 옵션들 (스톤이 선택되지 않아도 표시) */}
														{!info.stoneId && (
															<>
																<option value="GRADE_1">1등급</option>
																<option value="GRADE_2">2등급</option>
																<option value="GRADE_3">3등급</option>
																<option value="GRADE_4">4등급</option>
															</>
														)}
														{/* 스톤이 선택된 경우 해당 스톤의 grade 정책 표시 */}
														{info.stoneId &&
															availableStones
																.find((stone) => stone.stoneId === info.stoneId)
																?.stoneWorkGradePolicyDto.map((policy) => (
																	<option
																		key={policy.workGradePolicyId}
																		value={policy.grade}
																	>
																		{getGradeDisplayName(policy.grade)} (
																		{policy.laborCost.toLocaleString()}원)
																	</option>
																))}
													</select>
												</td>
												<td>
													<input
														type="text"
														value={info.stoneWeight}
														onChange={(e) =>
															updateStoneInfo(
																index,
																"stoneWeight",
																e.target.value
															)
														}
														placeholder="0.00"
													/>
												</td>
												<td>
													<input
														type="text"
														value={info.purchaseCost}
														onChange={(e) =>
															updateStoneInfo(
																index,
																"purchaseCost",
																e.target.value
															)
														}
														placeholder="0"
													/>
												</td>
												<td>
													<input
														type="number"
														value={info.laborCost}
														onChange={(e) =>
															updateStoneInfo(
																index,
																"laborCost",
																parseFloat(e.target.value) || 0
															)
														}
														placeholder="0"
													/>
												</td>
												<td>
													<input
														type="number"
														value={info.addLaborCost}
														onChange={(e) =>
															updateStoneInfo(
																index,
																"addLaborCost",
																parseFloat(e.target.value) || 0
															)
														}
														placeholder="0"
													/>
												</td>
												<td>
													<input
														type="number"
														value={info.quantity}
														onChange={(e) =>
															updateStoneInfo(
																index,
																"quantity",
																parseInt(e.target.value) || 1
															)
														}
														placeholder="1"
														min="1"
													/>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>

						{/* 스톤 정보 합계 */}
						{stoneInfos.length > 0 && (
							<div className="stone-info-summary">
								<div className="summary-grid">
									<div className="summary-item">
										<label>메인스톤 단가:</label>
										<span>
											{calculateStoneSummary().mainStonePrice.toLocaleString()}
											원
										</span>
									</div>
									<div className="summary-item">
										<label>보조스톤 단가:</label>
										<span>
											{calculateStoneSummary().assistanceStonePrice.toLocaleString()}
											원
										</span>
									</div>
									<div className="summary-item">
										<label>기본 공임:</label>
										<span>
											{calculateStoneSummary().totalLaborCost.toLocaleString()}
											원
										</span>
									</div>
									<div className="summary-item">
										<label>추가 공임:</label>
										<span>
											{calculateStoneSummary().totalAddLaborCost.toLocaleString()}
											원
										</span>
									</div>
									<div className="summary-item">
										<label>메인스톤 개수:</label>
										<span>{calculateStoneSummary().mainStoneCount}개</span>
									</div>
									<div className="summary-item">
										<label>보조스톤 개수:</label>
										<span>
											{calculateStoneSummary().assistanceStoneCount}개
										</span>
									</div>
									<div className="summary-item">
										<label>전체 중량:</label>
										<span>
											{calculateStoneSummary().totalStoneWeight.toFixed(2)}g
										</span>
									</div>
								</div>
							</div>
						)}

						<div className="detail-button-group">
							<button className="btn-cancel" onClick={handleCancel}>
								취소
							</button>
							<button className="btn-submit" onClick={handleSave}>
								저장
							</button>
						</div>
					</>
				)}
			</div>

			{/* 스톤 검색 모달 */}
			<StoneSearch
				isOpen={isStoneSearchOpen}
				onClose={() => {
					setIsStoneSearchOpen(false);
					setSelectedStoneIndex(-1);
				}}
				onSelectStone={handleStoneSelect}
			/>
		</div>
	);
};

export default StoneInfoPage;
