import type { AccountInfoDto } from "../../../types/store";
import "../../../styles/components/sale/AccountsReceivableList.css";

interface AccountsReceivableListProps {
	stores: AccountInfoDto[];
	loading: boolean;
}

export const AccountsReceivableList = ({
	stores,
	loading,
}: AccountsReceivableListProps) => {
	if (loading) {
		return <div className="loading-message">목록을 불러오는 중...</div>;
	}

	if (stores.length === 0) {
		return <div className="no-data-message">데이터가 없습니다.</div>;
	}

	return (
		<table className="table">
			<thead>
				<tr>
					<th>거래처명</th>
					<th>등급</th>
					<th>해리</th>
					<th>거래방식</th>
					<th>대표자</th>
					<th>연락처</th>
					<th>사업장번호1</th>
					<th>사업장번호2</th>
					<th>팩스번호</th>
					<th>주소</th>
					<th>비고</th>
					<th>최종결제일</th>
					<th>미수(금)</th>
					<th>미수(금액)</th>
				</tr>
			</thead>
			<tbody>
				{stores.map((store, index) => (
					<tr key={store.accountId || `store-${index}`}>
						<td className="store-name">{store.accountName}</td>
						<td>
							<span
								className={`level-badge level-${store.level.toLowerCase()}`}
							>
								{store.level}급
							</span>
						</td>
						<td>{store.goldHarryLoss}%</td>
						<td>{store.tradeType}</td>
						<td>{store.businessOwnerName || "-"}</td>
						<td>{store.businessOwnerNumber || "-"}</td>
						<td>{store.businessNumber1 || "-"}</td>
						<td>{store.businessNumber2 || "-"}</td>
						<td>{store.faxNumber || "-"}</td>
						<td className="address-cell" title={store.address || "-"}>
							{store.address || "-"}
						</td>
						<td className="note-cell" title={store.note || "-"}>
							{store.note || "-"}
						</td>
						<td className="date-cell">
							{store.lastPaymentDate
								? (() => {
										const date = new Date(store.lastPaymentDate);
										const year = String(date.getFullYear()).slice(-2);
										const month = String(date.getMonth() + 1).padStart(2, "0");
										const day = String(date.getDate()).padStart(2, "0");
										return `${year}-${month}-${day}`;
								  })()
								: "-"}
						</td>
						<td className="gold-weight">{store.goldWeight}g</td>
						<td className="money-amount">
							{Number(store.moneyAmount).toLocaleString()}원
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};

export default AccountsReceivableList;
