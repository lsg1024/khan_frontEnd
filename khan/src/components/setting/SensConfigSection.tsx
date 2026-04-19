import { useState, useEffect } from "react";
import { messageApi } from "../../../libs/api/messageApi";
import type { SensConfigResponse } from "../../types/messageDto";
import "../../styles/pages/message.css";

const SensConfigSection = () => {
	const [config, setConfig] = useState<SensConfigResponse | null>(null);
	const [form, setForm] = useState({
		accessKey: "",
		secretKey: "",
		serviceId: "",
		senderPhone: "",
	});
	const [loading, setLoading] = useState(false);
	const [isEditing, setIsEditing] = useState(false);

	useEffect(() => {
		loadConfig();
	}, []);

	const loadConfig = async () => {
		try {
			const response = await messageApi.getSensConfig();
			if (response.success && response.data) {
				setConfig(response.data);
				setForm({
					accessKey: response.data.accessKey || "",
					secretKey: "",
					serviceId: response.data.serviceId || "",
					senderPhone: response.data.senderPhone || "",
				});
			}
		} catch {
			// SENS 설정이 없는 경우 — 정상
			setConfig(null);
			setIsEditing(true);
		}
	};

	const handleSave = async () => {
		if (!form.accessKey || !form.secretKey || !form.serviceId || !form.senderPhone) {
			alert("모든 필드를 입력해주세요.");
			return;
		}

		setLoading(true);
		try {
			const response = await messageApi.saveSensConfig(form);
			if (response.success && response.data) {
				setConfig(response.data);
				setIsEditing(false);
				alert("SENS 설정이 저장되었습니다.");
			} else {
				alert(response.message || "저장에 실패했습니다.");
			}
		} catch {
			alert("SENS 설정 저장 중 오류가 발생했습니다.");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!confirm("SENS 설정을 삭제하시겠습니까?")) return;

		try {
			const response = await messageApi.deleteSensConfig();
			if (response.success) {
				setConfig(null);
				setForm({ accessKey: "", secretKey: "", serviceId: "", senderPhone: "" });
				setIsEditing(true);
				alert("SENS 설정이 삭제되었습니다.");
			}
		} catch {
			alert("삭제 중 오류가 발생했습니다.");
		}
	};

	return (
		<div className="sens-config-section">
			<h3>Naver SENS 메시지 설정</h3>

			{!isEditing && config ? (
				<div>
					<div className="sens-form-group">
						<label>Access Key</label>
						<input type="text" value={config.accessKey} disabled />
					</div>
					<div className="sens-form-group">
						<label>Service ID</label>
						<input type="text" value={config.serviceId} disabled />
					</div>
					<div className="sens-form-group">
						<label>발신번호</label>
						<input type="text" value={config.senderPhone} disabled />
					</div>
					<div className="sens-form-group">
						<label>상태</label>
						<input type="text" value={config.enabled ? "활성" : "비활성"} disabled />
					</div>
					<div className="sens-btn-group">
						<button className="common-btn-common" onClick={() => setIsEditing(true)}>
							수정
						</button>
						<button className="delete-btn-common" onClick={handleDelete}>
							삭제
						</button>
					</div>
				</div>
			) : (
				<div>
					<div className="sens-form-group">
						<label>Access Key</label>
						<input
							type="text"
							value={form.accessKey}
							onChange={(e) => setForm({ ...form, accessKey: e.target.value })}
							placeholder="Naver Cloud Access Key"
						/>
					</div>
					<div className="sens-form-group">
						<label>Secret Key</label>
						<input
							type="password"
							value={form.secretKey}
							onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
							placeholder="Naver Cloud Secret Key"
						/>
					</div>
					<div className="sens-form-group">
						<label>Service ID</label>
						<input
							type="text"
							value={form.serviceId}
							onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
							placeholder="ncp:sms:kr:..."
						/>
					</div>
					<div className="sens-form-group">
						<label>발신번호</label>
						<input
							type="text"
							value={form.senderPhone}
							onChange={(e) => setForm({ ...form, senderPhone: e.target.value })}
							placeholder="01012345678"
						/>
					</div>
					<div className="sens-btn-group">
						<button
							className="search-btn-common"
							onClick={handleSave}
							disabled={loading}
						>
							{loading ? "저장 중..." : "저장"}
						</button>
						{config && (
							<button
								className="reset-btn-common"
								onClick={() => setIsEditing(false)}
							>
								취소
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default SensConfigSection;
