import React, { useEffect } from "react";
import "../../styles/components/common/ImageZoomModal.css";

interface ImageZoomModalProps {
	imageUrl: string;
	altText?: string;
	onClose: () => void;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
	imageUrl,
	altText = "확대 이미지",
	onClose,
}) => {
	// ESC 키로 닫기
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleEscape);
		// 모달 열릴 때 body 스크롤 방지
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "unset";
		};
	}, [onClose]);

	return (
		<div className="image-zoom-modal-overlay" onClick={onClose}>
			<div
				className="image-zoom-modal-content"
				onClick={(e) => e.stopPropagation()}
			>
				<button className="image-zoom-modal-close" onClick={onClose}>
					✕
				</button>
				<img src={imageUrl} alt={altText} className="image-zoom-modal-image" />
			</div>
		</div>
	);
};

export default ImageZoomModal;
