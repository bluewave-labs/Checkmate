import { useState, useRef, useEffect } from "react";
import {
	Home,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Search,
	ExternalLink,
	X,
} from "lucide-react";
import { useUserGuideTheme } from "./styles/useUserGuideTheme";
import "./SidebarHeader.css";

const SidebarHeader = ({
	breadcrumbs,
	onHomeClick,
	onBack,
	onForward,
	canGoBack,
	canGoForward,
	onClose,
	onOpenInNewTab,
	isSearchOpen,
	onSearchToggle,
	searchQuery,
	onSearchChange,
	showOpenInNewTab = true,
	showNavigation = true,
}) => {
	const { colors, typography, spacing, border, isDark } = useUserGuideTheme();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);
	const searchInputRef = useRef(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Focus search input when opened
	useEffect(() => {
		if (isSearchOpen && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [isSearchOpen]);

	// Get current breadcrumb (last item)
	const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];

	return (
		<div
			style={{
				backgroundColor: colors.background.white,
				borderBottom: border.default,
				padding: `${spacing.sm} ${spacing.md}`,
			}}
		>
			{/* Main header row */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: spacing.sm,
				}}
			>
				{/* Left side: Navigation + Breadcrumb dropdown */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: spacing.xs,
						flex: 1,
						minWidth: 0,
					}}
				>
					{/* Navigation buttons - only shown when showNavigation is true */}
					{showNavigation && (
						<>
							{/* Back button */}
							<button
								onClick={onBack}
								disabled={!canGoBack}
								className="user-guide-header-icon-button"
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: 28,
									height: 28,
									backgroundColor: "transparent",
									border: "none",
									borderRadius: border.radius,
									cursor: canGoBack ? "pointer" : "default",
									color: canGoBack ? colors.text.secondary : colors.border.default,
									flexShrink: 0,
									opacity: canGoBack ? 1 : 0.5,
								}}
								title="Back"
							>
								<ChevronLeft size={16} strokeWidth={1.5} />
							</button>

							{/* Forward button */}
							<button
								onClick={onForward}
								disabled={!canGoForward}
								className="user-guide-header-icon-button"
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: 28,
									height: 28,
									backgroundColor: "transparent",
									border: "none",
									borderRadius: border.radius,
									cursor: canGoForward ? "pointer" : "default",
									color: canGoForward ? colors.text.secondary : colors.border.default,
									flexShrink: 0,
									opacity: canGoForward ? 1 : 0.5,
								}}
								title="Forward"
							>
								<ChevronRight size={16} strokeWidth={1.5} />
							</button>

							{/* Home button */}
							<button
								onClick={breadcrumbs.length > 1 ? onHomeClick : undefined}
								disabled={breadcrumbs.length <= 1}
								className="user-guide-header-icon-button"
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: 28,
									height: 28,
									backgroundColor: "transparent",
									border: "none",
									borderRadius: border.radius,
									cursor: breadcrumbs.length > 1 ? "pointer" : "default",
									color:
										breadcrumbs.length > 1
											? colors.text.secondary
											: colors.border.default,
									flexShrink: 0,
									opacity: breadcrumbs.length > 1 ? 1 : 0.5,
								}}
								title="Home"
							>
								<Home size={16} strokeWidth={1.5} />
							</button>
						</>
					)}

					{/* Breadcrumb dropdown */}
					<div
						ref={dropdownRef}
						style={{ position: "relative", flex: 1, minWidth: 0 }}
					>
						<button
							onClick={() =>
								breadcrumbs.length > 1 && setIsDropdownOpen(!isDropdownOpen)
							}
							className="user-guide-breadcrumb-dropdown-trigger"
							style={{
								display: "flex",
								alignItems: "center",
								gap: 4,
								padding: "4px 8px",
								backgroundColor: "transparent",
								border: "none",
								borderRadius: border.radius,
								cursor: breadcrumbs.length > 1 ? "pointer" : "default",
								maxWidth: "100%",
							}}
						>
							<span
								style={{
									fontFamily: typography.fontFamily.sans,
									fontSize: typography.fontSize.sm,
									fontWeight: typography.fontWeight.medium,
									color: colors.text.primary,
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{currentBreadcrumb?.label || "User guide"}
							</span>
							{breadcrumbs.length > 1 && (
								<ChevronDown
									size={14}
									strokeWidth={1.5}
									color={colors.text.muted}
									style={{
										flexShrink: 0,
										transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0)",
										transition: "transform 150ms ease",
									}}
								/>
							)}
						</button>

						{/* Dropdown menu */}
						{isDropdownOpen && breadcrumbs.length > 1 && (
							<div
								className="user-guide-breadcrumb-dropdown"
								style={{
									position: "absolute",
									top: "100%",
									left: 0,
									marginTop: 4,
									backgroundColor: colors.background.white,
									border: border.default,
									borderRadius: border.radius,
									boxShadow: isDark ? "0 4px 12px rgba(0, 0, 0, 0.3)" : "0 4px 12px rgba(0, 0, 0, 0.1)",
									minWidth: 180,
									maxWidth: 280,
									zIndex: 100,
									overflow: "hidden",
								}}
							>
								{breadcrumbs.slice(0, -1).map((item, index) => (
									<button
										key={index}
										onClick={() => {
											item.onClick();
											setIsDropdownOpen(false);
										}}
										className="user-guide-breadcrumb-item"
										style={{
											display: "block",
											width: "100%",
											padding: "10px 14px",
											backgroundColor: "transparent",
											border: "none",
											textAlign: "left",
											cursor: "pointer",
											fontFamily: typography.fontFamily.sans,
											fontSize: typography.fontSize.sm,
											color: colors.text.primary,
										}}
									>
										{item.label}
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Right side: Actions */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: spacing.xs,
						flexShrink: 0,
					}}
				>
					{/* Open in new tab - only shown when showOpenInNewTab is true */}
					{showOpenInNewTab && (
						<button
							onClick={onOpenInNewTab}
							className="user-guide-header-icon-button"
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: 28,
								height: 28,
								backgroundColor: "transparent",
								border: "none",
								borderRadius: border.radius,
								cursor: "pointer",
								color: colors.text.secondary,
							}}
							title="Open in new tab"
						>
							<ExternalLink size={16} strokeWidth={1.5} />
						</button>
					)}

					{/* Search toggle */}
					<button
						onClick={onSearchToggle}
						className={`user-guide-header-icon-button ${isSearchOpen ? "active" : ""}`}
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: 28,
							height: 28,
							backgroundColor: isSearchOpen ? colors.background.alt : "transparent",
							border: "none",
							borderRadius: border.radius,
							cursor: "pointer",
							color: isSearchOpen ? colors.brand.primary : colors.text.secondary,
						}}
						title="Search"
					>
						<Search size={16} strokeWidth={1.5} />
					</button>

					{/* Close button */}
					<button
						onClick={onClose}
						className="user-guide-header-icon-button"
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: 28,
							height: 28,
							backgroundColor: "transparent",
							border: "none",
							borderRadius: border.radius,
							cursor: "pointer",
							color: colors.text.secondary,
						}}
						title="Close"
					>
						<X size={16} strokeWidth={1.5} />
					</button>
				</div>
			</div>

			{/* Search input (collapsible) */}
			{isSearchOpen && (
				<div style={{ marginTop: spacing.sm }}>
					<div style={{ position: "relative" }}>
						<Search
							size={14}
							strokeWidth={1.5}
							color={colors.text.muted}
							style={{
								position: "absolute",
								left: 10,
								top: "50%",
								transform: "translateY(-50%)",
								pointerEvents: "none",
							}}
						/>
						<input
							ref={searchInputRef}
							type="text"
							placeholder="Search articles..."
							value={searchQuery}
							onChange={(e) => onSearchChange(e.target.value)}
							className="user-guide-search-input"
							style={{
								width: "100%",
								height: 32,
								fontSize: typography.fontSize.sm,
								fontFamily: typography.fontFamily.sans,
								backgroundColor: colors.background.alt,
								borderRadius: border.radius,
								border: border.default,
								paddingLeft: 32,
								paddingRight: 12,
								boxSizing: "border-box",
								color: colors.text.primary,
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default SidebarHeader;
