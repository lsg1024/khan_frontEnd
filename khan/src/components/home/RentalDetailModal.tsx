import { format } from "date-fns/format";
import type { RentalDetail } from "../../types/dashboardDto";

interface RentalDetailModalProps {
	isOpen: boolean;
	onClose: () => void;
	rentalDetails: RentalDetail[];
	loading: boolean;
}

const RentalDetailModal = ({
	isOpen,
	onClose,
	rentalDetails,
	loading,
}: RentalDetailModalProps) => {
	if (!isOpen) return null;

	const formatDate = (dateStr: string) => {
		if (!dateStr) return "-";
		try {
			const date = new Date(dateStr);
			return format(date, "yy-MM-dd HH:mm");
		} catch {
			return "-";
		}
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className="modal-content modal-content-lg"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-header">
					<h2>대여 현황 상세</h2>
					<button className="modal-close-button" onClick={onClose}>
						×
					</button>
				</div>
				<div className="modal-body">
					{loading ? (
						<div className="loading-message">로딩 중...</div>
					) : (
						<div className="stock-detail-table-container">
							<table className="table stock-detail-table">
								<thead>
									<tr>
										<th>거래처</th>
										<th>전화번호</th>
										<th>연락처1</th>
										<th>순금</th>
										<th>공임</th>
										<th>수량</th>
										<th>최초대여일</th>
										<th>최종대여일</th>
									</tr>
								</thead>
								<tbody>
									{rentalDetails.length > 0 ? (
										rentalDetails.map((item, index) => (
											<tr key={index}>
												<td>{item.storeName}</td>
												<td>{item.phoneNumber || "-"}</td>
												<td>{item.contactNumber1 || "-"}</td>
												<td>{item.pureGold}g</td>
												<td>{item.laborCost.toLocaleString()}원</td>
												<td>{item.count}</td>
												<td>{formatDate(item.firstRentalDate)}</td>
												<td>{formatDate(item.lastRentalDate)}</td>
											</tr>
										))
									) : (
										<tr>
											<td colSpan={8} className="no-data">
												대여 데이터가 없습니다
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default RentalDetailModal;
