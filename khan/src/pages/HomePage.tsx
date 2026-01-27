import { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer, type SlotInfo } from "react-big-calendar";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { startOfMonth } from "date-fns/startOfMonth";
import { endOfMonth } from "date-fns/endOfMonth";
import { getDay } from "date-fns";
import { ko } from "date-fns/locale/ko";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../src/styles/pages/home/HomePage.css";
import {
	getMaterialStockSummary,
	getStockTop5Models,
	getSaleTop5Models,
	getLaborCostTop5Stores,
	getMonthlySalesSummary,
	getReceivableSummary,
	getRentalSummary,
	getRentalDetails,
	getFactoryUnpaidSummary,
} from "../../libs/api/dashboardApi";
import {
	getSchedules,
	createSchedule,
	updateSchedule,
	deleteSchedule,
} from "../../libs/api/scheduleApi";
import type {
	MaterialStockSummary,
	StockModelTop,
	SaleModelTop,
	StoreLaborCostTop,
	MonthlySalesSummary,
	ReceivableSummary,
	RentalSummary,
	RentalDetail,
	FactoryUnpaidSummary,
} from "../types/dashboardDto";
import type { ScheduleResponse, ScheduleRequest } from "../types/scheduleDto";
import {
	ScheduleModal,
	CustomCalendarToolbar,
	StockDetailModal,
	RentalDetailModal,
	StoreStatsModal,
} from "../components/home";
import type { MyEvent } from "../components/home";

const locales = {
	ko: ko,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
});

const HomePage = () => {
	const [events, setEvents] = useState<MyEvent[]>([]);
	const [currentDate, setCurrentDate] = useState(new Date());

	// 대시보드 데이터 상태
	const [materialSummary, setMaterialSummary] = useState<
		MaterialStockSummary[]
	>([]);
	const [stockTop5, setStockTop5] = useState<StockModelTop[]>([]);
	const [saleTop5, setSaleTop5] = useState<SaleModelTop[]>([]);
	const [laborCostTop5, setLaborCostTop5] = useState<StoreLaborCostTop[]>([]);
	const [dashboardLoading, setDashboardLoading] = useState(true);
	const [stockDetailModalOpen, setStockDetailModalOpen] = useState(false);

	// 새로운 대시보드 데이터 상태
	const [monthlySales, setMonthlySales] = useState<MonthlySalesSummary | null>(
		null,
	);
	const [receivableSummary, setReceivableSummary] =
		useState<ReceivableSummary | null>(null);
	const [rentalSummary, setRentalSummary] = useState<RentalSummary | null>(
		null,
	);
	const [rentalDetails, setRentalDetails] = useState<RentalDetail[]>([]);
	const [factoryUnpaid, setFactoryUnpaid] =
		useState<FactoryUnpaidSummary | null>(null);
	const [rentalDetailModalOpen, setRentalDetailModalOpen] = useState(false);
	const [storeStatsModalOpen, setStoreStatsModalOpen] = useState(false);

	// 일정 모달 상태
	const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
	const [scheduleModalMode, setScheduleModalMode] = useState<
		"create" | "edit" | "view"
	>("create");
	const [selectedSchedule, setSelectedSchedule] = useState<MyEvent | null>(
		null,
	);

	// 현재 월 가져오기
	const currentMonth = new Date().getMonth() + 1;

	// ScheduleResponse를 MyEvent로 변환
	const convertToEvent = (schedule: ScheduleResponse): MyEvent => {
		return {
			title: schedule.title,
			start: new Date(schedule.startAt),
			end: new Date(schedule.endAt),
			allDay: schedule.allDay,
			scheduleId: schedule.scheduleId,
			content: schedule.content,
			color: schedule.color,
			repeatType: schedule.repeatType,
		};
	};

	// 일정 데이터 로드
	const fetchSchedules = useCallback(async (date: Date) => {
		try {
			const start = format(startOfMonth(date), "yyyy-MM-dd");
			const end = format(endOfMonth(date), "yyyy-MM-dd");

			const response = await getSchedules({ start, end });
			if (response.success && response.data) {
				const convertedEvents = response.data.map(convertToEvent);
				setEvents(convertedEvents);
			}
		} catch (error) {
			console.error("일정 로드 실패:", error);
		}
	}, []);

	// 현재 날짜 변경 시 일정 다시 로드
	useEffect(() => {
		fetchSchedules(currentDate);
	}, [currentDate, fetchSchedules]);

	// 대시보드 데이터 로드
	useEffect(() => {
		const fetchDashboardData = async () => {
			setDashboardLoading(true);
			try {
				const [
					materialRes,
					stockRes,
					saleRes,
					laborRes,
					monthlySalesRes,
					receivableRes,
					rentalSummaryRes,
					rentalDetailsRes,
					factoryUnpaidRes,
				] = await Promise.all([
					getMaterialStockSummary(),
					getStockTop5Models(),
					getSaleTop5Models(),
					getLaborCostTop5Stores(),
					getMonthlySalesSummary(),
					getReceivableSummary(),
					getRentalSummary(),
					getRentalDetails(),
					getFactoryUnpaidSummary(),
				]);

				if (materialRes.success && materialRes.data) {
					setMaterialSummary(materialRes.data);
				}
				if (stockRes.success && stockRes.data) {
					setStockTop5(stockRes.data);
				}
				if (saleRes.success && saleRes.data) {
					setSaleTop5(saleRes.data);
				}
				if (laborRes.success && laborRes.data) {
					setLaborCostTop5(laborRes.data);
				}
				if (monthlySalesRes.success && monthlySalesRes.data) {
					setMonthlySales(monthlySalesRes.data);
				}
				if (receivableRes.success && receivableRes.data) {
					setReceivableSummary(receivableRes.data);
				}
				if (rentalSummaryRes.success && rentalSummaryRes.data) {
					setRentalSummary(rentalSummaryRes.data);
				}
				if (rentalDetailsRes.success && rentalDetailsRes.data) {
					setRentalDetails(rentalDetailsRes.data);
				}
				if (factoryUnpaidRes.success && factoryUnpaidRes.data) {
					setFactoryUnpaid(factoryUnpaidRes.data);
				}
			} catch (error) {
				console.error("대시보드 데이터 로드 실패:", error);
			} finally {
				setDashboardLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

	// 숫자 포맷팅 함수
	const formatNumber = (num: number) => {
		return num.toLocaleString();
	};

	// 일정 생성/수정 핸들러
	const handleScheduleSave = async (data: ScheduleRequest) => {
		if (scheduleModalMode === "create") {
			const response = await createSchedule(data);
			if (response.success) {
				await fetchSchedules(currentDate);
			} else {
				throw new Error(response.message || "일정 생성 실패");
			}
		} else {
			if (!selectedSchedule?.scheduleId) return;
			const response = await updateSchedule(selectedSchedule.scheduleId, data);
			if (response.success) {
				await fetchSchedules(currentDate);
			} else {
				throw new Error(response.message || "일정 수정 실패");
			}
		}
	};

	// 일정 삭제 핸들러
	const handleScheduleDelete = async (scheduleId: string) => {
		const response = await deleteSchedule(scheduleId);
		if (response.success) {
			await fetchSchedules(currentDate);
		} else {
			throw new Error(response.message || "일정 삭제 실패");
		}
	};

	// 캘린더 빈 슬롯 클릭 (일정 생성)
	const handleSelectSlot = (slotInfo: SlotInfo) => {
		setSelectedSchedule({
			title: "",
			start: slotInfo.start,
			end: slotInfo.end,
			allDay: slotInfo.slots.length === 1,
		});
		setScheduleModalMode("create");
		setScheduleModalOpen(true);
	};

	// 캘린더 이벤트 클릭 (일정 상세/수정)
	const handleSelectEvent = (event: MyEvent) => {
		setSelectedSchedule(event);
		setScheduleModalMode("view");
		setScheduleModalOpen(true);
	};

	// 캘린더 네비게이션 (월 변경)
	const handleNavigate = (date: Date) => {
		setCurrentDate(date);
	};

	// 이벤트 스타일 지정
	const eventStyleGetter = (event: MyEvent) => {
		return {
			style: {
				backgroundColor: event.color || "#4A90A4",
				borderRadius: "4px",
				opacity: 0.9,
				color: "white",
				border: "0px",
				display: "block",
				fontSize: "12px",
				padding: "2px 4px",
			},
		};
	};

	return (
		<div className="home-page-content">
			{/* 대시보드 카드 섹션 */}
			<div className="dashboard-section">
				<div className="dashboard-cards">
					{/* 재질별 현 재고현황 */}
					<div className="dashboard-card">
						<div className="card-header">
							<h3>재질별 현 재고현황</h3>
						</div>
						<div className="card-body">
							{dashboardLoading ? (
								<div className="card-loading">로딩 중...</div>
							) : (
								<table className="dashboard-table">
									<thead>
										<tr>
											<th>재질</th>
											<th>중량</th>
											<th>수량</th>
										</tr>
									</thead>
									<tbody>
										{materialSummary.length > 0 ? (
											materialSummary.map((item, index) => (
												<tr key={index}>
													<td>{item.material}</td>
													<td>{item.totalWeight}</td>
													<td>{formatNumber(item.count)}</td>
												</tr>
											))
										) : (
											<tr>
												<td colSpan={3} className="no-data">
													데이터가 없습니다
												</td>
											</tr>
										)}
									</tbody>
								</table>
							)}
						</div>
					</div>

					{/* 재고 Top5 모델 */}
					<div className="dashboard-card">
						<div className="card-header">
							<h3>재고 Top5 모델 (기성&대여)</h3>
							<button
								className="detail-link"
								onClick={() => setStockDetailModalOpen(true)}
							>
								상세
							</button>
						</div>
						<div className="card-body">
							{dashboardLoading ? (
								<div className="card-loading">로딩 중...</div>
							) : (
								<table className="dashboard-table">
									<thead>
										<tr>
											<th>No</th>
											<th>모델번호</th>
											<th>재고개수</th>
										</tr>
									</thead>
									<tbody>
										{stockTop5.length > 0 ? (
											stockTop5.map((item, index) => (
												<tr key={index}>
													<td>{index + 1}</td>
													<td className="product-name">{item.productName}</td>
													<td>{formatNumber(item.stockCount)}</td>
												</tr>
											))
										) : (
											<tr>
												<td colSpan={3} className="no-data">
													데이터가 없습니다
												</td>
											</tr>
										)}
									</tbody>
								</table>
							)}
						</div>
					</div>

					{/* 당월 판매 Top5 모델 */}
					<div className="dashboard-card">
						<div className="card-header">
							<h3>{currentMonth}월 판매 Top5 모델</h3>
						</div>
						<div className="card-body">
							{dashboardLoading ? (
								<div className="card-loading">로딩 중...</div>
							) : (
								<table className="dashboard-table">
									<thead>
										<tr>
											<th>No</th>
											<th>모델번호</th>
											<th>판매개수</th>
										</tr>
									</thead>
									<tbody>
										{saleTop5.length > 0 ? (
											saleTop5.map((item, index) => (
												<tr key={index}>
													<td>{index + 1}</td>
													<td className="product-name">{item.productName}</td>
													<td>{formatNumber(item.saleCount)}</td>
												</tr>
											))
										) : (
											<tr>
												<td colSpan={3} className="no-data">
													데이터가 없습니다
												</td>
											</tr>
										)}
									</tbody>
								</table>
							)}
						</div>
					</div>

					{/* 당월 매출공임 Top5 거래처 */}
					<div className="dashboard-card">
						<div className="card-header">
							<h3>{currentMonth}월 매출공임 Top5 거래처</h3>
						</div>
						<div className="card-body">
							{dashboardLoading ? (
								<div className="card-loading">로딩 중...</div>
							) : (
								<table className="dashboard-table">
									<thead>
										<tr>
											<th>No</th>
											<th>거래처</th>
											<th>매출공임</th>
										</tr>
									</thead>
									<tbody>
										{laborCostTop5.length > 0 ? (
											laborCostTop5.map((item, index) => (
												<tr key={index}>
													<td>{index + 1}</td>
													<td className="store-name">{item.storeName}</td>
													<td>{formatNumber(item.totalLaborCost)}</td>
												</tr>
											))
										) : (
											<tr>
												<td colSpan={3} className="no-data">
													데이터가 없습니다
												</td>
											</tr>
										)}
									</tbody>
								</table>
							)}
						</div>
					</div>

					{/* 당월 매출 현황 */}
					<div className="dashboard-card">
						<div className="card-header">
							<h3>{currentMonth}월 매출 현황</h3>
							<button
								className="detail-link"
								onClick={() => setStoreStatsModalOpen(true)}
							>
								상세
							</button>
						</div>
						<div className="card-body">
							{dashboardLoading ? (
								<div className="card-loading">로딩 중...</div>
							) : monthlySales ? (
								<div className="summary-stats">
									<div className="stat-item">
										<span className="stat-label">매출 순금</span>
										<span className="stat-value">
											{monthlySales.salePureGold}g
										</span>
									</div>
									<div className="stat-item">
										<span className="stat-label">매출 공임</span>
										<span className="stat-value">
											{formatNumber(monthlySales.saleLaborCost)}원
										</span>
									</div>
									<div className="stat-item">
										<span className="stat-label">마진 공임</span>
										<span className="stat-value highlight">
											{formatNumber(monthlySales.marginLaborCost)}원
										</span>
									</div>
								</div>
							) : (
								<div className="no-data">데이터가 없습니다</div>
							)}
						</div>
					</div>

					{/* 현 미수 현황 */}
					<div className="dashboard-card">
						<div className="card-header">
							<h3>현 미수 현황</h3>
						</div>
						<div className="card-body">
							{dashboardLoading ? (
								<div className="card-loading">로딩 중...</div>
							) : receivableSummary ? (
								<div className="summary-stats">
									<div className="stat-item">
										<span className="stat-label">미수 순금</span>
										<span className="stat-value warning">
											{receivableSummary.totalPureGold}g
										</span>
									</div>
									<div className="stat-item">
										<span className="stat-label">미수 금액</span>
										<span className="stat-value warning">
											{formatNumber(receivableSummary.totalAmount)}원
										</span>
									</div>
								</div>
							) : (
								<div className="no-data">데이터가 없습니다</div>
							)}
						</div>
					</div>

					{/* 현 대여 현황 */}
					<div className="dashboard-card">
						<div className="card-header">
							<h3>현 대여 현황</h3>
							<button
								className="detail-link"
								onClick={() => setRentalDetailModalOpen(true)}
							>
								상세
							</button>
						</div>
						<div className="card-body">
							{dashboardLoading ? (
								<div className="card-loading">로딩 중...</div>
							) : rentalSummary ? (
								<div className="summary-stats">
									<div className="stat-item">
										<span className="stat-label">대여 순금</span>
										<span className="stat-value">
											{rentalSummary.totalPureGold}g
										</span>
									</div>
									<div className="stat-item">
										<span className="stat-label">대여 공임</span>
										<span className="stat-value">
											{formatNumber(rentalSummary.totalLaborCost)}원
										</span>
									</div>
									<div className="stat-item">
										<span className="stat-label">대여 수량</span>
										<span className="stat-value">
											{formatNumber(rentalSummary.totalCount)}개
										</span>
									</div>
								</div>
							) : (
								<div className="no-data">데이터가 없습니다</div>
							)}
						</div>
					</div>

					{/* 매입처 미결제 현황 */}
					<div className="dashboard-card">
						<div className="card-header">
							<h3>매입처 미결제 현황</h3>
						</div>
						<div className="card-body">
							{dashboardLoading ? (
								<div className="card-loading">로딩 중...</div>
							) : factoryUnpaid ? (
								<div className="summary-stats">
									<div className="stat-item">
										<span className="stat-label">미결제 순금</span>
										<span className="stat-value warning">
											{factoryUnpaid.totalPureGold}g
										</span>
									</div>
									<div className="stat-item">
										<span className="stat-label">미결제 금액</span>
										<span className="stat-value warning">
											{formatNumber(factoryUnpaid.totalAmount)}원
										</span>
									</div>
								</div>
							) : (
								<div className="no-data">데이터가 없습니다</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* 달력 섹션 */}
			<div className="calendar-container">
				{/* 스케줄 관리 툴바 */}
				<div className="schedule-toolbar">
					<h3 className="schedule-toolbar-title">스케줄관리</h3>
					<div className="schedule-toolbar-controls">
						<select
							className="schedule-select"
							value={currentDate.getFullYear()}
							onChange={(e) => {
								const newDate = new Date(currentDate);
								newDate.setFullYear(parseInt(e.target.value));
								setCurrentDate(newDate);
							}}
						>
							{Array.from({ length: 5 }, (_, i) => {
								const year = new Date().getFullYear() - 2 + i;
								return (
									<option key={year} value={year}>
										{year}년
									</option>
								);
							})}
						</select>
						<select
							className="schedule-select"
							value={currentDate.getMonth()}
							onChange={(e) => {
								const newDate = new Date(currentDate);
								newDate.setMonth(parseInt(e.target.value));
								setCurrentDate(newDate);
							}}
						>
							{Array.from({ length: 12 }, (_, i) => (
								<option key={i} value={i}>
									{i + 1}월
								</option>
							))}
						</select>
						<select className="schedule-select schedule-select-wide">
							<option value="">반복구분</option>
							<option value="NONE">반복 없음</option>
							<option value="DAILY">매일</option>
							<option value="WEEKLY">매주</option>
							<option value="MONTHLY">매월</option>
							<option value="YEARLY">매년</option>
						</select>
						<button
							className="schedule-toolbar-btn schedule-btn-search"
							onClick={() => fetchSchedules(currentDate)}
						>
							검색
						</button>
						<button
							className="schedule-toolbar-btn btn-refresh"
							onClick={() => fetchSchedules(currentDate)}
						>
							새로고침
						</button>
						<button
							className="schedule-toolbar-btn btn-register"
							onClick={() => {
								setSelectedSchedule({
									title: "",
									start: new Date(),
									end: new Date(),
									allDay: false,
								});
								setScheduleModalMode("create");
								setScheduleModalOpen(true);
							}}
						>
							자료등록
						</button>
					</div>
				</div>
				<div className="calendar-wrapper">
					<Calendar
						localizer={localizer}
						events={events}
						startAccessor="start"
						endAccessor="end"
						style={{ height: "100%" }}
						culture="ko"
						views={["month"]}
						view="month"
						date={currentDate}
						onNavigate={handleNavigate}
						onView={() => {}}
						components={{
							toolbar: CustomCalendarToolbar,
						}}
						messages={{
							noEventsInRange: "이 기간에 일정이 없습니다.",
						}}
						selectable
						onSelectSlot={handleSelectSlot}
						onSelectEvent={handleSelectEvent}
						eventPropGetter={eventStyleGetter}
					/>
				</div>
			</div>

			{/* 재고 상세보기 모달 */}
			<StockDetailModal
				isOpen={stockDetailModalOpen}
				onClose={() => setStockDetailModalOpen(false)}
			/>

			{/* 일정 모달 */}
			<ScheduleModal
				isOpen={scheduleModalOpen}
				onClose={() => setScheduleModalOpen(false)}
				mode={scheduleModalMode}
				schedule={selectedSchedule}
				onSave={handleScheduleSave}
				onDelete={handleScheduleDelete}
			/>

			{/* 대여 현황 상세 모달 */}
			<RentalDetailModal
				isOpen={rentalDetailModalOpen}
				onClose={() => setRentalDetailModalOpen(false)}
				rentalDetails={rentalDetails}
				loading={dashboardLoading}
			/>

			{/* 거래처별 거래 통계 상세 모달 */}
			<StoreStatsModal
				isOpen={storeStatsModalOpen}
				onClose={() => setStoreStatsModalOpen(false)}
			/>
		</div>
	);
};

export default HomePage;
