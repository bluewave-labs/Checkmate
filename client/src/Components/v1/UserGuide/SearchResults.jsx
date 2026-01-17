import { FileText, ArrowRight } from "lucide-react";
import { searchArticles } from "./content/userGuideConfig";
import { useUserGuideTheme } from "./styles/useUserGuideTheme";
import "./SearchResults.css";

const SearchResults = ({ query, onNavigate, onClearSearch }) => {
	const { colors, typography, spacing, border } = useUserGuideTheme();
	const results = searchArticles(query);

	const handleResultClick = (result) => {
		onNavigate(result.collectionId, result.articleId);
		onClearSearch();
	};

	if (query.trim().length < 2) {
		return (
			<div style={{ padding: spacing.lg }}>
				<p
					style={{
						fontFamily: typography.fontFamily.sans,
						fontSize: typography.fontSize.sm,
						color: colors.text.muted,
						textAlign: "center",
						margin: 0,
					}}
				>
					Type at least 2 characters to search...
				</p>
			</div>
		);
	}

	if (results.length === 0) {
		return (
			<div style={{ padding: spacing.xl }}>
				<p
					style={{
						fontFamily: typography.fontFamily.sans,
						fontSize: typography.fontSize.base,
						color: colors.text.primary,
						textAlign: "center",
						marginBottom: spacing.sm,
						marginTop: 0,
					}}
				>
					No results found for "{query}"
				</p>
				<p
					style={{
						fontFamily: typography.fontFamily.sans,
						fontSize: typography.fontSize.sm,
						color: colors.text.muted,
						textAlign: "center",
						margin: 0,
					}}
				>
					Try different keywords or browse by topic
				</p>
			</div>
		);
	}

	return (
		<div style={{ padding: spacing.lg }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: spacing.md,
				}}
			>
				<span
					style={{
						fontFamily: typography.fontFamily.sans,
						fontSize: typography.fontSize.sm,
						color: colors.text.muted,
					}}
				>
					{results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
				</span>
				<button
					onClick={onClearSearch}
					style={{
						background: "none",
						border: "none",
						fontFamily: typography.fontFamily.sans,
						fontSize: typography.fontSize.sm,
						color: colors.brand.primary,
						cursor: "pointer",
						padding: 0,
					}}
				>
					Clear search
				</button>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
				{results.map((result) => (
					<div
						key={`${result.collectionId}-${result.articleId}`}
						onClick={() => handleResultClick(result)}
						className="user-guide-search-result-item"
						style={{
							display: "flex",
							alignItems: "flex-start",
							gap: spacing.md,
							padding: spacing.md,
							backgroundColor: colors.background.white,
							border: border.default,
							borderRadius: border.radius,
							cursor: "pointer",
						}}
					>
						<FileText
							size={16}
							strokeWidth={1.5}
							color={colors.text.muted}
							style={{ flexShrink: 0, marginTop: 2 }}
						/>
						<div style={{ flex: 1, minWidth: 0 }}>
							<span
								style={{
									display: "block",
									fontFamily: typography.fontFamily.sans,
									fontSize: typography.fontSize.base,
									fontWeight: typography.fontWeight.medium,
									color: colors.text.primary,
									marginBottom: 2,
								}}
							>
								{result.articleTitle}
							</span>
							<span
								style={{
									display: "block",
									fontFamily: typography.fontFamily.sans,
									fontSize: typography.fontSize.sm,
									color: colors.text.secondary,
									lineHeight: typography.lineHeight.normal,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{result.articleDescription}
							</span>
							<span
								style={{
									display: "block",
									fontFamily: typography.fontFamily.sans,
									fontSize: typography.fontSize.xs,
									color: colors.text.muted,
									marginTop: spacing.xs,
								}}
							>
								in {result.collectionTitle}
							</span>
						</div>
						<ArrowRight
							size={16}
							strokeWidth={1.5}
							color={colors.text.muted}
							style={{ flexShrink: 0, marginTop: 2 }}
						/>
					</div>
				))}
			</div>
		</div>
	);
};

export default SearchResults;
