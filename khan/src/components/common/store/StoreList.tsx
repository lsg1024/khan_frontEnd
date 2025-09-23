import React from "react";
import "../../../styles/components/accountSearch.css";
import type { StoreSearchDto } from "../../../types/store";

interface StoreListProps {
	stores: StoreSearchDto[];
	onSelectStore: (store: StoreSearchDto) => void;
}

const StoreList: React.FC<StoreListProps> = ({ stores, onSelectStore }) => {
	const handleStoreSelect = (store: StoreSearchDto) => {
		onSelectStore(store);
	};

	return (
		<div className="accounts-list">
			{stores.length > 0 ? (
				<>
					<div className="accounts-table">
						{/* 테이블 헤더 */}
						<div className="table-header">
							<span className="col-name">거래처명</span>
							<span className="col-owner">대표자</span>
							<span className="col-phone">연락처</span>
							<span className="col-level">등급</span>
							<span className="col-harry">해리</span>
							<span className="col-trade">거래방식</span>
							<span className="col-action">선택</span>
						</div>

						{/* 거래처 목록 */}
						{stores.map((store, index) => (
							<div
								key={store.storeId || `store-${index}`}
								className="table-row"
							>
								<span className="col-name" title={store.storeName}>
									{store.storeName}
								</span>
								<span className="col-owner">{store.storeOwnerName}</span>
								<span className="col-phone">{store.storePhoneNumber}</span>
								<span className="col-level">
									<span
										className={`level-badge level-${store.level.toLowerCase()}`}
									>
										{store.level + "급"}
									</span>
								</span>
								<span className="col-harry">{store.goldHarryLoss}%</span>
								<span className="col-trade">{store.tradeType}</span>
								<span className="col-action">
									<button
										className="select-button"
										onClick={() => handleStoreSelect(store)}
									>
										선택
									</button>
								</span>
							</div>
						))}
					</div>
				</>
			) : (
				<div className="no-results">검색된 거래처가 없습니다.</div>
			)}
		</div>
	);
};

export default StoreList;
