import { useEffect, useState, type JSX } from "react";
import { useErrorHandler } from "../../utils/errorHandler";
import { factoryStonePriceApi } from "../../../libs/api/factoryStonePriceApi";
import { factoryApi } from "../../../libs/api/factoryApi";
import { stoneApi } from "../../../libs/api/stoneApi";
import type { FactoryStonePriceResponse } from "../../types/factoryStonePriceDto";
import type { StoneSearchDto } from "../../types/stoneDto";
import "../../styles/pages/settings/FactoryStonePricePage.css";

interface FactoryItem {
	factoryId: number;
	factoryName: string;
}

interface FormData {
	factoryId: number;
	factoryName: string;
	stoneId: number;
	stoneName: string;
	engravingFee: number;
	effectiveDate: string;
	expiredDate: string;
	note: string;
}

const EMPTY_FORM: FormData = {
	factoryId: 0,
	factoryName: "",
	stoneId: 0,
	stoneName: "",
	engravingFee: 0,
	effectiveDate: new Date().toISOString().split("T")[0],
	expiredDate: "",
	note: "",
};

export default function FactoryStonePricePage(): JSX.Element {
	const [prices, setPrices] = useState<FactoryStonePriceResponse[]>([]);
	const [loading, setLoading] = useState(false);
	const [factories, setFactories] = useState<FactoryItem[]>([]);
	const [stones, setStones] = useState<StoneSearchDto[]>([]);
	const [selectedFactoryId, setSelectedFactoryId] = useState<string>("");
	const [selectedStoneId, setSelectedStoneId] = useState<string>("");
	const [viewMode, setViewMode] = useState<"factory" | "stone" | "history">(
		"factory"
	);

	// 모달 상태
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [showEditForm, setShowEditForm] = useState(false);
	const [showHistoryModal, setShowHistoryModal] = useState(false);
	const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [historyData, setHistoryData] = useState<FactoryStonePriceResponse[]>(
		[]
	);
	const [historyLoading, setHistoryLoading] = useState(false);

	// 공장 검색
	const [factorySearch, setFactorySearch] = useState("");
	const [showFactoryDropdown, setShowFactoryDropdown] = useState(false);

	// 스톤 검색
	const [stoneSearch, setStoneSearch] = useState("");
	const [showStoneDropdown, setShowStoneDropdown] = useState(false);

	const { handleError } = useErrorHandler();

	// 공장 목록 로드
	const loadFactories = async (search: string = "") => {
		try {
			const response = await factoryApi.getFactories(search, 1, true, 100);
			if (response.success && response.data?.content) {
				const mapped = response.data.content.map((f) => ({
					factoryId: f.factoryId,
					factoryName: f.factoryName,
				}));
				setFactories(mapped);
			}
		} catch (error) {
			handleError(error);
		}
	};

	// 스톤 목록 로드
	const loadStones = async (search: string = "") => {
		try {
			const response = await stoneApi.getStones({
				search: search || undefined,
				page: 1,
				pageSize: 100,
			});
			if (response.success && response.data?.content) {
				setStones(response.data.content);
			}
		} catch (error) {
			handleError(error);
		}
	};

	// 공장별 조각료 목록 로드
	const loadPricesByFactory = async (factoryId: string) => {
		if (!factoryId) {
			setPrices([]);
			return;
		}
		setLoading(true);
		try {
			const response =
				await factoryStonePriceApi.getFactoryStonePricesByFactory(factoryId);
			if (response.success && response.data) {
				setPrices(response.data);
			} else {
				setPrices([]);
			}
		} catch (error) {
			handleError(error);
			setPrices([]);
		} finally {
			setLoading(false);
		}
	};

	// 스톤별 조각료 목록 로드
	const loadPricesByStone = async (stoneId: string) => {
		if (!stoneId) {
			setPrices([]);
			return;
		}
		setLoading(true);
		try {
			const response =
				await factoryStonePriceApi.getFactoryStonePricesByStone(stoneId);
			if (response.success && response.data) {
				setPrices(response.data);
			} else {
				setPrices([]);
			}
		} catch (error) {
			handleError(error);
			setPrices([]);
		} finally {
			setLoading(false);
		}
	};

	// 가격 이력 로드
	const loadPriceHistory = async (factoryId: string, stoneId: string) => {
		setHistoryLoading(true);
		try {
			const response = await factoryStonePriceApi.getPriceHistory(
				factoryId,
				stoneId
			);
			if (response.success && response.data) {
				setHistoryData(response.data);
			} else {
				setHistoryData([]);
			}
		} catch (error) {
			handleError(error);
			setHistoryData([]);
		} finally {
			setHistoryLoading(false);
		}
	};

	// 초기 로드
	useEffect(() => {
		loadFactories();
		loadStones();
	}, []);

	// 조회 모드 변경 시 데이터 로드
	useEffect(() => {
		if (viewMode === "factory" && selectedFactoryId) {
			loadPricesByFactory(selectedFactoryId);
		} else if (viewMode === "stone" && selectedStoneId) {
			loadPricesByStone(selectedStoneId);
		}
	}, [viewMode, selectedFactoryId, selectedStoneId]);

	// 공장 선택
	const handleFactorySelect = (factory: FactoryItem) => {
		setSelectedFactoryId(String(factory.factoryId));
		setFactorySearch(factory.factoryName);
		setShowFactoryDropdown(false);
		setViewMode("factory");
		loadPricesByFactory(String(factory.factoryId));
	};

	// 스톤 선택
	const handleStoneSelect = (stone: StoneSearchDto) => {
		setSelectedStoneId(stone.stoneId);
		setStoneSearch(stone.stoneName);
		setShowStoneDropdown(false);
		setViewMode("stone");
		loadPricesByStone(stone.stoneId);
	};

	// 생성 폼 열기
	const handleOpenCreateForm = () => {
		const selectedFactory = factories.find(
			(f) => String(f.factoryId) === selectedFactoryId
		);
		setFormData({
			...EMPTY_FORM,
			factoryId: selectedFactory?.factoryId || 0,
			factoryName: selectedFactory?.factoryName || "",
		});
		setShowCreateForm(true);
	};

	// 수정 폼 열기
	const handleOpenEditForm = (price: FactoryStonePriceResponse) => {
		setFormData({
			factoryId: price.factoryId,
			factoryName: price.factoryName,
			stoneId: price.stoneId,
			stoneName: price.stoneName,
			engravingFee: price.engravingFee,
			effectiveDate: price.effectiveDate,
			expiredDate: price.expiredDate || "",
			note: price.note || "",
		});
		setEditingId(String(price.id));
		setShowEditForm(true);
	};

	// 이력 모달 열기
	const handleOpenHistory = (price: FactoryStonePriceResponse) => {
		loadPriceHistory(String(price.factoryId), String(price.stoneId));
		setShowHistoryModal(true);
	};

	// 폼 닫기
	const handleCloseForm = () => {
		setShowCreateForm(false);
		setShowEditForm(false);
		setFormData(EMPTY_FORM);
		setEditingId(null);
	};

	// 이력 모달 닫기
	const handleCloseHistory = () => {
		setShowHistoryModal(false);
		setHistoryData([]);
	};

	// 생성 제출
	const handleCreateSubmit = async () => {
		if (!formData.factoryId || formData.factoryId === 0) {
			alert("공장을 선택해주세요.");
			return;
		}
		if (!formData.stoneId || formData.stoneId === 0) {
			alert("스톤을 선택해주세요.");
			return;
		}
		if (!formData.engravingFee || formData.engravingFee <= 0) {
			alert("조각료를 입력해주세요.");
			return;
		}
		if (!formData.effectiveDate) {
			alert("적용일을 입력해주세요.");
			return;
		}

		try {
			const response = await factoryStonePriceApi.createFactoryStonePrice({
				factoryId: formData.factoryId,
				factoryName: formData.factoryName,
				stoneId: formData.stoneId,
				engravingFee: formData.engravingFee,
				effectiveDate: formData.effectiveDate,
				expiredDate: formData.expiredDate || null,
				note: formData.note,
			});

			if (response.success) {
				alert("조각료가 등록되었습니다.");
				handleCloseForm();
				if (viewMode === "factory") {
					loadPricesByFactory(selectedFactoryId);
				} else if (viewMode === "stone") {
					loadPricesByStone(selectedStoneId);
				}
			} else {
				alert(response.message || "등록에 실패했습니다.");
			}
		} catch (error) {
			handleError(error);
		}
	};

	// 수정 제출
	const handleUpdateSubmit = async () => {
		if (!editingId) return;

		if (!formData.engravingFee || formData.engravingFee <= 0) {
			alert("조각료를 입력해주세요.");
			return;
		}

		try {
			const response = await factoryStonePriceApi.updateFactoryStonePrice(
				editingId,
				{
					factoryId: formData.factoryId,
					factoryName: formData.factoryName,
					stoneId: formData.stoneId,
					engravingFee: formData.engravingFee,
					effectiveDate: formData.effectiveDate,
					expiredDate: formData.expiredDate || null,
					note: formData.note,
				}
			);

			if (response.success) {
				alert("조각료가 수정되었습니다.");
				handleCloseForm();
				if (viewMode === "factory") {
					loadPricesByFactory(selectedFactoryId);
				} else if (viewMode === "stone") {
					loadPricesByStone(selectedStoneId);
				}
			} else {
				alert(response.message || "수정에 실패했습니다.");
			}
		} catch (error) {
			handleError(error);
		}
	};

	// 삭제
	const handleDelete = async () => {
		if (!editingId) return;

		if (!confirm("정말 삭제하시겠습니까?")) {
			return;
		}

		try {
			const response =
				await factoryStonePriceApi.deleteFactoryStonePrice(editingId);

			if (response.success) {
				alert("조각료가 삭제되었습니다.");
				handleCloseForm();
				if (viewMode === "factory") {
					loadPricesByFactory(selectedFactoryId);
				} else if (viewMode === "stone") {
					loadPricesByStone(selectedStoneId);
				}
			} else {
				alert(response.message || "삭제에 실패했습니다.");
			}
		} catch (error) {
			handleError(error);
		}
	};

	// 폼 내 공장 선택
	const handleFormFactorySelect = (factory: FactoryItem) => {
		setFormData((prev) => ({
			...prev,
			factoryId: factory.factoryId,
			factoryName: factory.factoryName,
		}));
		setShowFactoryDropdown(false);
	};

	// 폼 내 스톤 선택
	const handleFormStoneSelect = (stone: StoneSearchDto) => {
		setFormData((prev) => ({
			...prev,
			stoneId: Number(stone.stoneId),
			stoneName: stone.stoneName,
		}));
		setShowStoneDropdown(false);
	};

	// 금액 포맷팅
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("ko-KR").format(amount);
	};

	// 필터링된 공장 목록
	const filteredFactories = factories.filter((f) =>
		f.factoryName.toLowerCase().includes(factorySearch.toLowerCase())
	);

	// 필터링된 스톤 목록
	const filteredStones = stones.filter((s) =>
		s.stoneName.toLowerCase().includes(stoneSearch.toLowerCase())
	);

	return (
		<div className="factory-stone-price-page">
			<div className="page-header">
				<h1>공장별 스톤 조각료 관리</h1>
			</div>

			{/* 검색 섹션 */}
			<div className="search-section">
				<div className="search-row">
					{/* 공장 검색 */}
					<div className="search-group">
						<label>공장 선택</label>
						<div className="search-input-wrapper">
							<input
								type="text"
								value={factorySearch}
								onChange={(e) => {
									setFactorySearch(e.target.value);
									setShowFactoryDropdown(true);
									loadFactories(e.target.value);
								}}
								onFocus={() => setShowFactoryDropdown(true)}
								placeholder="공장명 검색..."
								className="search-input"
							/>
							{showFactoryDropdown && filteredFactories.length > 0 && (
								<div className="search-dropdown">
									{filteredFactories.map((factory) => (
										<div
											key={factory.factoryId}
											className="dropdown-item"
											onClick={() => handleFactorySelect(factory)}
										>
											{factory.factoryName}
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* 스톤 검색 */}
					<div className="search-group">
						<label>스톤 선택</label>
						<div className="search-input-wrapper">
							<input
								type="text"
								value={stoneSearch}
								onChange={(e) => {
									setStoneSearch(e.target.value);
									setShowStoneDropdown(true);
									loadStones(e.target.value);
								}}
								onFocus={() => setShowStoneDropdown(true)}
								placeholder="스톤명 검색..."
								className="search-input"
							/>
							{showStoneDropdown && filteredStones.length > 0 && (
								<div className="search-dropdown">
									{filteredStones.map((stone) => (
										<div
											key={stone.stoneId}
											className="dropdown-item"
											onClick={() => handleStoneSelect(stone)}
										>
											{stone.stoneName}
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* 버튼 그룹 */}
					<div className="button-group">
						<button
							type="button"
							className="common-btn-common"
							onClick={handleOpenCreateForm}
							disabled={!selectedFactoryId && !selectedStoneId}
						>
							조각료 등록
						</button>
						<button
							type="button"
							className="reset-btn-common"
							onClick={() => {
								setFactorySearch("");
								setStoneSearch("");
								setSelectedFactoryId("");
								setSelectedStoneId("");
								setPrices([]);
							}}
						>
							초기화
						</button>
					</div>
				</div>

				{/* 현재 조회 모드 표시 */}
				{(selectedFactoryId || selectedStoneId) && (
					<div className="current-filter">
						{viewMode === "factory" && (
							<span>
								📍 공장별 조회: <strong>{factorySearch}</strong>
							</span>
						)}
						{viewMode === "stone" && (
							<span>
								📍 스톤별 조회: <strong>{stoneSearch}</strong>
							</span>
						)}
					</div>
				)}
			</div>

			{/* 테이블 */}
			<div className="price-table-container">
				{loading ? (
					<div className="loading-state">데이터를 불러오는 중...</div>
				) : prices.length === 0 ? (
					<div className="empty-state">
						{selectedFactoryId || selectedStoneId
							? "등록된 조각료가 없습니다."
							: "공장 또는 스톤을 선택해주세요."}
					</div>
				) : (
					<table className="price-table">
						<thead>
							<tr>
								<th>No</th>
								<th>공장명</th>
								<th>스톤명</th>
								<th>조각료</th>
								<th>적용일</th>
								<th>만료일</th>
								<th>비고</th>
								<th>관리</th>
							</tr>
						</thead>
						<tbody>
							{prices.map((price, index) => (
								<tr key={price.id}>
									<td>{index + 1}</td>
									<td>{price.factoryName}</td>
									<td>{price.stoneName}</td>
									<td className="amount">{formatCurrency(price.engravingFee)}원</td>
									<td>{price.effectiveDate}</td>
									<td>{price.expiredDate || "-"}</td>
									<td>{price.note || "-"}</td>
									<td className="action-cell">
										<button
											className="action-btn edit"
											onClick={() => handleOpenEditForm(price)}
										>
											수정
										</button>
										<button
											className="action-btn history"
											onClick={() => handleOpenHistory(price)}
										>
											이력
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			{/* 생성 모달 */}
			{showCreateForm && (
				<div className="modal-overlay" onClick={handleCloseForm}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3>조각료 등록</h3>
							<button className="close-btn" onClick={handleCloseForm}>
								×
							</button>
						</div>
						<div className="modal-body">
							<div className="form-group">
								<label>
									공장 <span className="required">*</span>
								</label>
								<div className="search-input-wrapper">
									<input
										type="text"
										value={formData.factoryName}
										onChange={(e) => {
											setFormData((prev) => ({
												...prev,
												factoryName: e.target.value,
												factoryId: 0,
											}));
											setShowFactoryDropdown(true);
											loadFactories(e.target.value);
										}}
										onFocus={() => setShowFactoryDropdown(true)}
										placeholder="공장 검색..."
									/>
									{showFactoryDropdown && filteredFactories.length > 0 && (
										<div className="search-dropdown modal-dropdown">
											{filteredFactories.map((factory) => (
												<div
													key={factory.factoryId}
													className="dropdown-item"
													onClick={() => handleFormFactorySelect(factory)}
												>
													{factory.factoryName}
												</div>
											))}
										</div>
									)}
								</div>
							</div>
							<div className="form-group">
								<label>
									스톤 <span className="required">*</span>
								</label>
								<div className="search-input-wrapper">
									<input
										type="text"
										value={formData.stoneName}
										onChange={(e) => {
											setFormData((prev) => ({
												...prev,
												stoneName: e.target.value,
												stoneId: 0,
											}));
											setShowStoneDropdown(true);
											loadStones(e.target.value);
										}}
										onFocus={() => setShowStoneDropdown(true)}
										placeholder="스톤 검색..."
									/>
									{showStoneDropdown && filteredStones.length > 0 && (
										<div className="search-dropdown modal-dropdown">
											{filteredStones.map((stone) => (
												<div
													key={stone.stoneId}
													className="dropdown-item"
													onClick={() => handleFormStoneSelect(stone)}
												>
													{stone.stoneName}
												</div>
											))}
										</div>
									)}
								</div>
							</div>
							<div className="form-group">
								<label>
									조각료 <span className="required">*</span>
								</label>
								<input
									type="number"
									value={formData.engravingFee || ""}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											engravingFee: Number(e.target.value),
										}))
									}
									placeholder="조각료 입력"
								/>
							</div>
							<div className="form-row">
								<div className="form-group half">
									<label>
										적용일 <span className="required">*</span>
									</label>
									<input
										type="date"
										value={formData.effectiveDate}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												effectiveDate: e.target.value,
											}))
										}
									/>
								</div>
								<div className="form-group half">
									<label>만료일</label>
									<input
										type="date"
										value={formData.expiredDate}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												expiredDate: e.target.value,
											}))
										}
									/>
								</div>
							</div>
							<div className="form-group">
								<label>비고</label>
								<textarea
									value={formData.note}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											note: e.target.value,
										}))
									}
									placeholder="비고 입력"
									rows={3}
								/>
							</div>
						</div>
						<div className="modal-footer">
							<button className="reset-btn-common" onClick={handleCloseForm}>
								취소
							</button>
							<button className="common-btn-common" onClick={handleCreateSubmit}>
								등록
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 수정 모달 */}
			{showEditForm && (
				<div className="modal-overlay" onClick={handleCloseForm}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3>조각료 수정</h3>
							<button className="close-btn" onClick={handleCloseForm}>
								×
							</button>
						</div>
						<div className="modal-body">
							<div className="form-group">
								<label>공장</label>
								<input type="text" value={formData.factoryName} disabled />
							</div>
							<div className="form-group">
								<label>스톤</label>
								<input type="text" value={formData.stoneName} disabled />
							</div>
							<div className="form-group">
								<label>
									조각료 <span className="required">*</span>
								</label>
								<input
									type="number"
									value={formData.engravingFee || ""}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											engravingFee: Number(e.target.value),
										}))
									}
									placeholder="조각료 입력"
								/>
							</div>
							<div className="form-row">
								<div className="form-group half">
									<label>
										적용일 <span className="required">*</span>
									</label>
									<input
										type="date"
										value={formData.effectiveDate}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												effectiveDate: e.target.value,
											}))
										}
									/>
								</div>
								<div className="form-group half">
									<label>만료일</label>
									<input
										type="date"
										value={formData.expiredDate}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												expiredDate: e.target.value,
											}))
										}
									/>
								</div>
							</div>
							<div className="form-group">
								<label>비고</label>
								<textarea
									value={formData.note}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											note: e.target.value,
										}))
									}
									placeholder="비고 입력"
									rows={3}
								/>
							</div>
						</div>
						<div className="modal-footer">
							<button className="reset-btn-common" onClick={handleCloseForm}>
								취소
							</button>
							<button className="delete-btn-common" onClick={handleDelete}>
								삭제
							</button>
							<button className="common-btn-common" onClick={handleUpdateSubmit}>
								수정
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 이력 모달 */}
			{showHistoryModal && (
				<div className="modal-overlay" onClick={handleCloseHistory}>
					<div
						className="modal-content history-modal"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="modal-header">
							<h3>가격 변경 이력</h3>
							<button className="close-btn" onClick={handleCloseHistory}>
								×
							</button>
						</div>
						<div className="modal-body">
							{historyLoading ? (
								<div className="loading-state">이력을 불러오는 중...</div>
							) : historyData.length === 0 ? (
								<div className="empty-state">이력이 없습니다.</div>
							) : (
								<table className="history-table">
									<thead>
										<tr>
											<th>No</th>
											<th>조각료</th>
											<th>적용일</th>
											<th>만료일</th>
											<th>비고</th>
										</tr>
									</thead>
									<tbody>
										{historyData.map((item, index) => (
											<tr
												key={item.id}
												className={!item.expiredDate ? "current" : ""}
											>
												<td>{index + 1}</td>
												<td className="amount">
													{formatCurrency(item.engravingFee)}원
												</td>
												<td>{item.effectiveDate}</td>
												<td>{item.expiredDate || "현재 적용 중"}</td>
												<td>{item.note || "-"}</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</div>
						<div className="modal-footer">
							<button className="reset-btn-common" onClick={handleCloseHistory}>
								닫기
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 드롭다운 외부 클릭 감지 */}
			{(showFactoryDropdown || showStoneDropdown) && (
				<div
					className="dropdown-backdrop"
					onClick={() => {
						setShowFactoryDropdown(false);
						setShowStoneDropdown(false);
					}}
				/>
			)}
		</div>
	);
}
