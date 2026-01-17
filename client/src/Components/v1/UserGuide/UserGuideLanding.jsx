import {
	ArrowRight,
	Rocket,
	Globe,
	Gauge,
	Server,
	Bell,
	AlertTriangle,
	Settings,
	Wifi,
	Wrench,
	Users,
} from "lucide-react";
import { collections, fastFinds, getCollection } from "./content/userGuideConfig";
import { useUserGuideTheme } from "./styles/useUserGuideTheme";
import "./UserGuideLanding.css";

// Map icon names to actual Lucide components
const iconMap = {
	Rocket,
	Globe,
	Gauge,
	Server,
	Bell,
	AlertTriangle,
	Settings,
	Wifi,
	Wrench,
	Users,
};

const UserGuideLanding = ({
	onNavigate,
	searchQuery,
	onSearchChange,
	mode = "in-app",
}) => {
	const { colors, typography, spacing, border } = useUserGuideTheme();
	const isInApp = mode === "in-app";

	return (
		<div style={{ minHeight: "100%", backgroundColor: colors.background.alt }}>
			{/* Main Content */}
			<div
				style={{
					maxWidth: isInApp ? "100%" : 1200,
					margin: "0 auto",
					padding: isInApp ? spacing.lg : `${spacing["3xl"]} ${spacing["3xl"]}`,
				}}
			>
				{/* Collections Grid */}
				<h2
					style={{
						fontFamily: typography.fontFamily.sans,
						fontSize: isInApp ? typography.fontSize.lg : typography.fontSize.xl,
						fontWeight: typography.fontWeight.semibold,
						color: colors.text.primary,
						marginBottom: isInApp ? spacing.md : spacing.xl,
						marginTop: 0,
					}}
				>
					Browse by topic
				</h2>

				<div
					style={{
						display: "grid",
						gridTemplateColumns: isInApp
							? "1fr"
							: "repeat(auto-fill, minmax(340px, 1fr))",
						gap: isInApp ? spacing.md : spacing.lg,
						marginBottom: isInApp ? spacing.xl : spacing["4xl"],
					}}
				>
					{collections.map((collection) => {
						const IconComponent = iconMap[collection.icon] || Rocket;
						return (
							<div
								key={collection.id}
								onClick={() => onNavigate(collection.id)}
								className="user-guide-collection-card"
								style={{
									backgroundColor: colors.background.white,
									border: border.default,
									borderRadius: border.radius,
									padding: spacing.lg,
									cursor: "pointer",
								}}
							>
								<div
									style={{ display: "flex", alignItems: "flex-start", gap: spacing.md }}
								>
									<IconComponent
										size={20}
										strokeWidth={1.5}
										color={colors.brand.primary}
									/>
									<div style={{ flex: 1 }}>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												marginBottom: spacing.xs,
											}}
										>
											<span
												style={{
													fontFamily: typography.fontFamily.sans,
													fontSize: typography.fontSize.base,
													fontWeight: typography.fontWeight.semibold,
													color: colors.text.primary,
												}}
											>
												{collection.title}
											</span>
											<span
												style={{
													fontSize: typography.fontSize.xs,
													color: colors.text.secondary,
													backgroundColor: colors.background.alt,
													padding: "2px 6px",
													borderRadius: border.radius,
												}}
											>
												{collection.articleCount} articles
											</span>
										</div>
										<span
											style={{
												fontFamily: typography.fontFamily.sans,
												fontSize: typography.fontSize.base,
												color: colors.text.secondary,
												lineHeight: typography.lineHeight.normal,
												display: "block",
											}}
										>
											{collection.description}
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{/* About our docs - Only shown in in-app mode */}
				{isInApp && (
					<div
						style={{
							backgroundColor: colors.background.white,
							border: border.default,
							borderRadius: border.radius,
							padding: spacing.lg,
						}}
					>
						<h3
							style={{
								fontFamily: typography.fontFamily.sans,
								fontSize: typography.fontSize.base,
								fontWeight: typography.fontWeight.semibold,
								color: colors.text.primary,
								marginBottom: spacing.md,
								marginTop: 0,
							}}
						>
							About our docs
						</h3>
						<p
							style={{
								fontFamily: typography.fontFamily.sans,
								fontSize: typography.fontSize.sm,
								color: colors.text.secondary,
								lineHeight: typography.lineHeight.normal,
								margin: 0,
								marginBottom: spacing.md,
							}}
						>
							There are a few ways to explore our docs:
						</p>

						<div style={{ marginBottom: spacing.md }}>
							<h4
								style={{
									fontFamily: typography.fontFamily.sans,
									fontSize: typography.fontSize.sm,
									fontWeight: typography.fontWeight.semibold,
									color: colors.text.primary,
									marginBottom: spacing.xs,
									marginTop: 0,
								}}
							>
								In the product
							</h4>
							<p
								style={{
									fontFamily: typography.fontFamily.sans,
									fontSize: typography.fontSize.sm,
									color: colors.text.secondary,
									lineHeight: typography.lineHeight.normal,
									margin: 0,
								}}
							>
								Look for help icons and tooltips throughout the interface.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default UserGuideLanding;
