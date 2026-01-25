import { useState, useEffect } from "react";
import { goldHarryApi } from "../../../libs/api/goldHarry";
import { isApiSuccess } from "../../../libs/api/config";
import type { goldHarryResponse } from "../../types/goldHarry";
import "../../styles/components/BulkActionBar.css";

interface BulkActionBarProps {
	selectedCount: number;
	onUpdateHarry: (harryId: string) => Promise<void>;
	onUpdateGrade: (grade: string) => Promise<void>;
	onDelete: () => Promise<void>;
	onCancel: () => void;
}

export const AccountBulkActionBar = ({
	selectedCount,
	onUpdateHarry,
	onUpdateGrade,
	onDelete,
	onCancel,
}: BulkActionBarProps) => {
	const [showHarryModal, setShowHarryModal] = useState(false);
	const [showGradeModal, setShowGradeModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [harryValue, setHarryValue] = useState("");
	const [gradeValue, setGradeValue] = useState("");
	const [goldHarries, setGoldHarries] = useState<goldHarryResponse[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const loadGoldHarries = async () => {
			try {
				const res = await goldHarryApi.getGoldHarry();
				if (isApiSuccess(res) && res.data) {
					setGoldHarries(res.data);
				}
			} catch (err) {
				console.error("해리 목록 로드 실패:", err);
			}
		};
		loadGoldHarries();
	}, []);

	const handleHarrySubmit = async () => {
		if (!harryValue) {
			alert("해리 값을 입력해주세요.");
			return;
		}

		setLoading(true);
		try {
			await onUpdateHarry(harryValue);
			setShowHarryModal(false);
			setHarryValue("");
			onCancel();
		} finally {
			setLoading(false);
		}
	};

	const handleGradeSubmit = async () => {
		if (!gradeValue) {
			alert("등급을 선택해주세요.");
			return;
		}

		setLoading(true);
		try {
			await onUpdateGrade(gradeValue);
			setShowGradeModal(false);
			setGradeValue("");
			onCancel();
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteSubmit = async () => {
		setLoading(true);
		try {
			await onDelete();
			setShowDeleteModal(false);
			onCancel();
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div className="bulk-action-bar">
				<div className="bulk-action-content">
					<div className="bulk-action-buttons">
						<button
							className={`bulk-action-btn stock-register ${
								selectedCount === 0 ? "disabled" : ""
							}`}
							onClick={() => setShowHarryModal(true)}
							disabled={loading}
						>
							해리 수정
						</button>
						<button
							className={`bulk-action-btn sales-register ${
								selectedCount === 0 ? "disabled" : ""
							}`}
							onClick={() => setShowGradeModal(true)}
							disabled={loading}
						>
							등급 수정
						</button>
						<button
							className={`bulk-action-btn delete ${
								selectedCount === 0 ? "disabled" : ""
							}`}
							onClick={() => setShowDeleteModal(true)}
							disabled={loading || selectedCount === 0}
						>
							삭제
						</button>
					</div>
				</div>
			</div>

			{/* 해리 수정 모달 */}
			{showHarryModal && (
				<div className="modal-overlay" onClick={() => setShowHarryModal(false)}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3>해리 수정</h3>
							<button
								className="modal-close"
								onClick={() => setShowHarryModal(false)}
							>
								×
							</button>
						</div>
						<div className="modal-body">
							<label>
								해리 선택
								<select
									value={harryValue}
									onChange={(e) => setHarryValue(e.target.value)}
									autoFocus
								>
									<option value="">해리를 선택하세요</option>
									{goldHarries.map((harry) => (
										<option key={harry.goldHarryId} value={harry.goldHarryId}>
											{harry.goldHarry}
										</option>
									))}
								</select>
							</label>
						</div>
						<div className="modal-footer">
							<button
								className="modal-btn submit-btn"
								onClick={handleHarrySubmit}
								disabled={loading}
							>
								{loading ? "처리 중..." : "수정"}
							</button>
							<button
								className="modal-btn cancel-btn"
								onClick={() => setShowHarryModal(false)}
								disabled={loading}
							>
								취소
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 등급 수정 모달 */}
			{showGradeModal && (
				<div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3>등급 수정</h3>
							<button
								className="modal-close"
								onClick={() => setShowGradeModal(false)}
							>
								×
							</button>
						</div>
						<div className="modal-body">
							<label>
								등급
								<select
									value={gradeValue}
									onChange={(e) => setGradeValue(e.target.value)}
									autoFocus
								>
									<option value="">등급을 선택하세요</option>
									<option value="1">1등급</option>
									<option value="2">2등급</option>
									<option value="3">3등급</option>
									<option value="4">4등급</option>
								</select>
							</label>
						</div>
						<div className="modal-footer">
							<button
								className="modal-btn submit-btn"
								onClick={handleGradeSubmit}
								disabled={loading}
							>
								{loading ? "처리 중..." : "수정"}
							</button>
							<button
								className="modal-btn cancel-btn"
								onClick={() => setShowGradeModal(false)}
								disabled={loading}
							>
								취소
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 삭제 확인 모달 */}
			{showDeleteModal && (
				<div
					className="modal-overlay"
					onClick={() => setShowDeleteModal(false)}
				>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h3>삭제 확인</h3>
							<button
								className="modal-close"
								onClick={() => setShowDeleteModal(false)}
							>
								×
							</button>
						</div>
						<div className="modal-body">
							<p>선택한 항목을 삭제하시겠습니까?</p>
							<p className="warning-text">이 작업은 되돌릴 수 없습니다.</p>
						</div>
						<div className="modal-footer">
							<button
								className="modal-btn submit-btn delete-confirm"
								onClick={handleDeleteSubmit}
								disabled={loading}
							>
								{loading ? "삭제 중..." : "삭제"}
							</button>
							<button
								className="modal-btn cancel-btn"
								onClick={() => setShowDeleteModal(false)}
								disabled={loading}
							>
								취소
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default AccountBulkActionBar;
