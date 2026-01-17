import { useState, useEffect } from "react";
import {
	ChevronLeft,
	ChevronRight,
	Rocket,
	Globe,
	Gauge,
	Link,
	Bell,
	AlertTriangle,
	Settings,
	FileText,
} from "lucide-react";
import { useUserGuideTheme } from "./styles/useUserGuideTheme";
import "./ArticlePage.css";

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

const ArticlePage = ({
	collection,
	article,
	onBack,
	onBackToHome,
	onNextArticle,
	onPrevArticle,
	nextArticle,
	prevArticle,
	tocItems,
	children,
	mode = "in-app",
}) => {
	const { colors, typography, spacing, border, isDark } = useUserGuideTheme();
	const IconComponent = iconMap[collection.icon] || Rocket;
	const isInApp = mode === "in-app";
	const [activeSection, setActiveSection] = useState("");

	// Track active section on scroll
	useEffect(() => {
		if (!tocItems || tocItems.length === 0) return;

		const handleScroll = () => {
			const sections = tocItems
				.map((item) => {
					const id = item.href.replace("#", "");
					const element = document.getElementById(id);
					return { id: item.href, element };
				})
				.filter((s) => s.element);

			if (sections.length === 0) return;

			let currentSection = sections[0].id;

			for (const section of sections) {
				if (section.element) {
					const rect = section.element.getBoundingClientRect();
					if (rect.top <= 150) {
						currentSection = section.id;
					}
				}
			}

			setActiveSection(currentSection);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
		handleScroll();

		return () => {
			window.removeEventListener("scroll", handleScroll);
			document.removeEventListener("scroll", handleScroll, { capture: true });
		};
	}, [tocItems]);

	return (
		<div style={{ minHeight: "100%", backgroundColor: colors.background.alt }}>
			{/* Main content area */}
			<div
				style={{
					maxWidth: isInApp ? "100%" : 1100,
					margin: "0 auto",
					padding: isInApp ? spacing.lg : spacing["3xl"],
				}}
			>
				{/* Article Content */}
				<div style={{ maxWidth: isInApp ? "100%" : 680, minWidth: 0 }}>
					{/* Title */}
					<h1
						style={{
							fontFamily: typography.fontFamily.sans,
							fontSize: typography.fontSize["3xl"],
							fontWeight: typography.fontWeight.semibold,
							color: colors.text.primary,
							marginBottom: spacing.lg,
							lineHeight: typography.lineHeight.snug,
							marginTop: 0,
						}}
					>
						{article.title}
					</h1>

					{/* Description */}
					<p
						style={{
							fontFamily: typography.fontFamily.sans,
							fontSize: typography.fontSize.md,
							color: colors.text.secondary,
							marginBottom: spacing.lg,
							lineHeight: typography.lineHeight.normal,
							marginTop: 0,
						}}
					>
						{article.description}
					</p>

					{/* Table of Contents - at top */}
					{tocItems && tocItems.length > 0 && (
						<div
							style={{
								marginBottom: spacing["2xl"],
								paddingBottom: isInApp ? 0 : spacing.lg,
								borderBottom: isInApp ? "none" : border.default,
							}}
						>
							<div
								style={{
									backgroundColor: isInApp
										? isDark
											? "rgba(255, 255, 255, 0.05)"
											: "rgba(0, 0, 0, 0.02)"
										: "transparent",
									borderRadius: isInApp ? border.radius : 0,
									padding: isInApp ? spacing.md : 0,
									border: isInApp ? border.default : "none",
								}}
							>
								<span
									style={{
										display: "block",
										fontSize: 12,
										fontWeight: typography.fontWeight.semibold,
										color: colors.text.secondary,
										marginBottom: spacing.sm,
										textTransform: "uppercase",
										letterSpacing: "0.5px",
									}}
								>
									In this article
								</span>
								<div
									style={{
										display: "flex",
										flexDirection: isInApp ? "column" : "row",
										flexWrap: isInApp ? "nowrap" : "wrap",
										gap: isInApp ? 0 : spacing.xs,
										columnGap: isInApp ? 0 : spacing.lg,
									}}
								>
									{tocItems.map((item) => {
										const isActive = activeSection === item.href;
										return (
											<a
												key={item.href}
												href={item.href}
												className="user-guide-toc-link"
												onClick={(e) => {
													if (isInApp) {
														e.preventDefault();
														const id = item.href.replace("#", "");
														const element = document.getElementById(id);
														if (element) {
															element.scrollIntoView({
																behavior: "smooth",
																block: "start",
															});
														}
													}
												}}
												style={{
													fontFamily: typography.fontFamily.sans,
													fontSize: isInApp ? 13 : 12,
													color: isActive ? colors.brand.primary : colors.text.secondary,
													fontWeight: isActive
														? typography.fontWeight.medium
														: typography.fontWeight.normal,
													textDecoration: "none",
													padding: isInApp ? "2px 0" : `${spacing.xs} 0`,
												}}
											>
												{item.label}
											</a>
										);
									})}
								</div>
							</div>
						</div>
					)}

					{/* Article Body */}
					<div className="user-guide-article-body">
						{children || (
							<div
								style={{
									backgroundColor: colors.background.white,
									border: border.default,
									borderRadius: border.radius,
									padding: spacing.xl,
									textAlign: "center",
								}}
							>
								<span
									style={{ fontSize: typography.fontSize.sm, color: colors.text.muted }}
								>
									Article content coming soon.
								</span>
							</div>
						)}
					</div>

					{/* Navigation */}
					{(prevArticle || nextArticle) && (
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginTop: spacing["2xl"],
								paddingTop: spacing.xl,
								borderTop: border.default,
							}}
						>
							{prevArticle ? (
								<div
									onClick={onPrevArticle}
									className="user-guide-nav-button"
									style={{
										display: "flex",
										alignItems: "center",
										gap: spacing.sm,
										cursor: "pointer",
									}}
								>
									<ChevronLeft
										size={16}
										strokeWidth={1.5}
										color={colors.text.muted}
									/>
									<div>
										<span
											style={{
												display: "block",
												fontSize: typography.fontSize.xs,
												color: colors.text.muted,
											}}
										>
											Previous
										</span>
										<span
											className="nav-text"
											style={{
												display: "block",
												fontSize: typography.fontSize.sm,
												color: colors.text.primary,
												fontWeight: typography.fontWeight.medium,
											}}
										>
											{prevArticle.title}
										</span>
									</div>
								</div>
							) : (
								<div />
							)}
							{nextArticle && (
								<div
									onClick={onNextArticle}
									className="user-guide-nav-button"
									style={{
										display: "flex",
										alignItems: "center",
										gap: spacing.sm,
										textAlign: "right",
										cursor: "pointer",
									}}
								>
									<div>
										<span
											style={{
												display: "block",
												fontSize: typography.fontSize.xs,
												color: colors.text.muted,
											}}
										>
											Next
										</span>
										<span
											className="nav-text"
											style={{
												display: "block",
												fontSize: typography.fontSize.sm,
												color: colors.text.primary,
												fontWeight: typography.fontWeight.medium,
											}}
										>
											{nextArticle.title}
										</span>
									</div>
									<ChevronRight
										size={16}
										strokeWidth={1.5}
										color={colors.text.muted}
									/>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ArticlePage;
