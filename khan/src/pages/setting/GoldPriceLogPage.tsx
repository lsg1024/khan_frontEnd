import { useEffect, useState, type JSX } from "react";
import { goldApi, type GoldPriceLog } from "../../../libs/api/goldApi";
import { useErrorHandler } from "../../utils/errorHandler";
import "../../styles/pages/settings/GoldPriceLog.css";

export default function GoldPriceLogPage(): JSX.Element {
	const [logs, setLogs] = useState<GoldPriceLog[]>([]);
	const [loading, setLoading] = useState(false);
	const { handleError } = useErrorHandler();

	// 금 시세 로그 조회
	const fetchGoldPriceLogs = async () => {
		setLoading(true);
		try {
			const response = await goldApi.getGoldPrices();
			if (response.success && response.data) {
				setLogs(response.data);
			} else {
				setLogs([]);
			}
		} catch (error) {
			handleError(error);
			setLogs([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchGoldPriceLogs();
	}, []);

	// 날짜 포맷팅
	const formatDate = (dateString: string): string => {
		try {
			const date = new Date(dateString);
			return date.toLocaleString("ko-KR", {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			});
		} catch {
			return dateString;
		}
	};

	// 이전 가격 대비 변화량 계산
	const getPriceChange = (currentIndex: number): { change: number; isUp: boolean | null } => {
		if (currentIndex >= logs.length - 1) {
			return { change: 0, isUp: null };
		}
		const currentPrice = logs[currentIndex].goldPrice;
		const prevPrice = logs[currentIndex + 1].goldPrice;
		const change = currentPrice - prevPrice;
		return {
			change,
			isUp: change > 0 ? true : change < 0 ? false : null,
		};
	};

	return (
		<div className="gold-price-log-page">
			<div className="log-header">
				<h2>금 시세 변경 내역</h2>
				<button className="btn-back" onClick={() => window.close()}>
					닫기
				</button>
			</div>

			<div className="log-content">
				{loading ? (
					<div className="loading-state">
						<div className="spinner"></div>
						<p>로딩 중...</p>
					</div>
				) : logs.length === 0 ? (
					<div className="empty-state">
						<p>금 시세 변경 내역이 없습니다.</p>
					</div>
				) : (
					<div className="log-table-container">
						<table className="log-table">
							<thead>
								<tr>
									<th>No</th>
									<th>금 시세</th>
									<th>변동</th>
									<th>변경일시</th>
								</tr>
							</thead>
							<tbody>
								{logs.map((log, index) => {
									const { change, isUp } = getPriceChange(index);
									return (
										<tr key={index}>
											<td className="col-no">{logs.length - index}</td>
											<td className="col-price">
												{log.goldPrice.toLocaleString()}원
											</td>
											<td className="col-change">
												{isUp === null ? (
													<span className="change-neutral">-</span>
												) : isUp ? (
													<span className="change-up">
														▲ {change.toLocaleString()}
													</span>
												) : (
													<span className="change-down">
														▼ {Math.abs(change).toLocaleString()}
													</span>
												)}
											</td>
											<td className="col-date">{formatDate(log.createDate)}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
