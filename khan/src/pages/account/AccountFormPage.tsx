import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { storeApi } from "../../../libs/api/storeApi";
import { factoryApi } from "../../../libs/api/factoryApi";
import { goldHarryApi } from "../../../libs/api/goldHarryApi";
import { materialApi } from "../../../libs/api/materialApi";
import { useErrorHandler } from "../../utils/errorHandler";
import { isApiSuccess } from "../../../libs/api/config";
import { handleApiSubmit } from "../../utils/apiSubmitHandler";
import type { AccountSingleResponse } from "../../types/AccountDto";
import type { goldHarryResponse } from "../../types/goldHarryDto";
import type { MaterialDto } from "../../types/materialDto";
import "../../styles/pages/account/AccountPage.css";

type AccountType = "store" | "factory";
type PageMode = "create" | "update";

export const AccountFormPage = () => {
	const { id } = useParams<{ id: string }>();
	const [searchParams] = useSearchParams();

	const accountType = (searchParams.get("type") as AccountType) || "store";
	const mode: PageMode = id ? "update" : "create";

	const [loading, setLoading] = useState(false);
	const [grades, setGrades] = useState<string[]>([]);
	const [goldHarries, setGoldHarries] = useState<goldHarryResponse[]>([]);
	const [materials, setMaterials] = useState<MaterialDto[]>([]);

	const { handleError } = useErrorHandler();

	const [formData, setFormData] = useState<AccountSingleResponse>({
		accountId: "",
		accountName: "",
		accountOwnerName: "",
		accountPhoneNumber: "",
		accountContactNumber1: "",
		accountContactNumber2: "",
		accountFaxNumber: "",
		accountNote: "",
		addressId: "",
		addressZipCode: "",
		addressBasic: "",
		addressAdd: "",
		commonOptionId: "",
		tradeType: "WEIGHT",
		grade: "ONE",
		goldHarryId: "",
		goldHarryLoss: "",
		additionalOptionId: "",
		additionalApplyPastSales: false,
		additionalMaterialId: "",
		additionalMaterialName: "",
	});

	// 서버 값을 클라이언트 형식으로 변환
	const convertServerToClient = (data: AccountSingleResponse) => {
		// tradeType 변환: "중량" -> "WEIGHT", "시세" -> "PRICE"
		let tradeType = data.tradeType;
		if (tradeType === "중량") tradeType = "WEIGHT";
		else if (tradeType === "시세") tradeType = "PRICE";

		// grade 변환: "1" -> "ONE", "2" -> "TWO", "3" -> "THREE", "4" -> "FOUR"
		let grade = data.grade;
		const gradeMap: Record<string, string> = {
			"1": "ONE",
			"2": "TWO",
			"3": "THREE",
			"4": "FOUR",
		};
		if (grade && gradeMap[grade]) {
			grade = gradeMap[grade];
		}

		return {
			...data,
			tradeType,
			grade,
		};
	};

	const loadAccountDetail = async (accountId: string) => {
		setLoading(true);

		try {
			const res =
				accountType === "store"
					? await storeApi.getStore(accountId)
					: await factoryApi.getFactory(accountId);

			if (!isApiSuccess(res)) {
				alert(res.message || "데이터를 불러오지 못했습니다.");
				return;
			}

			if (res.data) {
				setFormData(convertServerToClient(res.data));
			}
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (mode === "update" && id) {
			loadAccountDetail(id);
		}
		loadDropdownData();
	}, [id, mode]); // eslint-disable-line react-hooks/exhaustive-deps

	const loadDropdownData = async () => {
		try {
			setGrades(["ONE", "TWO", "THREE", "FOUR"]);

			// 해리 로드
			const harryRes = await goldHarryApi.getGoldHarry();
			if (isApiSuccess(harryRes) && harryRes.data) {
				setGoldHarries(harryRes.data);

				// 생성 모드이고 goldHarryId가 선택되지 않은 경우, id가 1인 해리를 기본값으로 설정
				if (mode === "create" && !formData.goldHarryId) {
					const defaultHarry = harryRes.data.find(
						(harry) => harry.goldHarryId === "1"
					);
					if (defaultHarry) {
						setFormData((prev) => ({
							...prev,
							goldHarryId: defaultHarry.goldHarryId,
						}));
					}
				}
			}

			// 재질 로드 (store mode일 때만)
			if (accountType === "store") {
				const materialRes = await materialApi.getMaterials();
				if (isApiSuccess(materialRes) && materialRes.data) {
					setMaterials(materialRes.data);
				}
			}
		} catch (err) {
			console.error("드롭다운 데이터 로드 실패:", err);
		}
	};

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value, type } = e.target;

		if (type === "checkbox") {
			const checked = (e.target as HTMLInputElement).checked;
			setFormData((prev) => ({
				...prev,
				[name]: checked,
			}));
		} else {
			setFormData((prev) => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const handleSubmit = async () => {
		if (!formData.accountName) {
			alert(
				`${accountType === "store" ? "거래처명" : "제조사명"}을 입력해주세요.`
			);
			return;
		}

		setLoading(true);

		try {
			// 공통 데이터 구조 생성
			const accountInfo = {
				accountName: formData.accountName,
				accountOwnerName: formData.accountOwnerName || "",
				accountPhoneNumber: formData.accountPhoneNumber || undefined,
				accountContactNumber1: formData.accountContactNumber1 || undefined,
				accountContactNumber2: formData.accountContactNumber2 || undefined,
				accountFaxNumber: formData.accountFaxNumber || undefined,
				accountNote: formData.accountNote || undefined,
			};

			const commonOptionInfo = {
				tradeType: formData.tradeType || undefined,
				grade: formData.grade || undefined,
				goldHarryId: formData.goldHarryId || undefined,
			};

			const addressInfo = {
				addressZipCode: formData.addressZipCode || undefined,
				addressBasic: formData.addressBasic || undefined,
				addressAdd: formData.addressAdd || undefined,
			};

			let res;
			if (mode === "create") {
				if (accountType === "store") {
					const storeData = {
						accountInfo,
						commonOptionInfo,
						additionalOptionInfo: {
							additionalApplyPastSales:
								formData.additionalApplyPastSales || false,
							additionalMaterialId: formData.additionalMaterialId || undefined,
							additionalMaterialName:
								formData.additionalMaterialName || undefined,
						},
						addressInfo,
					};
					res = await storeApi.createStore(storeData);
				} else {
					// Factory 생성 데이터
					const factoryData = {
						accountInfo,
						commonOptionInfo,
						addressInfo,
					};
					res = await factoryApi.createFactory(factoryData);
				}
			} else {
				if (accountType === "store") {
					// Store 수정 데이터
					const storeData = {
						accountInfo,
						commonOptionInfo,
						additionalOptionInfo: {
							additionalApplyPastSales:
								formData.additionalApplyPastSales || false,
							additionalMaterialId: formData.additionalMaterialId || undefined,
							additionalMaterialName:
								formData.additionalMaterialName || undefined,
						},
						addressInfo,
					};
					res = await storeApi.updateStore(id!, storeData);
				} else {
					// Factory 수정 데이터
					const factoryData = {
						accountInfo,
						commonOptionInfo,
						addressInfo,
					};
					res = await factoryApi.updateFactory(id!, factoryData);
				}
			}

			if (!isApiSuccess(res)) {
				alert(res.message || "저장에 실패했습니다.");
				return;
			}

			await handleApiSubmit({
				promises: [Promise.resolve(res)],
				successMessage: `${
					mode === "create" ? "등록" : "수정"
				}이 완료되었습니다.`,
				parentMessageType:
					mode === "create" ? "ACCOUNT_CREATED" : "ACCOUNT_UPDATED",
				parentMessageData: { accountType },
				logMessage: `거래처/제조사 ${mode === "create" ? "등록" : "수정"}`,
			});
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		if (window.confirm("취소하시겠습니까? 입력한 내용이 저장되지 않습니다.")) {
			window.close();
		}
	};

	const pageTitle =
		mode === "create"
			? `${accountType === "store" ? "거래처" : "제조사"} 등록`
			: `${accountType === "store" ? "거래처" : "제조사"} 수정`;

	return (
		<div className="account-page">
			<div className="account-container">
				<div className="account-header">
					<h2>
						{pageTitle}{" "}
						<span className="required-mark">* 표시는 필수입니다.</span>
					</h2>
				</div>

				{loading && mode === "update" ? (
					<div className="loading-container">
						<div className="spinner"></div>
						<p>데이터를 불러오는 중...</p>
					</div>
				) : (
					<div className="account-form">
						<div className="form-section">
							<div className="section-header">
								<span className="required">*</span>
								<span className="section-title">기본 정보</span>
							</div>

							<table className="form-table">
								<tbody>
									<tr>
										<th>
											<span className="required">*</span>
											{accountType === "store" ? "거래처명" : "제조사명"}
										</th>
										<td>
											<input
												type="text"
												name="accountName"
												value={formData.accountName}
												onChange={handleInputChange}
												placeholder={`${
													accountType === "store" ? "거래처명" : "제조사명"
												}을 입력하세요`}
												required
											/>
										</td>
										<th>
											<span className="required">*</span>
											대표자
										</th>
										<td>
											<input
												type="text"
												name="accountOwnerName"
												value={formData.accountOwnerName}
												onChange={handleInputChange}
												placeholder="대표자명을 입력하세요"
											/>
										</td>
									</tr>
									<tr>
										<th>전화번호</th>
										<td>
											<input
												type="text"
												name="accountPhoneNumber"
												value={formData.accountPhoneNumber}
												onChange={handleInputChange}
												placeholder="전화번호를 입력하세요"
											/>
										</td>
										<th>연락처1</th>
										<td>
											<input
												type="text"
												name="accountContactNumber1"
												value={formData.accountContactNumber1}
												onChange={handleInputChange}
												placeholder="연락처1을 입력하세요"
											/>
										</td>
									</tr>
									<tr>
										<th>연락처2</th>
										<td>
											<input
												type="text"
												name="accountContactNumber2"
												value={formData.accountContactNumber2}
												onChange={handleInputChange}
												placeholder="연락처2를 입력하세요"
											/>
										</td>
										<th>팩스번호</th>
										<td>
											<input
												type="text"
												name="accountFaxNumber"
												value={formData.accountFaxNumber}
												onChange={handleInputChange}
												placeholder="팩스번호를 입력하세요"
											/>
										</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div className="form-section">
							<div className="section-header">
								<span className="section-title">주소</span>
							</div>

							<table className="form-table">
								<tbody>
									<tr>
										<th>우편번호</th>
										<td>
											<div className="input-group">
												<input
													type="text"
													name="addressZipCode"
													value={formData.addressZipCode}
													readOnly
													placeholder="우편번호 찾기를 통해 입력"
													onChange={handleInputChange}
													style={{ backgroundColor: "#f0f0f0" }}
												/>
												<button
													type="button"
													className="btn-submit"
													style={{ marginBottom: 0 }}
												>
													우편번호 찾기
												</button>
											</div>
										</td>
									</tr>
									<tr>
										<th>기본주소</th>
										<td>
											<input
												type="text"
												name="addressBasic"
												value={formData.addressBasic}
												onChange={handleInputChange}
												placeholder="기본주소를 입력하세요"
											/>
										</td>
									</tr>
									<tr>
										<th>상세주소</th>
										<td>
											<input
												type="text"
												name="addressAdd"
												value={formData.addressAdd}
												onChange={handleInputChange}
												placeholder="상세주소를 입력하세요"
											/>
										</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div className="form-section">
							<div className="section-header">
								<span className="section-title">거래 정보</span>
							</div>

							<table className="form-table">
								<tbody>
									<tr>
										<th>거래 방식</th>
										<td>
											<select
												name="tradeType"
												value={formData.tradeType}
												onChange={handleInputChange}
											>
												<option value="">선택</option>
												<option value="WEIGHT">중량</option>
												<option value="PRICE">시세</option>
											</select>
										</td>
										<th>등급</th>
										<td>
											<select
												name="grade"
												value={formData.grade}
												onChange={handleInputChange}
											>
												<option value="">선택</option>
												{grades.map((grade, index) => (
													<option key={grade} value={grade}>
														{index + 1}등급
													</option>
												))}
											</select>
										</td>
									</tr>
									<tr>
										<th>해리</th>
										<td colSpan={3}>
											<select
												name="goldHarryId"
												value={formData.goldHarryId}
												onChange={handleInputChange}
											>
												<option value="">선택</option>
												{goldHarries.map((harry) => (
													<option
														key={harry.goldHarryId}
														value={harry.goldHarryId}
													>
														{harry.goldHarry}
													</option>
												))}
											</select>
										</td>
									</tr>
								</tbody>
							</table>
						</div>

						{accountType === "store" && (
							<div className="form-section">
								<div className="section-header">
									<span className="section-title">추가 정보</span>
								</div>

								<table className="form-table">
									<tbody>
										<tr>
											<th>과거 매출 적용</th>
											<td>
												<label className="checkbox-label">
													<input
														type="checkbox"
														name="additionalApplyPastSales"
														checked={formData.additionalApplyPastSales || false}
														onChange={handleInputChange}
													/>
													<span>과거 매출 데이터 적용</span>
												</label>
											</td>
											<th>재질</th>
											<td>
												<select
													name="additionalMaterialId"
													value={formData.additionalMaterialId || ""}
													onChange={handleInputChange}
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
										</tr>
									</tbody>
								</table>
							</div>
						)}

						<div className="form-section">
							<div className="section-header">
								<span className="section-title">비고</span>
							</div>

							<table className="form-table">
								<tbody>
									<tr>
										<td colSpan={4}>
											<textarea
												name="accountNote"
												value={formData.accountNote}
												onChange={handleInputChange}
												placeholder="비고사항을 입력하세요"
												rows={3}
											/>
										</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div className="form-actions">
							<button
								type="button"
								className="btn-cancel"
								onClick={handleCancel}
								disabled={loading}
							>
								취소
							</button>
							<button
								type="button"
								className="btn-submit"
								onClick={handleSubmit}
								disabled={loading || !formData.accountName.trim()}
							>
								{loading ? "처리 중..." : mode === "create" ? "등록" : "수정"}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default AccountFormPage;
