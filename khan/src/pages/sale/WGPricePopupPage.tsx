import { useEffect, useState, type JSX } from "react";
import { useParams } from "react-router-dom";
import { saleApi } from "../../../libs/api/sale";
import { useErrorHandler } from "../../utils/errorHandler";
import "../../styles/pages/wgPricePopup.css";

export default function WGPricePopupPage(): JSX.Element {
	const { saleCode, goldPrice } = useParams<{
		saleCode: string;
		goldPrice?: string;
	}>();
	const [newPrice, setNewPrice] = useState<string>(goldPrice!);
	const [loading, setLoading] = useState(false);
	const [hasExistingPrice] = useState(false);
	const { handleError } = useErrorHandler();

	// WG 시세 설정
	const handleSetPrice = async () => {
		const price = parseFloat(newPrice);

		if (!newPrice.trim()) {
			alert("WG 금 시세를 입력해주세요.");
			return;
		}

		if (isNaN(price) || price < 0) {
			alert("올바른 금액을 입력해주세요.");
			return;
		}

		if (!saleCode) {
			alert("판매 코드를 찾을 수 없습니다.");
			return;
		}

		const confirmMessage = hasExistingPrice
			? `WG 금 시세를 ${price.toLocaleString()}원으로 변경하시겠습니까?`
			: `WG 금 시세를 ${price.toLocaleString()}원으로 설정하시겠습니까?`;

		if (!confirm(confirmMessage)) {
			return;
		}

		setLoading(true);
		try {
			const response = await saleApi.addSaleGoldPrice(saleCode, price);
			if (response.success) {
				alert(
					hasExistingPrice
						? "WG 금 시세가 변경되었습니다."
						: "WG 금 시세가 설정되었습니다."
				);
				// 부모 창에 변경 사항 알림
				if (window.opener) {
					window.opener.postMessage({ type: "WG_PRICE_UPDATED" }, "*");
				}
				// 창 닫기
				window.close();
			} else {
				alert(response.message || "WG 금 시세 설정에 실패했습니다.");
			}
		} catch (error) {
			handleError(error);
		} finally {
			setLoading(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSetPrice();
		}
	};

	useEffect(() => {
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div className="wg-price-popup">
			<div className="popup-header">
				<h2>WG 금 시세 설정</h2>
			</div>

			<div className="popup-content">
				{/* 거래 코드 표시 */}
				<div className="sale-code-section">
					<div className="section-title">거래 코드</div>
					<div className="sale-code-display">{saleCode}</div>
				</div>

				{/* 현재 상태 표시 */}
				{hasExistingPrice && (
					<div className="status-section">
						<div className="status-badge">시세 존재</div>
					</div>
				)}

				{/* 새 WG 시세 입력 */}
				<div className="new-price-section">
					<div className="section-title">
						{hasExistingPrice ? "변경할 " : ""}WG 금 시세
					</div>
					<div className="input-with-button">
						<div className="input-group">
							<input
								type="number"
								className="price-input"
								placeholder="WG 금 시세를 입력하세요"
								value={newPrice}
								onChange={(e) => setNewPrice(e.target.value)}
								onKeyDown={handleKeyPress}
								disabled={loading}
								step="0.01"
								min="0"
								autoFocus
							/>
							<span className="input-unit">원</span>
						</div>
						<button
							className="btn-confirm"
							onClick={handleSetPrice}
							disabled={loading || !newPrice.trim()}
						>
							{hasExistingPrice ? "변경" : "설정"}
						</button>
					</div>
				</div>

				{/* 안내 메시지 */}
				<div className="info-message">
					<span className="info-icon">⚠️</span>
					<span>기존 WG 값을 변경하면 이전 계산 값도 변경됩니다.</span>
				</div>
			</div>
		</div>
	);
}
