import { useEffect, useState, type JSX } from "react";
import { userApi } from "../../../libs/api/userApi";
import type { UserInfo } from "../../types/userDto";
import "../../styles/pages/settings/UserManagementPopup.css";
import { useErrorHandler } from "../../utils/errorHandler";

export default function UserManagementPopupPage(): JSX.Element {
	const [users, setUsers] = useState<UserInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [showEditForm, setShowEditForm] = useState(false);
	const [editFormData, setEditFormData] = useState<UserInfo | null>(null);
	const [showPasswordForm, setShowPasswordForm] = useState(false);

	const [passwordFormData, setPasswordFormData] = useState({
		origin_password: "",
		password: "",
		confirm_password: "",
	});

    const { handleError } = useErrorHandler();

	// 유저 목록 조회
	const fetchUsers = async () => {
		setLoading(true);
		try {
			const response = await userApi.getUserList();
			if (response.success) {
				setUsers(response.data || []);
			}
		} catch (error) {
            handleError(error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	// 검색 필터링
	const filteredUsers = users.filter(
		(user) =>
			user.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.role.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
		}
	};

	const handleRowClick = (user: UserInfo) => {
		setEditFormData(user);
		setShowEditForm(true);
	};

	const handleCloseEdit = () => {
		setShowEditForm(false);
		setEditFormData(null);
	};

	const handleUpdateSubmit = async () => {
		if (!editFormData) return;

		if (!editFormData.nickname.trim()) {
			alert("닉네임을 입력해주세요.");
			return;
		}

		try {
			const response = await userApi.updateUserInfo({
				id: editFormData.userId,
				nickname: editFormData.nickname,
				role: editFormData.role,
			});

			if (response?.success) {
				alert("사용자 정보가 수정되었습니다.");
				setShowEditForm(false);
				setEditFormData(null);
				fetchUsers();
			}
		} catch (error) {
			handleError(error);
		}
	};

	const handleDeleteSubmit = async () => {
		if (!editFormData) return;

		if (!confirm("정말 삭제하시겠습니까?")) {
			return;
		}

		try {
			const response = await userApi.deleteUser();

			if (response?.success) {
				alert("사용자가 삭제되었습니다.");
				setShowEditForm(false);
				setEditFormData(null);
				fetchUsers();
			}
		} catch (error) {
			handleError(error);
		}
	};

	const handleChangePasswordClick = () => {
		setShowPasswordForm(true);
		setPasswordFormData({
			origin_password: "",
			password: "",
			confirm_password: "",
		});
	};

	const handleClosePasswordForm = () => {
		setShowPasswordForm(false);
		setPasswordFormData({
			origin_password: "",
			password: "",
			confirm_password: "",
		});
	};

	const handlePasswordSubmit = async () => {
		if (
			!passwordFormData.origin_password ||
			!passwordFormData.password ||
			!passwordFormData.confirm_password
		) {
			alert("모든 필드를 입력해주세요.");
			return;
		}

		if (passwordFormData.password !== passwordFormData.confirm_password) {
			alert("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
			return;
		}

		// 비밀번호 유효성 검사
		const passwordRegex = /^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[$@!%*#?&]).{8,16}$/;
		if (!passwordRegex.test(passwordFormData.password)) {
			alert("비밀번호는 8-16자이며, 영문, 숫자, 특수문자를 포함해야 합니다.");
			return;
		}

		try {
			const response = await userApi.updatePassword(passwordFormData);

			if (response?.success) {
				alert("비밀번호가 변경되었습니다.");
				handleClosePasswordForm();
			}
		} catch (error) {
			handleError(error);
		}
	};

	return (
		<div className="user-management-popup-page">
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
							<button
								type="button"
								className="common-btn-common"
								onClick={handleChangePasswordClick}
							>
								비밀번호 변경
							</button>
							<button
								type="button"
								className="reset-btn-common"
								onClick={fetchUsers}
							>
								새로고침
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* 비밀번호 변경 폼 */}
			{showPasswordForm && (
				<div className="create-form-overlay" onClick={handleClosePasswordForm}>
					<div
						className="create-form-modal"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="create-form-header">
							<h3>비밀번호 변경</h3>
							<button
								className="close-button"
								onClick={handleClosePasswordForm}
							>
								×
							</button>
						</div>
						<div className="create-form-body">
							<div className="form-group">
								<label>현재 비밀번호 *</label>
								<input
									type="password"
									value={passwordFormData.origin_password}
									onChange={(e) =>
										setPasswordFormData({
											...passwordFormData,
											origin_password: e.target.value,
										})
									}
									placeholder="현재 비밀번호를 입력하세요"
								/>
							</div>
							<div className="form-group">
								<label>새 비밀번호 *</label>
								<input
									type="password"
									value={passwordFormData.password}
									onChange={(e) =>
										setPasswordFormData({
											...passwordFormData,
											password: e.target.value,
										})
									}
									placeholder="새 비밀번호를 입력하세요 (8-16자, 영문+숫자+특수문자)"
								/>
							</div>
							<div className="form-group">
								<label>비밀번호 확인 *</label>
								<input
									type="password"
									value={passwordFormData.confirm_password}
									onChange={(e) =>
										setPasswordFormData({
											...passwordFormData,
											confirm_password: e.target.value,
										})
									}
									placeholder="새 비밀번호를 다시 입력하세요"
								/>
							</div>
						</div>
						<div className="create-form-footer">
							<button className="reset-btn-common" onClick={handleClosePasswordForm}>
								취소
							</button>
							<button className="common-btn-common" onClick={handlePasswordSubmit}>
								변경
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 사용자 수정 폼 */}
			{showEditForm && editFormData && (
				<div className="create-form-overlay" onClick={handleCloseEdit}>
					<div
						className="create-form-modal"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="create-form-header">
							<h3>사용자 정보 수정</h3>
							<button className="close-button" onClick={handleCloseEdit}>
								×
							</button>
						</div>
						<div className="create-form-body">
							<div className="form-group">
								<label>사용자 ID</label>
								<input
									type="text"
									value={editFormData.userId}
									disabled
									className="disabled-input"
								/>
							</div>
							<div className="form-group">
								<label>닉네임 *</label>
								<input
									type="text"
									value={editFormData.nickname}
									onChange={(e) =>
										setEditFormData({
											...editFormData,
											nickname: e.target.value,
										})
									}
									placeholder="닉네임을 입력하세요"
								/>
							</div>
							<div className="form-group">
								<label>권한</label>
								<select
									value={editFormData.role}
									onChange={(e) =>
										setEditFormData({
											...editFormData,
											role: e.target.value,
										})
									}
								>
                                    <option value="GUEST">GUEST</option>
									<option value="USER">USER</option>
									<option value="ADMIN">ADMIN</option>
								</select>
							</div>
						</div>
						<div className="create-form-footer">
							<button className="reset-btn-common" onClick={handleCloseEdit}>
								닫기
							</button>
							<button className="delete-btn-common" onClick={handleDeleteSubmit}>
								삭제
							</button>
							<button className="common-btn-common" onClick={handleUpdateSubmit}>
								수정
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 사용자 목록 테이블 */}
			<div className="user-management-list">
				{loading ? (
					<div className="loading-state">데이터를 불러오는 중...</div>
				) : filteredUsers.length === 0 ? (
					<div className="empty-state">사용자가 없습니다.</div>
				) : (
					<table className="users-table">
						<thead>
							<tr>
								<th>No</th>
								<th>도메인</th>
								<th>닉네임</th>
								<th>권한</th>
							</tr>
						</thead>
						<tbody>
							{filteredUsers.map((user, index) => (
								<tr key={user.userId}>
									<td>
										<button
											type="button"
											className="no-btn"
											onClick={() => handleRowClick(user)}
										>
											{index + 1}
										</button>
									</td>
									<td>{user.tenantId}</td>
									<td>{user.nickname}</td>
									<td>{user.role}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
