import { useEffect, useState, type JSX } from "react";
import { goldApi } from "../../../libs/api/goldApi";
import { useErrorHandler } from "../../utils/errorHandler";
import "../../styles/pages/settings/GoldPricePopup.css";

export default function GoldPricePopupPage(): JSX.Element {
	const [currentPrice, setCurrentPrice] = useState<number>(0);
	const [newPrice, setNewPrice] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const { handleError } = useErrorHandler();

	// 현재 금 시세 조회
	const fetchCurrentPrice = async () => {
		setLoading(true);
		try {
			const response = await goldApi.getGoldPrice();
			if (response.success && response.data !== null) {
				setCurrentPrice(response.data);
			} else {
				setCurrentPrice(0);
			}
		} catch (error) {
			handleError(error);
			setCurrentPrice(0);
		} finally {
			setLoading(false);
		}
	};

	// 금 시세 설정
	const handleSetPrice = async () => {
		const price = parseFloat(newPrice);

		if (!newPrice.trim()) {
			alert("금 시세를 입력해주세요.");
			return;
		}

		if (isNaN(price) || price < 0) {
			alert("올바른 금액을 입력해주세요.");
			return;
		}

		if (
			!confirm(`금 시세를 ${price.toLocaleString()}원으로 설정하시겠습니까?`)
		) {
			return;
		}

		setLoading(true);
		try {
			const response = await goldApi.setGoldPrice(price);
			if (response.success) {
				alert("금 시세가 설정되었습니다.");
				setNewPrice("");
				fetchCurrentPrice();
			} else {
				alert(response.message || "금 시세 설정에 실패했습니다.");
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
		fetchCurrentPrice();
	}, []);

	return (
		<div className="gold-price-popup">
			<div className="popup-header">
				<h2>금 시세 설정</h2>
			</div>

			<div className="popup-content">
				{/* 현재 금 시세 표시 */}
				<div className="current-price-section">
					<div className="section-title">현재 금 시세</div>
					<div className="price-display">
						{loading ? (
							<span className="loading-text">로딩 중...</span>
						) : (
							<>
								<span className="price-value">
									{currentPrice.toLocaleString()}
								</span>
								<span className="price-unit">원</span>
							</>
						)}
					</div>
				</div>

				{/* 새 금 시세 입력 */}
				<div className="new-price-section">
					<div className="section-title">새로운 금(G) 시세</div>
					<div className="input-with-button">
						<div className="input-group">
							<input
								type="number"
								className="price-input"
								placeholder="금(G) 시세를 입력하세요"
								value={newPrice}
								onChange={(e) => setNewPrice(e.target.value)}
								onKeyPress={handleKeyPress}
								disabled={loading}
								step="0.01"
								min="0"
							/>
							<span className="input-unit">원</span>
						</div>
						<button
							className="btn-confirm"
							onClick={handleSetPrice}
							disabled={loading || !newPrice.trim()}
						>
							확인
						</button>
					</div>
				</div>

				{/* 안내 메시지 */}
				<div className="info-message">
					<span className="info-icon">ℹ️</span>
					<span>설정된 금 시세는 상품의 시세가 계산에 사용됩니다.</span>
				</div>

				{/* 버튼 영역 */}
				<div className="button-group">
					<button
						className="btn-cancel"
						onClick={() => window.close()}
						disabled={loading}
					>
						닫기
					</button>
				</div>
			</div>
		</div>
	);
}
