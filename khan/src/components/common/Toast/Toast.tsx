import { useState, createContext, useContext } from "react";
import "./Toast.css";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
}

interface ToastContextValue {
	toasts: ToastMessage[];
	showToast: (message: string, type?: ToastType, duration?: number) => void;
	removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastContainerProps {
	toasts: ToastMessage[];
	onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
	if (toasts.length === 0) return null;

	return (
		<div className="toast-container">
			{toasts.map((toast) => (
				<div
					key={toast.id}
					className={`toast toast--${toast.type}`}
					onClick={() => onClose(toast.id)}
				>
					<div className="toast-icon">
						{toast.type === "success" && "✓"}
						{toast.type === "error" && "✕"}
						{toast.type === "warning" && "⚠"}
						{toast.type === "info" && "ℹ"}
					</div>
					<div className="toast-message">{toast.message}</div>
					<button
						className="toast-close"
						onClick={(e) => {
							e.stopPropagation();
							onClose(toast.id);
						}}
						aria-label="닫기"
					>
						✕
					</button>
				</div>
			))}
		</div>
	);
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [toasts, setToasts] = useState<ToastMessage[]>([]);

	const showToast = (
		message: string,
		type: ToastType = "info",
		duration = 3000,
	) => {
		const id = `toast-${Date.now()}-${Math.random()}`;
		setToasts((prev) => [...prev, { id, message, type, duration }]);

		if (duration > 0) {
			setTimeout(() => removeToast(id), duration);
		}
	};

	const removeToast = (id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	};

	return (
		<ToastContext.Provider value={{ toasts, showToast, removeToast }}>
			{children}
			<ToastContainer toasts={toasts} onClose={removeToast} />
		</ToastContext.Provider>
	);
};

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within ToastProvider");
	}
	return context;
};
