import { useState, useEffect } from "react";
import { messageApi } from "../../../libs/api/messageApi";
import type { MessageHistoryItem } from "../../types/messageDto";
import Pagination from "../../components/common/Pagination";
import { useToast } from "../../components/common/toast/Toast";
import "../../styles/pages/message.css";

const MessageHistoryPage = () => {
	const [history, setHistory] = useState<MessageHistoryItem[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [loading, setLoading] = useState(false);
	const { showToast } = useToast();

	useEffect(() => {
		loadHistory();
	}, [page]);

	const loadHistory = async () => {
		setLoading(true);
		try {
			const response = await messageApi.getHistory(page, 20);
			if (response.success && response.data) {
				setHistory(response.data.content || []);
				setTotalPages(response.data.totalPages || 0);
				setTotalElements(response.data.totalElements || 0);
			}
		} catch {
			showToast("전송 이력을 불러올 수 없습니다.", "error", 3000);
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateStr: string) => {
		if (!dateStr) return "-";
		const date = new Date(dateStr);
		return date.toLocaleString("ko-KR", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="page">
			<div className="list">
				<table className="table">
					<thead>
						<tr>
							<th>전송일시</th>
							<th>수신자</th>
							<th>전화번호</th>
							<th>내용</th>
							<th>상태</th>
							<th>전송자</th>
							<th>비고</th>
						</tr>
					</thead>
					<tbody>
						{history.length === 0 ? (
							<tr>
								<td colSpan={7} className="empty-row">
									{loading ? "로딩 중..." : "전송 이력이 없습니다."}
								</td>
							</tr>
						) : (
							history.map((item) => (
								<tr
									key={item.id}
									className={
										item.status === "SUCCESS"
											? "row-success"
											: "row-failed"
									}
								>
									<td>{formatDate(item.createdAt)}</td>
									<td>{item.receiverName}</td>
									<td>{item.receiverPhone || "-"}</td>
									<td className="content-cell">
										{item.content}
									</td>
									<td>
										{item.status === "SUCCESS"
											? "성공"
											: "실패"}
									</td>
									<td>{item.sentBy}</td>
									<td>{item.errorMessage || "-"}</td>
								</tr>
							))
						)}
					</tbody>
				</table>

				<Pagination
					currentPage={page}
					totalPages={totalPages}
					totalElements={totalElements}
					loading={loading}
					onPageChange={setPage}
				/>
			</div>
		</div>
	);
};

export default MessageHistoryPage;
