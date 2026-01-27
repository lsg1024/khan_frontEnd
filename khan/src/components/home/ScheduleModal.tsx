import { useState, useEffect } from "react";
import { format } from "date-fns/format";
import type { ScheduleRequest, RepeatType } from "../../types/scheduleDto";
import type { MyEvent } from "./types";
import { COLOR_OPTIONS, REPEAT_OPTIONS } from "./types";

interface ScheduleModalProps {
	isOpen: boolean;
	onClose: () => void;
	mode: "create" | "edit" | "view";
	schedule?: MyEvent | null;
	onSave: (data: ScheduleRequest) => Promise<void>;
	onDelete?: (scheduleId: string) => Promise<void>;
}

const ScheduleModal = ({
	isOpen,
	onClose,
	mode,
	schedule,
	onSave,
	onDelete,
}: ScheduleModalProps) => {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [startDate, setStartDate] = useState("");
	const [startTime, setStartTime] = useState("09:00");
	const [endDate, setEndDate] = useState("");
	const [endTime, setEndTime] = useState("10:00");
	const [allDay, setAllDay] = useState(false);
	const [repeatType, setRepeatType] = useState<RepeatType>("NONE");
	const [color, setColor] = useState("#4A90A4");
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);

	useEffect(() => {
		if (isOpen) {
			if (mode === "create") {
				const now = new Date();
				const dateStr = format(now, "yyyy-MM-dd");
				setTitle("");
				setContent("");
				setStartDate(dateStr);
				setStartTime("09:00");
				setEndDate(dateStr);
				setEndTime("10:00");
				setAllDay(false);
				setRepeatType("NONE");
				setColor("#4A90A4");
				setIsEditMode(true);
			} else if (schedule) {
				setTitle(schedule.title || "");
				setContent(schedule.content || "");
				setStartDate(format(schedule.start, "yyyy-MM-dd"));
				setStartTime(format(schedule.start, "HH:mm"));
				setEndDate(format(schedule.end, "yyyy-MM-dd"));
				setEndTime(format(schedule.end, "HH:mm"));
				setAllDay(schedule.allDay || false);
				setRepeatType(schedule.repeatType || "NONE");
				setColor(schedule.color || "#4A90A4");
				setIsEditMode(mode === "edit");
			}
		}
	}, [isOpen, mode, schedule]);

	useEffect(() => {
		if (isOpen && mode === "create" && schedule) {
			setStartDate(format(schedule.start, "yyyy-MM-dd"));
			setStartTime(format(schedule.start, "HH:mm"));
			setEndDate(format(schedule.end, "yyyy-MM-dd"));
			setEndTime(format(schedule.end, "HH:mm"));
		}
	}, [isOpen, mode, schedule]);

	const handleSave = async () => {
		if (!title.trim()) {
			alert("일정 제목을 입력해주세요.");
			return;
		}

		setSaving(true);
		try {
			const startAt = allDay
				? `${startDate}T00:00:00`
				: `${startDate}T${startTime}:00`;
			const endAt = allDay
				? `${endDate}T23:59:59`
				: `${endDate}T${endTime}:00`;

			await onSave({
				title: title.trim(),
				content: content.trim(),
				startAt,
				endAt,
				allDay,
				repeatType,
				color,
			});
			onClose();
		} catch (error) {
			console.error("일정 저장 실패:", error);
			alert("일정 저장에 실패했습니다.");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!schedule?.scheduleId || !onDelete) return;

		if (!confirm("이 일정을 삭제하시겠습니까?")) return;

		setDeleting(true);
		try {
			await onDelete(schedule.scheduleId);
			onClose();
		} catch (error) {
			console.error("일정 삭제 실패:", error);
			alert("일정 삭제에 실패했습니다.");
		} finally {
			setDeleting(false);
		}
	};

	if (!isOpen) return null;

	const isViewMode = mode === "view" && !isEditMode;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className="modal-content schedule-modal"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-header">
					<h2>
						{mode === "create"
							? "일정 추가"
							: isViewMode
							? "일정 상세"
							: "일정 수정"}
					</h2>
					<button className="modal-close-button" onClick={onClose}>
						×
					</button>
				</div>
				<div className="modal-body schedule-modal-body">
					<div className="schedule-form">
						<div className="form-group">
							<label>제목 *</label>
							{isViewMode ? (
								<div className="view-value">{title}</div>
							) : (
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="일정 제목을 입력하세요"
									className="form-input"
								/>
							)}
						</div>

						<div className="form-group">
							<label>내용</label>
							{isViewMode ? (
								<div className="view-value">{content || "-"}</div>
							) : (
								<textarea
									value={content}
									onChange={(e) => setContent(e.target.value)}
									placeholder="일정 내용을 입력하세요"
									className="form-textarea"
									rows={3}
								/>
							)}
						</div>

						<div className="form-group">
							<label className="checkbox-label">
								{isViewMode ? (
									<span>{allDay ? "종일 일정" : "시간 지정 일정"}</span>
								) : (
									<>
										<input
											type="checkbox"
											checked={allDay}
											onChange={(e) => setAllDay(e.target.checked)}
										/>
										<span>종일</span>
									</>
								)}
							</label>
						</div>

						<div className="form-row">
							<div className="form-group">
								<label>시작</label>
								{isViewMode ? (
									<div className="view-value">
										{startDate} {!allDay && startTime}
									</div>
								) : (
									<div className="datetime-inputs">
										<input
											type="date"
											value={startDate}
											onChange={(e) => setStartDate(e.target.value)}
											className="form-input"
										/>
										{!allDay && (
											<input
												type="time"
												value={startTime}
												onChange={(e) => setStartTime(e.target.value)}
												className="form-input"
											/>
										)}
									</div>
								)}
							</div>
							<div className="form-group">
								<label>종료</label>
								{isViewMode ? (
									<div className="view-value">
										{endDate} {!allDay && endTime}
									</div>
								) : (
									<div className="datetime-inputs">
										<input
											type="date"
											value={endDate}
											onChange={(e) => setEndDate(e.target.value)}
											className="form-input"
										/>
										{!allDay && (
											<input
												type="time"
												value={endTime}
												onChange={(e) => setEndTime(e.target.value)}
												className="form-input"
											/>
										)}
									</div>
								)}
							</div>
						</div>

						<div className="form-row">
							<div className="form-group">
								<label>반복</label>
								{isViewMode ? (
									<div className="view-value">
										{REPEAT_OPTIONS.find((o) => o.value === repeatType)?.label}
									</div>
								) : (
									<select
										value={repeatType}
										onChange={(e) => setRepeatType(e.target.value as RepeatType)}
										className="form-select"
									>
										{REPEAT_OPTIONS.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</select>
								)}
							</div>
							<div className="form-group">
								<label>색상</label>
								{isViewMode ? (
									<div className="view-value">
										<span
											className="color-preview"
											style={{ backgroundColor: color }}
										></span>
										{COLOR_OPTIONS.find((o) => o.value === color)?.label ||
											color}
									</div>
								) : (
									<div className="color-picker">
										{COLOR_OPTIONS.map((opt) => (
											<button
												key={opt.value}
												type="button"
												className={`color-option ${
													color === opt.value ? "selected" : ""
												}`}
												style={{ backgroundColor: opt.value }}
												onClick={() => setColor(opt.value)}
												title={opt.label}
											/>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className="modal-footer schedule-modal-footer">
					{isViewMode ? (
						<>
							<button
								className="btn btn-secondary"
								onClick={() => setIsEditMode(true)}
							>
								수정
							</button>
							<button
								className="btn btn-danger"
								onClick={handleDelete}
								disabled={deleting}
							>
								{deleting ? "삭제 중..." : "삭제"}
							</button>
						</>
					) : (
						<>
							<button className="btn btn-secondary" onClick={onClose}>
								취소
							</button>
							<button
								className="btn btn-primary"
								onClick={handleSave}
								disabled={saving}
							>
								{saving ? "저장 중..." : "저장"}
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default ScheduleModal;
