import { ExternalLink } from "lucide-react";
import { useUserGuideTheme } from "./styles/useUserGuideTheme";
import "./HelpSection.css";

const HelpSection = () => {
	const { colors, typography, spacing, border } = useUserGuideTheme();

	return (
		<div
			style={{
				padding: spacing.xl,
				minHeight: "100%",
			}}
		>
			{/* Contact us */}
			<div style={{ marginBottom: spacing["2xl"] }}>
				<h2
					style={{
						fontFamily: typography.fontFamily.sans,
						fontSize: typography.fontSize.lg,
						fontWeight: typography.fontWeight.semibold,
						color: colors.text.primary,
						marginBottom: spacing.sm,
						marginTop: 0,
					}}
				>
					Contact us
				</h2>
				<p
					style={{
						fontFamily: typography.fontFamily.sans,
						fontSize: typography.fontSize.base,
						color: colors.text.secondary,
						lineHeight: typography.lineHeight.normal,
						margin: 0,
						marginBottom: spacing.md,
					}}
				>
					Can't find what you need? Our support team is here to help.
				</p>
				<a
					href="https://discord.com/invite/NAb6H3UTjK"
					target="_blank"
					rel="noopener noreferrer"
					className="user-guide-help-button"
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: spacing.sm,
						width: "100%",
						padding: `${spacing.md} ${spacing.lg}`,
						backgroundColor: colors.background.white,
						border: border.default,
						borderRadius: border.radius,
						textDecoration: "none",
						cursor: "pointer",
						fontFamily: typography.fontFamily.sans,
						fontSize: typography.fontSize.base,
						fontWeight: typography.fontWeight.medium,
						color: colors.text.primary,
					}}
				>
					Join our Discord
					<ExternalLink size={14} strokeWidth={1.5} color={colors.text.muted} />
				</a>
			</div>

			{/* Ask the community */}
			<div>
				<h2
					style={{
						fontFamily: typography.fontFamily.sans,
						fontSize: typography.fontSize.lg,
						fontWeight: typography.fontWeight.semibold,
						color: colors.text.primary,
						marginBottom: spacing.sm,
						marginTop: 0,
					}}
				>
					GitHub discussions
				</h2>
				<p
					style={{
						fontFamily: typography.fontFamily.sans,
						fontSize: typography.fontSize.base,
						color: colors.text.secondary,
						lineHeight: typography.lineHeight.normal,
						margin: 0,
						marginBottom: spacing.md,
					}}
				>
					Questions about features, how-tos, or use cases? Join the community discussion.
				</p>
				<a
					href="https://github.com/bluewave-labs/checkmate/discussions"
					target="_blank"
					rel="noopener noreferrer"
					className="user-guide-help-button"
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: spacing.sm,
						width: "100%",
						padding: `${spacing.md} ${spacing.lg}`,
						backgroundColor: colors.background.white,
						border: border.default,
						borderRadius: border.radius,
						textDecoration: "none",
						cursor: "pointer",
						fontFamily: typography.fontFamily.sans,
						fontSize: typography.fontSize.base,
						fontWeight: typography.fontWeight.medium,
						color: colors.text.primary,
					}}
				>
					GitHub discussions
					<ExternalLink size={14} strokeWidth={1.5} color={colors.text.muted} />
				</a>
			</div>
		</div>
	);
};

export default HelpSection;
