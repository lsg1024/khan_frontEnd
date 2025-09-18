import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../../../libs/api/order";
import { materialApi } from "../../../libs/api/material";
import { colorApi } from "../../../libs/api/color";
import { priorityApi } from "../../../libs/api/priority";
import { productApi } from "../../../libs/api/product";
import { assistantStoneApi } from "../../../libs/api/assistantStone";
import { useErrorHandler } from "../../utils/errorHandler";
import type { OrderRowData, OrderCreateRequest } from "../../types/order";
import OrderTable from "../../components/common/order/OrderTable";

const OrderDetailPage: React.FC = () => {

    const navigate = useNavigate();
	const { handleError } = useErrorHandler();

    const [orderRows, setOrderRows] = useState<OrderRowData[]>([]);
    const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

    	// 드롭다운 데이터
	const [materials, setMaterials] = useState<
		{ materialId: string; materialName: string }[]
	>([]);
	const [colors, setColors] = useState<
		{ colorId: string; colorName: string }[]
	>([]);
	const [priorities, setPriorities] = useState<
		{ priorityName: string; priorityDate: number }[]
	>([]);
	const [assistantStones, setAssistantStones] = useState<
		{ assistantStoneId: number; assistantStoneName: string }[]
	>([]);


	return (
		<div>
			<h1>주문 상세 페이지</h1>

            <OrderTable
                mode="update"
                orderRows={orderRows}
                initialRowCount={1}
                loading={loading}
                materials={materials}
                colors={colors}
                priorities={priorities}
                assistantStones={assistantStones}
                onRowDelete={false}
				onRowUpdate={updateOrderRow}
				onRowFocus={handleRowFocus}
				onRequiredFieldClick={handleRequiredFieldClick}
                orderRows={orderRows} />
		</div>
	);
};

export default OrderDetailPage;