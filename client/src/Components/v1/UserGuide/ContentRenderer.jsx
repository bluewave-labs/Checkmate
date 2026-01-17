import { useState } from "react";
import { useUserGuideTheme } from "./styles/useUserGuideTheme";
import ImageLightbox from "./ImageLightbox";
import {
	CheckCircle,
	Clock,
	Rocket,
	Shield,
	Brain,
	AlertTriangle,
	Server,
	Database,
	Terminal,
	FileText,
	FolderKanban,
	Gauge,
	LayoutDashboard,
	Menu,
	Settings,
	Info,
	Lightbulb,
	ArrowRight,
	Globe,
	Bell,
	Link,
} from "lucide-react";
import "./ContentRenderer.css";

// Icon mapping
const iconMap = {
	CheckCircle,
	Clock,
	Rocket,
	Shield,
	Brain,
	AlertTriangle,
	Server,
	Database,
	Terminal,
	FileText,
	FolderKanban,
	Gauge,
	LayoutDashboard,
	Menu,
	Settings,
	Info,
	Lightbulb,
	Globe,
	Bell,
	Link,
};

const getIcon = (name) => iconMap[name] || Info;

const ContentRenderer = ({ content, onNavigate }) => {
	const { colors, typography, spacing, border, chipStyles, imageStyles, isDark } = useUserGuideTheme();
	const [lightboxImage, setLightboxImage] = useState(null);

	// Parse basic markdown in text (inside component to access onNavigate)
	const parseMarkdown = (text) => {
		const parts = [];
		let key = 0;

		// Supports: **bold**, `code`, [[link text]](collection/article)
		const combinedRegex = /\*\*([^*]+)\*\*|`([^`]+)`|\[\[([^\]]+)\]\]\(([^)]+)\)/g;
		let lastIndex = 0;
		let match;

		const getChipStyle = (codeContent) => {
			const isUrl = /^https?:\/\//.test(codeContent);
			return isUrl ? chipStyles.url : chipStyles.code;
		};

		while ((match = combinedRegex.exec(text)) !== null) {
			if (match.index > lastIndex) {
				parts.push(text.slice(lastIndex, match.index));
			}

			if (match[1]) {
				// Bold: **text**
				parts.push(<strong key={key++}>{match[1]}</strong>);
			} else if (match[2]) {
				// Code: `text`
				const style = getChipStyle(match[2]);
				parts.push(
					<span key={key++} style={style}>
						{match[2]}
					</span>
				);
			} else if (match[3] && match[4]) {
				// Article link: [[text]](collection/article)
				const linkText = match[3];
				const linkPath = match[4];
				const [collectionId, articleId] = linkPath.split("/");
				parts.push(
					<span
						key={key++}
						onClick={() => onNavigate?.(collectionId, articleId)}
						style={{
							color: colors.brand.primary,
							cursor: "pointer",
							textDecoration: "underline",
							textDecorationColor: "transparent",
							transition: "text-decoration-color 150ms ease",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.textDecorationColor = colors.brand.primary;
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.textDecorationColor = "transparent";
						}}
					>
						{linkText}
					</span>
				);
			}

			lastIndex = match.index + match[0].length;
		}

		if (lastIndex < text.length) {
			parts.push(text.slice(lastIndex));
		}

		return parts.length > 0 ? parts : text;
	};

	const renderBlock = (block, index) => {
		switch (block.type) {
			case "heading":
				return renderHeading(block, index);
			case "paragraph":
				return renderParagraph(block, index);
			case "callout":
				return renderCallout(block, index);
			case "bullet-list":
				return renderBulletList(block, index);
			case "ordered-list":
				return renderOrderedList(block, index);
			case "checklist":
				return renderChecklist(block, index);
			case "icon-cards":
				return renderIconCards(block, index);
			case "grid-cards":
				return renderGridCards(block, index);
			case "time-estimate":
				return renderTimeEstimate(block, index);
			case "info-box":
				return renderInfoBox(block, index);
			case "code":
				return renderCode(block, index);
			case "requirements":
				return renderRequirements(block, index);
			case "table":
				return renderTable(block, index);
			case "image":
				return renderImage(block, index);
			case "article-links":
				return renderArticleLinks(block, index);
			default:
				return null;
		}
	};

	const renderHeading = (block, index) => {
		const Tag = block.level === 2 ? "h2" : "h3";
		return (
			<Tag
				key={index}
				id={block.id}
				style={{
					fontFamily: typography.fontFamily.sans,
					fontSize:
						block.level === 2 ? typography.fontSize["2xl"] : typography.fontSize.lg,
					fontWeight: typography.fontWeight.semibold,
					color: colors.text.primary,
					marginBottom: spacing.lg,
					marginTop: index > 0 ? spacing["2xl"] : 0,
					lineHeight: typography.lineHeight.normal,
				}}
			>
				{block.text}
			</Tag>
		);
	};

	const renderParagraph = (block, index) => (
		<p
			key={index}
			style={{
				fontFamily: typography.fontFamily.sans,
				fontSize: typography.fontSize.base,
				color: colors.text.secondary,
				lineHeight: typography.lineHeight.relaxed,
				marginBottom: spacing.lg,
				marginTop: 0,
			}}
		>
			{parseMarkdown(block.text)}
		</p>
	);

	const renderCallout = (block, index) => {
		const calloutColors = {
			info: colors.brand.primary,
			tip: colors.brand.primary,
			warning: colors.brand.warning,
			success: colors.brand.success,
		};
		const accentColor = calloutColors[block.variant || "info"];

		return (
			<div
				key={index}
				style={{
					border: border.default,
					borderLeftWidth: "3px",
					borderLeftColor: accentColor,
					backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
					paddingLeft: spacing.lg,
					paddingTop: spacing.md,
					paddingBottom: spacing.md,
					paddingRight: spacing.lg,
					borderRadius: border.radius,
					marginBottom: spacing["2xl"],
				}}
			>
				{block.title && (
					<span
						style={{
							display: "block",
							fontSize: typography.fontSize.base,
							fontWeight: typography.fontWeight.semibold,
							color: colors.text.primary,
							marginBottom: spacing.xs,
						}}
					>
						{block.title}
					</span>
				)}
				<span
					style={{
						display: "block",
						fontSize: typography.fontSize.base,
						color: colors.text.secondary,
						lineHeight: typography.lineHeight.normal,
					}}
				>
					{parseMarkdown(block.text)}
				</span>
			</div>
		);
	};

	const renderBulletList = (block, index) => (
		<ul
			key={index}
			className="user-guide-content-list"
			style={{
				paddingLeft: spacing.xl,
				marginBottom: spacing["2xl"],
				marginTop: 0,
			}}
		>
			{block.items.map((item, i) => (
				<li
					key={i}
					style={{
						fontSize: typography.fontSize.base,
						color: colors.text.secondary,
						lineHeight: typography.lineHeight.normal,
						marginBottom: spacing.sm,
					}}
				>
					{item.bold && (
						<strong style={{ color: colors.text.primary }}>{item.bold}</strong>
					)}
					{item.bold && <span style={{ color: colors.text.secondary }}> — </span>}
					<span style={{ color: colors.text.secondary }}>
						{item.bold ? parseMarkdown(item.text) : parseMarkdown(item.text)}
					</span>
				</li>
			))}
		</ul>
	);

	const renderOrderedList = (block, index) => (
		<ol
			key={index}
			className="user-guide-content-list"
			style={{
				paddingLeft: spacing.xl,
				marginBottom: spacing.lg,
				marginTop: 0,
			}}
		>
			{block.items.map((item, i) => (
				<li
					key={i}
					style={{
						fontSize: typography.fontSize.base,
						color: colors.text.secondary,
						lineHeight: typography.lineHeight.normal,
						marginBottom: spacing.sm,
					}}
				>
					{item.bold && (
						<strong style={{ color: colors.text.primary }}>{item.bold}</strong>
					)}
					{item.bold && " "}
					<span style={{ color: colors.text.secondary }}>
						{item.bold ? parseMarkdown(item.text) : parseMarkdown(item.text)}
					</span>
				</li>
			))}
		</ol>
	);

	const renderChecklist = (block, index) => (
		<div key={index} style={{ marginBottom: spacing["2xl"], paddingLeft: spacing.sm }}>
			{block.items.map((item, i) => (
				<div
					key={i}
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "flex-start",
						gap: "10px",
						marginBottom: spacing.sm,
					}}
				>
					<CheckCircle
						size={16}
						strokeWidth={1.5}
						color={colors.brand.primary}
						style={{ flexShrink: 0, marginTop: 3 }}
					/>
					<span
						style={{
							fontSize: typography.fontSize.base,
							color: colors.text.secondary,
							lineHeight: typography.lineHeight.tight,
						}}
					>
						{parseMarkdown(item)}
					</span>
				</div>
			))}
		</div>
	);

	const renderIconCards = (block, index) => (
		<div
			key={index}
			style={{
				display: "flex",
				flexDirection: "column",
				gap: spacing.md,
				marginBottom: spacing["2xl"],
			}}
		>
			{block.items.map((item, i) => {
				const IconComponent = getIcon(item.icon);
				return (
					<div
						key={i}
						style={{
							display: "flex",
							gap: spacing.md,
							padding: spacing.sm,
							backgroundColor: colors.background.white,
							border: border.default,
							borderRadius: border.radius,
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
								width: "20px",
								height: "22px",
							}}
						>
							<IconComponent size={20} strokeWidth={1.5} color={colors.brand.primary} />
						</div>
						<div>
							<span
								style={{
									display: "block",
									fontSize: typography.fontSize.md,
									fontWeight: typography.fontWeight.semibold,
									color: colors.text.primary,
									lineHeight: "22px",
									marginBottom: "2px",
								}}
							>
								{item.title}
							</span>
							<span
								style={{
									display: "block",
									fontSize: typography.fontSize.base,
									color: colors.text.secondary,
									lineHeight: typography.lineHeight.normal,
								}}
							>
								{parseMarkdown(item.description)}
							</span>
						</div>
					</div>
				);
			})}
		</div>
	);

	const renderGridCards = (block, index) => (
		<div
			key={index}
			style={{
				display: "grid",
				gridTemplateColumns: `repeat(auto-fit, minmax(${block.columns === 2 ? "250px" : "200px"}, 1fr))`,
				gap: spacing.md,
				marginBottom: spacing["2xl"],
			}}
		>
			{block.items.map((item, i) => {
				const IconComponent = item.icon ? getIcon(item.icon) : null;
				return (
					<div
						key={i}
						style={{
							padding: "14px",
							backgroundColor: colors.background.white,
							border: border.default,
							borderRadius: border.radius,
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "flex-start",
								gap: spacing.sm,
								marginBottom: "6px",
							}}
						>
							{IconComponent && (
								<span
									style={{
										display: "inline-flex",
										alignItems: "center",
										justifyContent: "center",
										flexShrink: 0,
										width: "16px",
										height: "18px",
									}}
								>
									<IconComponent
										size={16}
										strokeWidth={1.5}
										color={colors.brand.primary}
									/>
								</span>
							)}
							<span
								style={{
									fontSize: typography.fontSize.base,
									fontWeight: typography.fontWeight.semibold,
									color: colors.text.primary,
									lineHeight: "18px",
								}}
							>
								{item.title}
							</span>
						</div>
						<span
							style={{
								display: "block",
								fontSize: typography.fontSize.xs,
								color: colors.text.secondary,
								lineHeight: typography.lineHeight.snug,
							}}
						>
							{parseMarkdown(item.description)}
						</span>
					</div>
				);
			})}
		</div>
	);

	const renderTimeEstimate = (block, index) => (
		<div
			key={index}
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: spacing.sm,
				padding: `${spacing.md} ${spacing.lg}`,
				backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
				border: border.default,
				borderRadius: border.radius,
				marginBottom: spacing.xl,
			}}
		>
			<span
				style={{
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					flexShrink: 0,
					height: "20px",
				}}
			>
				<Clock size={16} strokeWidth={1.5} color={colors.brand.primary} />
			</span>
			<span
				style={{
					fontSize: typography.fontSize.base,
					color: colors.text.primary,
					lineHeight: "20px",
					display: "inline-flex",
					alignItems: "center",
				}}
			>
				{parseMarkdown(block.text)}
			</span>
		</div>
	);

	const renderInfoBox = (block, index) => {
		const IconComponent = block.icon ? getIcon(block.icon) : FolderKanban;
		return (
			<div
				key={index}
				style={{
					display: "flex",
					gap: spacing.md,
					padding: spacing.lg,
					backgroundColor: colors.background.white,
					border: border.default,
					borderRadius: border.radius,
					marginBottom: spacing.lg,
				}}
			>
				<IconComponent
					size={20}
					strokeWidth={1.5}
					color={colors.brand.primary}
					style={{ flexShrink: 0, marginTop: 2 }}
				/>
				<div>
					<span
						style={{
							display: "block",
							fontSize: typography.fontSize.md,
							fontWeight: typography.fontWeight.semibold,
							color: colors.text.primary,
							marginBottom: spacing.sm,
						}}
					>
						{block.title}
					</span>
					<ul style={{ margin: 0, paddingLeft: "20px" }}>
						{block.items.map((item, i) => (
							<li
								key={i}
								style={{
									fontSize: typography.fontSize.sm,
									color: colors.text.secondary,
									lineHeight: typography.lineHeight.normal,
									marginBottom: spacing.xs,
								}}
							>
								{parseMarkdown(item)}
							</li>
						))}
					</ul>
				</div>
			</div>
		);
	};

	const renderCode = (block, index) => (
		<div
			key={index}
			style={{
				backgroundColor: colors.background.code,
				borderRadius: border.radius,
				padding: "14px 16px",
				overflow: "auto",
				marginBottom: spacing.lg,
			}}
		>
			<pre
				style={{
					fontSize: typography.fontSize.sm,
					fontFamily: typography.fontFamily.mono,
					color: "#E5E7EB",
					margin: 0,
					whiteSpace: "pre-wrap",
					wordBreak: "break-all",
				}}
			>
				{block.code}
			</pre>
		</div>
	);

	const renderRequirements = (block, index) => (
		<div
			key={index}
			style={{
				display: "flex",
				flexDirection: "column",
				gap: spacing.md,
				marginBottom: spacing["2xl"],
			}}
		>
			{block.items.map((req, i) => {
				const IconComponent = getIcon(req.icon);
				return (
					<div
						key={i}
						style={{
							padding: spacing.lg,
							backgroundColor: colors.background.white,
							border: border.default,
							borderRadius: border.radius,
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: spacing.sm,
								marginBottom: spacing.md,
							}}
						>
							<IconComponent
								size={16}
								strokeWidth={1.5}
								color={colors.brand.primary}
								style={{ flexShrink: 0 }}
							/>
							<span
								style={{
									fontSize: typography.fontSize.base,
									fontWeight: typography.fontWeight.semibold,
									color: colors.text.primary,
								}}
							>
								{req.title}
							</span>
						</div>
						<ul style={{ margin: 0, paddingLeft: "20px" }}>
							{req.items.map((item, j) => (
								<li
									key={j}
									style={{
										fontSize: typography.fontSize.sm,
										color: colors.text.secondary,
										lineHeight: typography.lineHeight.normal,
										marginBottom: spacing.xs,
									}}
								>
									{item}
								</li>
							))}
						</ul>
					</div>
				);
			})}
		</div>
	);

	const renderTableCell = (value) => {
		if (value === "✓") {
			return (
				<span
					style={{
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						width: 20,
						height: 20,
						borderRadius: "50%",
						backgroundColor: "rgba(19, 113, 91, 0.2)",
						color: colors.brand.primary,
						fontSize: typography.fontSize.sm,
						fontWeight: typography.fontWeight.semibold,
					}}
				>
					✓
				</span>
			);
		}
		if (value === "✗" || value === "—") {
			return (
				<span
					style={{
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						width: 20,
						height: 20,
						borderRadius: "50%",
						backgroundColor: "rgba(102, 112, 133, 0.2)",
						color: colors.text.muted,
						fontSize: typography.fontSize.sm,
					}}
				>
					—
				</span>
			);
		}
		return parseMarkdown(value);
	};

	const renderTable = (block, index) => (
		<div
			key={index}
			style={{
				border: border.default,
				borderRadius: border.radius,
				overflow: "hidden",
				marginBottom: spacing["2xl"],
			}}
		>
			{/* Header */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: block.columns.map((col) => col.width || "1fr").join(" "),
					backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
					borderBottom: border.default,
					padding: `${spacing.md} ${spacing.lg}`,
					gap: spacing.md,
				}}
			>
				{block.columns.map((col) => (
					<span
						key={col.key}
						style={{
							fontSize: typography.fontSize.sm,
							fontWeight: typography.fontWeight.semibold,
							color: colors.text.primary,
							lineHeight: typography.lineHeight.tight,
						}}
					>
						{col.label}
					</span>
				))}
			</div>
			{/* Rows */}
			{block.rows.map((row, i) => (
				<div
					key={i}
					className="user-guide-table-row"
					style={{
						display: "grid",
						gridTemplateColumns: block.columns.map((col) => col.width || "1fr").join(" "),
						borderBottom: i < block.rows.length - 1 ? border.default : "none",
						backgroundColor: i % 2 === 1 ? (isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)") : "transparent",
						padding: `10px ${spacing.lg}`,
						gap: spacing.md,
						alignItems: "center",
					}}
				>
					{block.columns.map((col, j) => (
						<div
							key={col.key}
							style={{
								fontSize: typography.fontSize.sm,
								fontWeight:
									j === 0 ? typography.fontWeight.medium : typography.fontWeight.normal,
								color: j === 0 ? colors.text.primary : colors.text.secondary,
								lineHeight: typography.lineHeight.normal,
							}}
						>
							{renderTableCell(row[col.key])}
						</div>
					))}
				</div>
			))}
		</div>
	);

	const renderImage = (block, index) => (
		<div
			key={index}
			style={{
				marginBottom: spacing["2xl"],
			}}
		>
			<img
				src={block.src}
				alt={block.alt}
				onClick={() =>
					setLightboxImage({ src: block.src, alt: block.alt, caption: block.caption })
				}
				style={{
					...imageStyles.image,
					cursor: "zoom-in",
				}}
			/>
			{block.caption && (
				<p
					style={{
						...imageStyles.caption,
						marginTop: spacing.sm,
						marginBottom: 0,
					}}
				>
					{block.caption}
				</p>
			)}
		</div>
	);

	const renderArticleLinks = (block, index) => (
		<div key={index} style={{ marginBottom: spacing["2xl"] }}>
			<div
				style={{
					height: "1px",
					backgroundColor: colors.border.default,
					marginBottom: spacing.xl,
				}}
			/>
			{block.title && (
				<span
					style={{
						display: "block",
						fontFamily: typography.fontFamily.sans,
						fontSize: typography.fontSize.lg,
						fontWeight: typography.fontWeight.semibold,
						color: colors.text.primary,
						marginBottom: spacing.md,
					}}
				>
					{block.title}
				</span>
			)}
			<div style={{ display: "flex", flexDirection: "column" }}>
				{block.items.map((item, i) => (
					<div
						key={i}
						onClick={() => onNavigate?.(item.collectionId, item.articleId)}
						className="user-guide-article-link-item"
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: spacing.sm,
							margin: `0 -${spacing.sm}`,
							borderRadius: "4px",
							cursor: "pointer",
						}}
					>
						<span
							className="link-title"
							style={{
								fontFamily: typography.fontFamily.sans,
								fontSize: typography.fontSize.base,
								fontWeight: typography.fontWeight.medium,
								color: colors.text.primary,
							}}
						>
							{item.title}
						</span>
						<ArrowRight
							className="arrow-icon"
							size={18}
							strokeWidth={1.5}
							color={colors.text.muted}
							style={{ flexShrink: 0, marginLeft: 16 }}
						/>
					</div>
				))}
			</div>
		</div>
	);

	return (
		<>
			<div>{content.blocks.map((block, index) => renderBlock(block, index))}</div>

			{/* Image Lightbox */}
			{lightboxImage && (
				<ImageLightbox
					src={lightboxImage.src}
					alt={lightboxImage.alt}
					caption={lightboxImage.caption}
					onClose={() => setLightboxImage(null)}
				/>
			)}
		</>
	);
};

export default ContentRenderer;
