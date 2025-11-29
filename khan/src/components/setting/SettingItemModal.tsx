import React, { useState, useEffect } from "react";

interface SettingItem {
	id: string;
	name: string;
	note?: string;
}

interface SettingItemModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	itemType:
		| "material"
		| "harry"
		| "classification"
		| "color"
		| "setType"
		| "priority"
		| "stoneType"
		| "stoneShape";
}

const SettingItemModal: React.FC<SettingItemModalProps> = ({
	isOpen,
	onClose,
	title,
	itemType,
}) => {
	const [items, setItems] = useState<SettingItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	// API 호출 함수
	const fetchItems = async (search?: string) => {
		setLoading(true);
		try {
			let response;
			const { materialApi } = await import("../../../libs/api/material");
			const { goldHarryApi } = await import("../../../libs/api/goldHarry");
			const { classificationApi } = await import(
				"../../../libs/api/classification"
			);
			const { colorApi } = await import("../../../libs/api/color");
			const { setTypeApi } = await import("../../../libs/api/setType");
			const { priorityApi } = await import("../../../libs/api/priority");
			const { stoneTypeApi } = await import("../../../libs/api/stoneType");
			const { stoneShapeApi } = await import("../../../libs/api/stoneShape");

			switch (itemType) {
				case "material":
					response = await materialApi.getMaterials(search);
					if (response.success && response.data) {
						setItems(
							response.data.map((item) => ({
								id: (item as { materialId: string; materialName: string })
									.materialId,
								name: (item as { materialId: string; materialName: string })
									.materialName,
							}))
						);
					}
					break;

				case "harry":
					response = await goldHarryApi.getGoldHarry();
					if (response.success && response.data) {
						setItems(
							response.data.map((item) => ({
								id: (item as { goldHarryId: string; goldHarry: string })
									.goldHarryId,
								name: (item as { goldHarryId: string; goldHarry: string })
									.goldHarry,
							}))
						);
					}
					break;

				case "classification":
					response = await classificationApi.getClassifications(search);
					if (response.success && response.data) {
						setItems(
							response.data.map((item) => ({
								id: (
									item as {
										classificationId: string;
										classificationName: string;
									}
								).classificationId,
								name: (
									item as {
										classificationId: string;
										classificationName: string;
									}
								).classificationName,
							}))
						);
					}
					break;

				case "color":
					response = await colorApi.getColors(search);
					if (response.success && response.data) {
						setItems(
							response.data.map((item) => ({
								id: (item as { colorId: string; colorName: string }).colorId,
								name: (item as { colorId: string; colorName: string })
									.colorName,
							}))
						);
					}
					break;

				case "setType":
					response = await setTypeApi.getSetTypes(search);
					if (response.success && response.data) {
						setItems(
							response.data.map((item) => ({
								id: (item as { setTypeId: string; setTypeName: string })
									.setTypeId,
								name: (item as { setTypeId: string; setTypeName: string })
									.setTypeName,
							}))
						);
					}
					break;

				case "priority":
					response = await priorityApi.getPriorities();
					if (response.success && response.data) {
						setItems(
							response.data.map((item) => ({
								id: (item as { priorityName: string }).priorityName,
								name: (item as { priorityName: string }).priorityName,
								note: (item as { priorityDate: number }).priorityDate.toString(),
							}))
						);
					}
					break;

				case "stoneType":
					response = await stoneTypeApi.getStoneTypes(search);
					if (response.success && response.data) {
						setItems(
							response.data.map((item) => ({
								id: (item as { stoneTypeId: string; stoneTypeName: string })
									.stoneTypeId,
								name: (item as { stoneTypeId: string; stoneTypeName: string })
									.stoneTypeName,
							}))
						);
					}
					break;

				case "stoneShape":
					response = await stoneShapeApi.getStoneShapes(search);
					if (response.success && response.data) {
						setItems(
							response.data.map((item) => ({
								id: (item as { stoneShapeId: string; stoneShapeName: string })
									.stoneShapeId,
								name: (item as { stoneShapeId: string; stoneShapeName: string })
									.stoneShapeName,
							}))
						);
					}
					break;
			}
		} catch (error) {
			console.error("Failed to fetch items:", error);
			setItems([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen) {
			fetchItems("");
		}
	}, [isOpen, itemType]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleSearch = () => {
		fetchItems(searchTerm);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	const handleClose = () => {
		setSearchTerm("");
		setItems([]);
		onClose();
	};

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	};

	if (!isOpen) return null;

	return (
		<div className="setting-item-modal-overlay" onClick={handleOverlayClick}>
			<div className="setting-item-modal-content">
				{/* 모달 헤더 */}
				<div className="setting-item-modal-header">
					<h4>{title}</h4>
					<button className="close-button" onClick={handleClose}>
						×
					</button>
				</div>

				{/* 검색 섹션 */}
				<div className="search-section">
					<div className="search-input-group">
						<input
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyDown={handleKeyPress}
							placeholder="검색어를 입력하세요"
							className="search-input"
						/>
						<button
							onClick={handleSearch}
							className="search-btn"
							disabled={loading}
						>
							{loading ? "검색 중..." : "검색"}
						</button>
					</div>
				</div>

				{/* 결과 섹션 */}
				<div className="setting-item-results">
					{loading && (
						<div className="loading-state">
							<div className="spinner"></div>
							<p>불러오는 중...</p>
						</div>
					)}

					{!loading && items.length === 0 && (
						<div className="empty-state">
							<p>항목이 없습니다.</p>
						</div>
					)}

					{!loading && items.length > 0 && (
						<div className="items-list">
							<div className="items-table">
								<div className="table-header">
									<span className="col-id">ID</span>
									<span className="col-name">이름</span>
									<span className="col-note">기타</span>
								</div>
								{items.map((item) => (
									<div key={item.id} className="table-row">
										<span className="col-id">{item.id}</span>
										<span className="col-name">{item.name}</span>
										<span className="col-note">{item.note || "-"}</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SettingItemModal;
