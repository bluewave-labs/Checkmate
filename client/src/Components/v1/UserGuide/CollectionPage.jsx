import {
	ArrowRight,
	FileText,
	Rocket,
	Globe,
	Gauge,
	Link,
	Bell,
	AlertTriangle,
	Settings,
} from "lucide-react";
import { useUserGuideTheme } from "./styles/useUserGuideTheme";
import "./CollectionPage.css";

// Map icon names to actual Lucide components
const iconMap = {
	Rocket,
	Globe,
	Gauge,
	Link,
	Bell,
	AlertTriangle,
	Settings,
	FileText,
};

const CollectionPage = ({ collection, onBack, onArticleClick }) => {
	const { colors, typography, spacing, border } = useUserGuideTheme();
	const IconComponent = iconMap[collection.icon] || Rocket;

	return (
		<div style={{ minHeight: "100%", backgroundColor: colors.background.alt }}>
			{/* Header */}
			<div
				style={{
					backgroundColor: colors.background.white,
					borderBottom: border.default,
					padding: `${spacing.lg} ${spacing.lg}`,
				}}
			>
				<div style={{ maxWidth: 900, margin: "0 auto" }}>
					{/* Collection Header */}
					<div style={{ display: "flex", alignItems: "flex-start", gap: spacing.md }}>
						<IconComponent
							size={24}
							strokeWidth={1.5}
							color={colors.brand.primary}
							style={{ marginTop: 4 }}
						/>
						<div>
							<h1
								style={{
									fontFamily: typography.fontFamily.sans,
									fontSize: typography.fontSize["2xl"],
									fontWeight: typography.fontWeight.semibold,
									color: colors.text.primary,
									marginBottom: spacing.xs,
									marginTop: 0,
								}}
							>
								{collection.title}
							</h1>
							<p
								style={{
									fontFamily: typography.fontFamily.sans,
									fontSize: typography.fontSize.base,
									color: colors.text.secondary,
									lineHeight: typography.lineHeight.normal,
									margin: 0,
								}}
							>
								{collection.description}
							</p>
							<span
								style={{
									display: "block",
									fontSize: typography.fontSize.sm,
									color: colors.text.muted,
									marginTop: spacing.sm,
								}}
							>
								{collection.articleCount} articles in this collection
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Articles List */}
			<div
				style={{
					maxWidth: 900,
					margin: "0 auto",
					padding: `${spacing.lg} ${spacing.lg}`,
				}}
			>
				<div
					style={{
						backgroundColor: colors.background.white,
						border: border.default,
						borderRadius: border.radius,
						overflow: "hidden",
					}}
				>
					{collection.articles.map((article, index) => (
						<div
							key={article.id}
							onClick={() => onArticleClick(article.id)}
							className="user-guide-article-row"
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								padding: spacing.lg,
								borderBottom:
									index < collection.articles.length - 1 ? border.default : "none",
								cursor: "pointer",
							}}
						>
							<div
								style={{ display: "flex", alignItems: "flex-start", gap: spacing.md }}
							>
								<FileText
									size={16}
									strokeWidth={1.5}
									color={colors.text.muted}
									style={{ marginTop: 2, flexShrink: 0 }}
								/>
								<div>
									<span
										style={{
											display: "block",
											fontFamily: typography.fontFamily.sans,
											fontSize: typography.fontSize.base,
											fontWeight: typography.fontWeight.medium,
											color: colors.text.primary,
											marginBottom: spacing.xs,
										}}
									>
										{article.title}
									</span>
									<span
										style={{
											display: "block",
											fontFamily: typography.fontFamily.sans,
											fontSize: typography.fontSize.base,
											color: colors.text.secondary,
											lineHeight: typography.lineHeight.normal,
										}}
									>
										{article.description}
									</span>
								</div>
							</div>
							<ArrowRight
								className="arrow-icon"
								size={16}
								strokeWidth={1.5}
								color={colors.text.muted}
								style={{
									flexShrink: 0,
									marginLeft: 16,
								}}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default CollectionPage;
