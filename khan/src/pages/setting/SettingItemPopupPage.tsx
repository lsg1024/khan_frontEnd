import { useEffect, useState, type JSX } from "react";
import { useSearchParams } from "react-router-dom";
import "../../styles/pages/settingItemPopup.css";

type ItemType =
	| "material"
	| "harry"
	| "classification"
	| "color"
	| "setType"
	| "priority"
	| "stoneType"
	| "stoneShape";

interface SettingItem {
	id: number | string;
	name: string;
	note?: string;
	[key: string]: unknown;
}

export default function SettingItemPopupPage(): JSX.Element {
	const [searchParams] = useSearchParams();
	const itemType = searchParams.get("type") as ItemType;

	const [items, setItems] = useState<SettingItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [createFormData, setCreateFormData] = useState({
		name: "",
		note: "",
	});
	const [showEditForm, setShowEditForm] = useState(false);
	const [editFormData, setEditFormData] = useState<SettingItem | null>(null);

	useEffect(() => {
		const fetchItems = async () => {
			if (!itemType) return;

			setLoading(true);
			try {
				let response;

				switch (itemType) {
					case "material": {
						const { materialApi } = await import("../../../libs/api/material");
						response = await materialApi.getMaterials(searchQuery);
						break;
					}
					case "harry": {
						const { goldHarryApi } = await import(
							"../../../libs/api/goldHarry"
						);
						response = await goldHarryApi.getGoldHarry();
						break;
					}
					case "classification": {
						const { classificationApi } = await import(
							"../../../libs/api/classification"
						);
						response = await classificationApi.getClassifications(searchQuery);
						break;
					}
					case "color": {
						const { colorApi } = await import("../../../libs/api/color");
						response = await colorApi.getColors(searchQuery);
						break;
					}
					case "setType": {
						const { setTypeApi } = await import("../../../libs/api/setType");
						response = await setTypeApi.getSetTypes(searchQuery);
						break;
					}
					case "priority": {
						const { priorityApi } = await import("../../../libs/api/priority");
						response = await priorityApi.getPriorities();
						break;
					}
					case "stoneType": {
						const { stoneTypeApi } = await import(
							"../../../libs/api/stoneType"
						);
						response = await stoneTypeApi.getStoneTypes(searchQuery);
						break;
					}
					case "stoneShape": {
						const { stoneShapeApi } = await import(
							"../../../libs/api/stoneShape"
						);
						response = await stoneShapeApi.getStoneShapes(searchQuery);
						break;
					}
					default:
						return;
				}

				if (response?.data) {
					const rawData = Array.isArray(response.data) ? response.data : [];

					// DTO를 SettingItem으로 변환
					const mappedItems: SettingItem[] = rawData.map((item: unknown) => {
						const anyItem = item as Record<string, unknown>;
						// 각 타입별로 id와 name 필드를 매핑
						let id: string | number = "";
						let name = "";
						let note = "";

						switch (itemType) {
							case "material":
								id = (anyItem.materialId as string) || "";
								name = (anyItem.materialName as string) || "";
								note = (anyItem.materialGoldPurityPercent as string) || "";
								break;
							case "harry":
								id = (anyItem.goldHarryId as number) || "";
								name = (anyItem.goldHarryLoss as number)?.toString() || "";
								break;
							case "classification":
								id = (anyItem.classificationId as string) || "";
								name = (anyItem.classificationName as string) || "";
								note = (anyItem.classificationNote as string) || "";
								break;
							case "color":
								id = (anyItem.colorId as string) || "";
								name = (anyItem.colorName as string) || "";
								note = (anyItem.colorNote as string) || "";
								break;
							case "setType":
								id = (anyItem.setTypeId as string) || "";
								name = (anyItem.setTypeName as string) || "";
								note = (anyItem.setTypeNote as string) || "";
								break;
							case "priority":
								id = (anyItem.priorityId as string) || "";
								name = (anyItem.priorityName as string) || "";
								note = (anyItem.priorityDate as string) || "";
								break;
							case "stoneType":
								id = (anyItem.stoneTypeId as string) || "";
								name = (anyItem.stoneTypeName as string) || "";
								note = (anyItem.stoneTypeNote as string) || "";
								break;
							case "stoneShape":
								id = (anyItem.stoneShapeId as string) || "";
								name = (anyItem.stoneShapeName as string) || "";
								note = (anyItem.stoneShapeNote as string) || "";
								break;
						}

						return { id, name, note, ...anyItem };
					});

					setItems(mappedItems);
				}
			} catch (error) {
				console.error("Failed to fetch items:", error);
				setItems([]);
			} finally {
				setLoading(false);
			}
		};

		fetchItems();
	}, [itemType, searchQuery]);

	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
		}
	};

	const handleCreateClick = () => {
		setShowCreateForm(true);
		setCreateFormData({ name: "", note: "" });
	};

	const handleCancelCreate = () => {
		setShowCreateForm(false);
		setCreateFormData({ name: "", note: "" });
	};

	const handleCreateSubmit = async () => {
		if (!createFormData.name.trim()) {
			alert("이름을 입력해주세요.");
			return;
		}

		try {
			let response;

			switch (itemType) {
				case "material": {
					const { materialApi } = await import("../../../libs/api/material");
					response = await materialApi.createMaterial({
						materialName: createFormData.name,
						materialGoldPurityPercent: createFormData.note,
					});
					break;
				}
				case "harry": {
					const { goldHarryApi } = await import("../../../libs/api/goldHarry");
					response = await goldHarryApi.createGoldHarry(createFormData.name);
					break;
				}
				case "classification": {
					const { classificationApi } = await import("../../../libs/api/classification");
					response = await classificationApi.createClassification({
						name: createFormData.name,
						note: createFormData.note,
					});
					break;
				}
				case "color": {
					const { colorApi } = await import("../../../libs/api/color");
					response = await colorApi.createColor({
						colorName: createFormData.name,
						colorNote: createFormData.note,
					});
					break;
				}
				case "setType": {
					const { setTypeApi } = await import("../../../libs/api/setType");
					response = await setTypeApi.createSetType({
						name: createFormData.name,
						note: createFormData.note,
					});
					break;
				}
				case "priority": {
					const { priorityApi } = await import("../../../libs/api/priority");
					response = await priorityApi.createPriority(
						createFormData.name,
						Number(createFormData.note)
					);
					break;
				}
				case "stoneType": {
					const { stoneTypeApi } = await import("../../../libs/api/stoneType");
					response = await stoneTypeApi.createStoneType({
						name: createFormData.name,
						note: createFormData.note,
					});
					break;
				}
				case "stoneShape": {
					const { stoneShapeApi } = await import(
						"../../../libs/api/stoneShape"
					);
					response = await stoneShapeApi.createStoneShape({
						stoneShapeName: createFormData.name,
						stoneShapeNote: createFormData.note,
					});
					break;
				}
			}

			if (response?.success) {
				alert("생성되었습니다.");
				setShowCreateForm(false);
				setCreateFormData({ name: "", note: "" });
				setSearchQuery("");
			} else {
				alert("생성에 실패했습니다.");
			}
		} catch (error) {	
			alert(error instanceof Error ? error.message : "생성 중 오류가 발생했습니다.");
		}
	};

	const handleRowClick = (item: SettingItem) => {
		setEditFormData(item);
		setShowEditForm(true);
	};

	const handleCloseEdit = () => {
		setShowEditForm(false);
		setEditFormData(null);
	};

	const handleUpdateSubmit = async () => {
		if (!editFormData?.name.trim()) {
			alert("이름을 입력해주세요.");
			return;
		}

		try {
			let response;
			const id = editFormData.id.toString();

			switch (itemType) {
				case "material": {
					const { materialApi } = await import("../../../libs/api/material");
					response = await materialApi.updateMaterial(id, {
						materialName: editFormData.name,
						materialGoldPurityPercent: editFormData.note,
					});
					break;
				}
				case "harry": {
					alert("해리 항목은 수정할 수 없습니다.");
					return;
				}
				case "classification": {
					const { classificationApi } = await import(
						"../../../libs/api/classification"
					);
					response = await classificationApi.updateClassification(id, {
						name: editFormData.name,
						note: editFormData.note,
					});
					break;
				}
				case "color": {
					const { colorApi } = await import("../../../libs/api/color");
					response = await colorApi.updateColor(id, {
						colorName: editFormData.name,
						colorNote: editFormData.note,
					});
					break;
				}
				case "setType": {
					const { setTypeApi } = await import("../../../libs/api/setType");
					response = await setTypeApi.updateSetType(id, {
						name: editFormData.name,
						note: editFormData.note,
					});
					break;
				}
				case "priority": {
					const { priorityApi } = await import ("../../../libs/api/priority");
                    response = await priorityApi.updatePriority(
                        id, 
                        editFormData.name, 
                        Number(editFormData.note)
                    );
					break;
				}
				case "stoneType": {
					const { stoneTypeApi } = await import("../../../libs/api/stoneType");
					response = await stoneTypeApi.updateStoneType(id, {
						name: editFormData.name,
						note: editFormData.note,
					});
					break;
				}
				case "stoneShape": {
					const { stoneShapeApi } = await import(
						"../../../libs/api/stoneShape"
					);
					response = await stoneShapeApi.updateStoneShape(id, {
						stoneShapeName: editFormData.name,
						stoneShapeNote: editFormData.note,
					});
					break;
				}
			}

			if (response?.success) {
				alert("수정되었습니다.");
				setShowEditForm(false);
				setEditFormData(null);
				setSearchQuery("");
			} else {
				alert("수정에 실패했습니다.");
			}
		} catch (error) {
			console.error("Failed to update item:", error);
			alert("수정 중 오류가 발생했습니다.");
		}
	};

	const handleDeleteSubmit = async () => {
		if (!editFormData) return;

		if (!confirm("정말 삭제하시겠습니까?")) {
			return;
		}

		try {
			let response;
			const id = editFormData.id.toString();

			switch (itemType) {
				case "material": {
					const { materialApi } = await import("../../../libs/api/material");
					response = await materialApi.deleteMaterial(id);
					break;
				}
				case "harry": {
					const {goldHarryApi} = await import("../../../libs/api/goldHarry");
                    response = await goldHarryApi.deleteGoldHarry(id);
					return;
				}
				case "classification": {
					const { classificationApi } = await import(
						"../../../libs/api/classification"
					);
					response = await classificationApi.deleteClassification(id);
					break;
				}
				case "color": {
					const { colorApi } = await import("../../../libs/api/color");
					response = await colorApi.deleteColor(id);
					break;
				}
				case "setType": {
					const { setTypeApi } = await import("../../../libs/api/setType");
					response = await setTypeApi.deleteSetType(id);
					break;
				}
				case "priority": {
					alert("우선순위 항목은 삭제할 수 없습니다.");
					return;
				}
				case "stoneType": {
					const { stoneTypeApi } = await import("../../../libs/api/stoneType");
					response = await stoneTypeApi.deleteStoneType(id);
					break;
				}
				case "stoneShape": {
					const { stoneShapeApi } = await import(
						"../../../libs/api/stoneShape"
					);
					response = await stoneShapeApi.deleteStoneShape(id);
					break;
				}
			}

			if (response?.success) {
				alert("삭제되었습니다.");
				setShowEditForm(false);
				setEditFormData(null);
				setSearchQuery("");
			} else {
				alert("삭제에 실패했습니다.");
			}
		} catch (error) {
			alert(error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.");
		}
	};

	return (
		<div className="setting-popup-page">
			<div className="popup-header">
				<div className="search-filters-common">
					<div className="search-controls-common">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={handleSearchKeyDown}
							placeholder="검색..."
							className="search-input-common"
						/>
						<div className="search-buttons-common">
							<button type="submit" className="search-btn-common">
								검색
							</button>
							<button
								type="button"
								className="common-btn-common"
								onClick={handleCreateClick}
							>
								생성
							</button>
							<button type="button" className="common-btn-common">
								엑셀 다운로드
							</button>
						</div>
					</div>
				</div>
			</div>

			{showCreateForm && (
				<div className="create-form-overlay" onClick={handleCancelCreate}>
					<div
						className="create-form-modal"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="create-form-header">
							<h3>새 항목 생성</h3>
							<button className="close-button" onClick={handleCancelCreate}>
								×
							</button>
						</div>
						<div className="create-form-body">
							<div className="form-group">
								<label>이름 *</label>
								<input
									type="text"
									value={createFormData.name}
									onChange={(e) =>
										setCreateFormData({
											...createFormData,
											name: e.target.value,
										})
									}
									placeholder="이름을 입력하세요"
								/>
							</div>
							<div className="form-group">
								<label>비고</label>
								<input
									type="text"
									value={createFormData.note}
									onChange={(e) =>
										setCreateFormData({
											...createFormData,
											note: e.target.value,
										})
									}
									placeholder="비고를 입력하세요"
								/>
							</div>
						</div>
						<div className="create-form-footer">
							<button className="cancel-btn" onClick={handleCancelCreate}>
								취소
							</button>
							<button className="submit-btn" onClick={handleCreateSubmit}>
								생성
							</button>
						</div>
					</div>
				</div>
			)}

			{showEditForm && editFormData && (
				<div className="create-form-overlay" onClick={handleCloseEdit}>
					<div
						className="create-form-modal"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="create-form-header">
							<h3>항목 수정</h3>
							<button className="close-button" onClick={handleCloseEdit}>
								×
							</button>
						</div>
						<div className="create-form-body">
							<div className="form-group">
								<label>이름 *</label>
								<input
									type="text"
									value={editFormData.name}
									onChange={(e) =>
										setEditFormData({
											...editFormData,
											name: e.target.value,
										})
									}
									placeholder="이름을 입력하세요"
								/>
							</div>
							<div className="form-group">
								<label>비고</label>
								<input
									type="text"
									value={editFormData.note || ""}
									onChange={(e) =>
										setEditFormData({
											...editFormData,
											note: e.target.value,
										})
									}
									placeholder="비고를 입력하세요"
								/>
							</div>
						</div>
						<div className="create-form-footer">
							<button className="cancel-btn" onClick={handleCloseEdit}>
								닫기
							</button>
							<button className="delete-btn" onClick={handleDeleteSubmit}>
								삭제
							</button>
							<button className="submit-btn" onClick={handleUpdateSubmit}>
								수정
							</button>
						</div>
					</div>
				</div>
			)}

			<div className="setting-popup-list">
				{loading ? (
					<div className="loading-state">데이터를 불러오는 중...</div>
				) : items.length === 0 ? (
					<div className="empty-state">데이터가 없습니다.</div>
				) : (
					<table className="items-table">
						<thead>
							<tr>
								<th>No</th>
								<th>이름</th>
								<th>기타</th>
							</tr>
						</thead>
						<tbody>
							{items.map((item, index) => (
								<tr key={item.id}>
									<td>
										<button
											type="button"
											className="no-btn"
											onClick={() => handleRowClick(item)}
										>
											{index + 1}
										</button>
									</td>
									<td>{item.name}</td>
									<td>{item.note}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
