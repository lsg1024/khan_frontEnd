import React from "react";
import { useAuthImage } from "../../utils/imageUtils";

interface AuthImageProps {
	imagePath: string | null | undefined;
	alt: string;
	className?: string;
	style?: React.CSSProperties;
	onClick?: () => void;
}

/**
 * accessToken을 포함하여 이미지를 로드하는 컴포넌트
 */
export const AuthImage: React.FC<AuthImageProps> = ({
	imagePath,
	alt,
	className,
	style,
	onClick,
}) => {
	const { src, loading } = useAuthImage(imagePath);

	if (loading) {
		return (
			<div className={`auth-image-loading ${className || ""}`} style={style}>
				<div className="spinner"></div>
			</div>
		);
	}

	return (
		<img
			src={src}
			alt={alt}
			className={className}
			style={{ ...style, cursor: onClick ? "pointer" : undefined }}
			onClick={onClick}
			onError={(e) => {
				e.currentTarget.src = "/images/not_ready.png";
			}}
		/>
	);
};
