import React from "react";
import "../../../styles/components/search/AccountSearch.css";
import type { StoreSearchDto, AccountInfoDto } from "../../../types/storeDto";

interface StoreListProps {
	stores: (StoreSearchDto | AccountInfoDto)[];
	onSelectStore: (store: StoreSearchDto | AccountInfoDto) => void;
}

const StoreList: React.FC<StoreListProps> = ({ stores, onSelectStore }) => {
	const handleStoreSelect = (store: StoreSearchDto | AccountInfoDto) => {
		onSelectStore(store);
	};

	// AccountInfoDto인지 확인하는 타입 가드
	const isStoreAttempt = (
		store: StoreSearchDto | AccountInfoDto
	): store is AccountInfoDto => {
		return "goldWeight" in store || "moneyAmount" in store;
	};

	return (
		<div className="accounts-list">
			{stores.length > 0 ? (
				<>
					<div className="accounts-table">
						{/* 테이블 헤더 */}
						<div className="table-header">
							<span className="col-name">거래처명</span>
							{!isStoreAttempt(stores[0]) && (
								<>
									<span className="col-owner">대표자</span>
									<span className="col-phone">연락처</span>
								</>
							)}
							<span className="col-level">등급</span>
							<span className="col-harry">해리</span>
							<span className="col-trade">거래방식</span>
							{isStoreAttempt(stores[0]) && (
								<>
									<span className="col-gold">미수(금)</span>
									<span className="col-money">미수(금액)</span>
								</>
							)}
							<span className="col-action">선택</span>
						</div>

						{/* 거래처 목록 */}
						{stores.map((store, index) => (
							<div
								key={store.accountId || `store-${index}`}
								className="table-row"
							>
								<span className="col-name" title={store.accountName}>
									{store.accountName}
								</span>
								{!isStoreAttempt(store) && (
									<>
										<span className="col-owner">{store.businessOwnerName}</span>
										<span className="col-phone">
											{store.businessOwnerNumber}
										</span>
									</>
								)}
								<span className="col-level">
									<span
										className={`level-badge level-${store.grade.toLowerCase()}`}
									>
										{store.grade + "급"}
									</span>
								</span>
								<span className="col-harry">{store.goldHarryLoss}%</span>
								<span className="col-trade">{store.tradeType}</span>
								{isStoreAttempt(store) && (
									<>
										<span className="col-gold">{store.goldWeight}g</span>
										<span className="col-money">
											{Number(store.moneyAmount).toLocaleString()}원
										</span>
									</>
								)}
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
