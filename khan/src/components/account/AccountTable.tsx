import React from "react";
import type { StoreSearchDto } from "../../types/store";
import type { FactorySearchDto } from "../../types/factory";

interface Column {
	key: string;
	label: string;
	width?: string;
	maxWidth?: string;
	render?: (item: StoreSearchDto | FactorySearchDto) => React.ReactNode;
}

interface AccountTableProps {
	data: StoreSearchDto[] | FactorySearchDto[];
	columns: Column[];
	selectedIds: Set<number>;
	currentPage: number;
	size: number;
	onSelectOne: (id: number) => void;
	onDetailClick: (id: number) => void;
	getItemId: (item: StoreSearchDto | FactorySearchDto) => number;
}

const AccountTable: React.FC<AccountTableProps> = ({
	data,
	columns,
	selectedIds,
	currentPage,
	size,
	onSelectOne,
	onDetailClick,
	getItemId,
}) => {
	return (
		<table className="table">
			<thead>
				<tr>
					<th style={{ width: "60px" }}>선택</th>
					<th style={{ width: "50px" }}>No</th>
					{columns.map((column) => (
						<th
							key={column.key}
							style={{
								...(column.width && { width: column.width }),
								...(column.maxWidth && { maxWidth: column.maxWidth }),
							}}
						>
							{column.label}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{data.map((item, index) => {
                    const rowNumber = (currentPage - 1) * size + index + 1;
					const itemId = getItemId(item);
					return (
						<tr key={itemId}>
							<td>
								<input
									type="checkbox"
									checked={selectedIds.has(itemId)}
									onChange={() => onSelectOne(itemId)}
								/>
							</td>
							<td className="no-cell">
								<button
									className="no-btn"
									onClick={(e) => {
										e.stopPropagation();
										onDetailClick(itemId);
									}}
								>
									{rowNumber}
								</button>
							</td>
							{columns.map((column) => {
								const value = column.render
									? column.render(item)
									: String(
											(
												item as unknown as Record<
													string,
													string | number | undefined
												>
											)[column.key] || ""
									  ) || "-";
								return (
									<td
										key={column.key}
										style={{
											...(column.maxWidth && {
												maxWidth: column.maxWidth,
												overflow: "hidden",
												textOverflow: "ellipsis",
											}),
										}}
									>
										{value}
									</td>
								);
							})}
						</tr>
					);
				})}
			</tbody>
		</table>
	);
};

export default AccountTable;
