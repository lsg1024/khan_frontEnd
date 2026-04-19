import type { JSX } from "react";
import SensConfigSection from "../../components/setting/SensConfigSection";
import "../../styles/pages/settings/UserManagementPopup.css";

export default function MessageSettingsPopupPage(): JSX.Element {
	return (
		<div className="user-management-popup-page">
			<div className="popup-header">
				<h3 style={{ margin: "0 0 0 10px", fontSize: "1rem", color: "var(--text-primary)" }}>
					메시지 전송 설정
				</h3>
			</div>
			<SensConfigSection />
		</div>
	);
}
