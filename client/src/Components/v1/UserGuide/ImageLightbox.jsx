import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { typography, spacing } from "./styles/theme";

const ImageLightbox = ({ src, alt, caption, onClose }) => {
	// Close on escape key
	const handleKeyDown = useCallback(
		(e) => {
			if (e.key === "Escape") {
				onClose();
			}
		},
		[onClose]
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [handleKeyDown]);

	// Close when clicking backdrop
	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<div
			onClick={handleBackdropClick}
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: "rgba(0, 0, 0, 0.9)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 2000,
				padding: spacing.xl,
				cursor: "zoom-out",
			}}
		>
			{/* Close button */}
			<button
				onClick={onClose}
				style={{
					position: "absolute",
					top: 16,
					right: 16,
					width: 40,
					height: 40,
					borderRadius: "50%",
					backgroundColor: "rgba(255, 255, 255, 0.1)",
					border: "none",
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					transition: "background-color 150ms ease",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
				}}
				title="Close (Esc)"
			>
				<X
					size={24}
					strokeWidth={1.5}
					color="#fff"
				/>
			</button>

			{/* Image container */}
			<div
				style={{
					maxWidth: "90vw",
					maxHeight: "90vh",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<img
					src={src}
					alt={alt}
					style={{
						maxWidth: "100%",
						maxHeight: caption ? "calc(90vh - 40px)" : "90vh",
						objectFit: "contain",
						borderRadius: "4px",
						boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
						cursor: "default",
					}}
					onClick={(e) => e.stopPropagation()}
				/>
				{caption && (
					<p
						style={{
							marginTop: spacing.md,
							fontSize: typography.fontSize.sm,
							color: "rgba(255, 255, 255, 0.8)",
							textAlign: "center",
							fontStyle: "italic",
						}}
					>
						{caption}
					</p>
				)}
			</div>
		</div>
	);
};

export default ImageLightbox;
