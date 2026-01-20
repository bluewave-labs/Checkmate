import { useSelector } from "react-redux";

// CSS variable names for sidebar widths
const SIDEBAR_WIDTH_VAR = "var(--env-var-side-bar-width)";
const SIDEBAR_COLLAPSED_WIDTH_VAR = "var(--env-var-side-bar-collapsed-width)";

// Transition timing for sidebar width changes
const SIDEBAR_TRANSITION = "width 650ms cubic-bezier(0.36, -0.01, 0, 0.77)";

/**
 * Hook to get sidebar state and computed width
 * Centralizes sidebar width logic to avoid duplication between Sidebar and HomeLayout
 *
 * @returns {Object} Sidebar state and styles
 * @returns {boolean} collapsed - Whether the sidebar is collapsed
 * @returns {string} width - CSS width value based on collapsed state
 * @returns {string} transition - CSS transition for width changes
 */
export const useSidebar = () => {
	const collapsed = useSelector((state) => state.ui.sidebar?.collapsed ?? false);

	return {
		collapsed,
		width: collapsed ? SIDEBAR_COLLAPSED_WIDTH_VAR : SIDEBAR_WIDTH_VAR,
		transition: SIDEBAR_TRANSITION,
	};
};

export default useSidebar;
